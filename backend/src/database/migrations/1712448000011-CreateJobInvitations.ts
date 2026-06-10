import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Recruiter → candidate job invitations ("offers"). One row per (job,
 * candidate); message is the recruiter's note; status tracks pending/declined.
 */
export class CreateJobInvitations1712448000011 implements MigrationInterface {
  name = 'CreateJobInvitations1712448000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "job_invitation_status" AS ENUM ('pending', 'declined');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "job_invitations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "job_id" uuid NOT NULL,
        "candidate_id" uuid NOT NULL,
        "recruiter_id" uuid NOT NULL,
        "message" text,
        "status" "job_invitation_status" NOT NULL DEFAULT 'pending',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_job_invitations" PRIMARY KEY ("id"),
        CONSTRAINT "uq_job_invitations_job_candidate" UNIQUE ("job_id", "candidate_id"),
        CONSTRAINT "fk_job_invitations_job" FOREIGN KEY ("job_id")
          REFERENCES "jobs" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_job_invitations_candidate" FOREIGN KEY ("candidate_id")
          REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_job_invitations_recruiter" FOREIGN KEY ("recruiter_id")
          REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_job_invitations_candidate_id" ON "job_invitations" ("candidate_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_job_invitations_job_id" ON "job_invitations" ("job_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "job_invitations"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "job_invitation_status"`);
  }
}
