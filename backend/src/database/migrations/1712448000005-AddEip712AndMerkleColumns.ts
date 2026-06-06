import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tier 2 (Blockcerts-parity):
 *  - institutions.signing_address: the institution's own MetaMask address that
 *    signs VCs (EthereumEip712Signature2021) and broadcasts batch anchors.
 *  - credentials.merkle_root / merkle_proof / leaf_index: Merkle batching — the
 *    credential's canonical hash is a leaf under merkle_root (anchored on-chain),
 *    with merkle_proof proving membership.
 */
export class AddEip712AndMerkleColumns1712448000005
  implements MigrationInterface
{
  name = 'AddEip712AndMerkleColumns1712448000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "institutions" ADD COLUMN IF NOT EXISTS "signing_address" varchar(42)`,
    );
    await queryRunner.query(
      `ALTER TABLE "credentials" ADD COLUMN IF NOT EXISTS "merkle_root" varchar(66)`,
    );
    await queryRunner.query(
      `ALTER TABLE "credentials" ADD COLUMN IF NOT EXISTS "merkle_proof" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "credentials" ADD COLUMN IF NOT EXISTS "leaf_index" integer`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_credentials_merkle_root" ON "credentials" ("merkle_root")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_credentials_merkle_root"`,
    );
    await queryRunner.query(
      `ALTER TABLE "credentials" DROP COLUMN IF EXISTS "leaf_index"`,
    );
    await queryRunner.query(
      `ALTER TABLE "credentials" DROP COLUMN IF EXISTS "merkle_proof"`,
    );
    await queryRunner.query(
      `ALTER TABLE "credentials" DROP COLUMN IF EXISTS "merkle_root"`,
    );
    await queryRunner.query(
      `ALTER TABLE "institutions" DROP COLUMN IF EXISTS "signing_address"`,
    );
  }
}
