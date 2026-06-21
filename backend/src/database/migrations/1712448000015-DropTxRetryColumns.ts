import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Removes the retry machinery from blockchain_transactions. The `retry_count` /
 * `max_retries` columns and the `retrying` status only ever mattered to the Bull
 * auto-retry queue, which was deleted once issuance/revocation moved to
 * issuer-signed on-chain transactions. Nothing writes them anymore.
 */
export class DropTxRetryColumns1712448000015 implements MigrationInterface {
  name = 'DropTxRetryColumns1712448000015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "blockchain_transactions" DROP COLUMN IF EXISTS "retry_count"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blockchain_transactions" DROP COLUMN IF EXISTS "max_retries"`,
    );

    // Drop the 'retrying' value from the tx_status enum. Postgres cannot remove
    // an enum value in place, so rebuild the type. Any orphaned 'retrying' row
    // (left over from the old queue) is reclassified as 'failed' first. The two
    // indexes that reference `status` must be dropped/recreated around the swap.
    await queryRunner.query(
      `UPDATE "blockchain_transactions" SET "status" = 'failed' WHERE "status" = 'retrying'`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_blockchain_transactions_queued"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_blockchain_transactions_status"`);
    await queryRunner.query(
      `ALTER TABLE "blockchain_transactions" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(`ALTER TYPE "tx_status" RENAME TO "tx_status_old"`);
    await queryRunner.query(
      `CREATE TYPE "tx_status" AS ENUM ('queued','submitted','confirmed','failed')`,
    );
    await queryRunner.query(
      `ALTER TABLE "blockchain_transactions" ALTER COLUMN "status" TYPE "tx_status" USING "status"::text::"tx_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blockchain_transactions" ALTER COLUMN "status" SET DEFAULT 'queued'`,
    );
    await queryRunner.query(`DROP TYPE "tx_status_old"`);
    await queryRunner.query(
      `CREATE INDEX "idx_blockchain_transactions_status" ON "blockchain_transactions"("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_blockchain_transactions_queued" ON "blockchain_transactions"("queued_at") WHERE status = 'queued'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore the 'retrying' enum value via the same rebuild dance.
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_blockchain_transactions_queued"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_blockchain_transactions_status"`);
    await queryRunner.query(
      `ALTER TABLE "blockchain_transactions" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(`ALTER TYPE "tx_status" RENAME TO "tx_status_old"`);
    await queryRunner.query(
      `CREATE TYPE "tx_status" AS ENUM ('queued','submitted','confirmed','failed','retrying')`,
    );
    await queryRunner.query(
      `ALTER TABLE "blockchain_transactions" ALTER COLUMN "status" TYPE "tx_status" USING "status"::text::"tx_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blockchain_transactions" ALTER COLUMN "status" SET DEFAULT 'queued'`,
    );
    await queryRunner.query(`DROP TYPE "tx_status_old"`);
    await queryRunner.query(
      `CREATE INDEX "idx_blockchain_transactions_status" ON "blockchain_transactions"("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_blockchain_transactions_queued" ON "blockchain_transactions"("queued_at") WHERE status = 'queued'`,
    );

    await queryRunner.query(
      `ALTER TABLE "blockchain_transactions" ADD COLUMN "retry_count" SMALLINT NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "blockchain_transactions" ADD COLUMN "max_retries" SMALLINT NOT NULL DEFAULT 3`,
    );
  }
}
