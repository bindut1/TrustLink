import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drops the unused `match_scores` table.
 *
 * It was designed as a cache of candidate↔job match scores, but matching is
 * now computed live via embeddings (candidate_embeddings / job_embeddings).
 * The table is never read or written by application code, and its staleness
 * triggers on `credentials` / `candidate_skills` were adding pure write
 * overhead. Remove the triggers, the trigger function, then the table.
 */
export class DropMatchScores1712448000013 implements MigrationInterface {
  name = 'DropMatchScores1712448000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trg_candidate_skills_match_scores_stale ON "candidate_skills"`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trg_credentials_match_scores_stale ON "credentials"`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS trustlink_mark_match_scores_stale()`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "match_scores"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate table + indexes (mirrors 1712448000000-InitialSchema).
    await queryRunner.query(`
      CREATE TABLE "match_scores" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "candidate_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "job_id" UUID NOT NULL REFERENCES "jobs"("id") ON DELETE CASCADE,
        "keyword_score" NUMERIC(5,2) NOT NULL DEFAULT 0,
        "semantic_score" NUMERIC(5,2) NOT NULL DEFAULT 0,
        "verified_bonus" NUMERIC(5,2) NOT NULL DEFAULT 0,
        "total_score" NUMERIC(5,2) NOT NULL DEFAULT 0,
        "computed_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "is_stale" BOOLEAN NOT NULL DEFAULT FALSE,
        CONSTRAINT "uq_match_scores_candidate_job" UNIQUE ("candidate_id","job_id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_match_scores_total_score" ON "match_scores"("total_score")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_match_scores_is_stale" ON "match_scores"("is_stale")`,
    );

    // Recreate the staleness trigger function and its triggers.
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION trustlink_mark_match_scores_stale()
      RETURNS TRIGGER AS $$
      DECLARE
        v_candidate_id UUID;
      BEGIN
        IF (TG_OP = 'DELETE') THEN
          v_candidate_id := OLD.candidate_id;
        ELSE
          v_candidate_id := NEW.candidate_id;
        END IF;

        IF v_candidate_id IS NOT NULL THEN
          UPDATE "match_scores"
            SET "is_stale" = TRUE
            WHERE "candidate_id" = v_candidate_id AND "is_stale" = FALSE;
        END IF;

        IF (TG_OP = 'DELETE') THEN
          RETURN OLD;
        ELSE
          RETURN NEW;
        END IF;
      END;
      $$ LANGUAGE plpgsql;
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_credentials_match_scores_stale
      AFTER INSERT OR UPDATE OR DELETE ON "credentials"
      FOR EACH ROW
      EXECUTE FUNCTION trustlink_mark_match_scores_stale();
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_candidate_skills_match_scores_stale
      AFTER INSERT OR UPDATE OR DELETE ON "candidate_skills"
      FOR EACH ROW
      EXECUTE FUNCTION trustlink_mark_match_scores_stale();
    `);
  }
}
