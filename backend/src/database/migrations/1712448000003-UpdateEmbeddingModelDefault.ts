import { MigrationInterface, QueryRunner } from 'typeorm';

const NEW_DEFAULT = 'paraphrase-multilingual-MiniLM-L12-v2';
const OLD_DEFAULT = 'all-MiniLM-L6-v2';

/**
 * Align the column DEFAULT for `model_version` with the AI service's actual
 * model. Existing rows are intentionally left untouched: their `model_version`
 * value is historical fact about which model produced their vector — flipping
 * the string without re-encoding would lie about the data. The matching code
 * already writes the correct value on every upsert; this migration only fixes
 * the schema-level default so it stops drifting back when other tooling
 * inserts a row without setting the column.
 */
export class UpdateEmbeddingModelDefault1712448000003 implements MigrationInterface {
  name = 'UpdateEmbeddingModelDefault1712448000003';

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
