import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tier 2 (T2.4) — StatusList2021 revocation. Each issued credential gets a slot
 * (status_list_id, status_list_index); flipping `revoked` marks it revoked in
 * the public bitstring. Individual revocation lives here because on-chain Merkle
 * anchoring can only revoke a whole batch.
 */
export class CreateStatusListEntries1712448000006
  implements MigrationInterface
{
  name = 'CreateStatusListEntries1712448000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "status_list_entries" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "credential_id" uuid NOT NULL,
        "status_list_id" integer NOT NULL DEFAULT 1,
        "status_list_index" integer NOT NULL,
        "revoked" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_status_list_entries" PRIMARY KEY ("id"),
        CONSTRAINT "uq_status_list_entry_slot" UNIQUE ("status_list_id", "status_list_index")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_status_list_entry_credential" ON "status_list_entries" ("credential_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_status_list_entry_credential"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "status_list_entries"`);
  }
}
