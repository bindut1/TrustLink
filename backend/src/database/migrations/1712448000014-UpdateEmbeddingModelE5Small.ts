import { MigrationInterface, QueryRunner } from 'typeorm';

const NEW_DEFAULT = 'intfloat/multilingual-e5-small';
const OLD_DEFAULT = 'paraphrase-multilingual-MiniLM-L12-v2';

/**
 * Switch the embedding model from the 128-token MiniLM model to
 * `intfloat/multilingual-e5-small` (512-token context, same 384 dimensions so
 * no vector-column change is needed).
 *
 * As with the previous default migration, existing rows are left untouched:
 * their `model_version` records which model produced the stored vector. Those
 * old 384-dim vectors live in a DIFFERENT vector space and are NOT comparable
 * with the new model's output — they must be regenerated out-of-band via
 * `npm run export:scores -- --build-embeddings` before matching is valid again.
 * This migration only updates the schema-level default.
 */
export class UpdateEmbeddingModelE5Small1712448000014 implements MigrationInterface {
  name = 'UpdateEmbeddingModelE5Small1712448000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "candidate_embeddings" ALTER COLUMN "model_version" SET DEFAULT '${NEW_DEFAULT}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_embeddings" ALTER COLUMN "model_version" SET DEFAULT '${NEW_DEFAULT}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "candidate_embeddings" ALTER COLUMN "model_version" SET DEFAULT '${OLD_DEFAULT}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_embeddings" ALTER COLUMN "model_version" SET DEFAULT '${OLD_DEFAULT}'`,
    );
  }
}
