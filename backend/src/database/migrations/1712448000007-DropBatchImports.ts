import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Remove the legacy custodial Excel batch-import feature: drop the
 * credentials.batch_import_id FK/column and the batch_imports table. Non-custodial
 * bulk issuance (Merkle + issuer-signed) replaces it.
 */
export class DropBatchImports1712448000007 implements MigrationInterface {
  name = 'DropBatchImports1712448000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "credentials" DROP COLUMN IF EXISTS "batch_import_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "batch_imports"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Legacy table — not recreated on rollback.
    await queryRunner.query(
      `ALTER TABLE "credentials" ADD COLUMN IF NOT EXISTS "batch_import_id" uuid`,
    );
  }
}
