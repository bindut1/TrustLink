import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Option B (per-leaf revocation): the issuer signs `revokeLeaf` from their own
 * wallet, producing a revoke transaction distinct from the issuance anchor
 * (`blockchain_tx_hash`). Store it so the UI can show the tx hash matching the
 * credential's current status — issuance tx while issued, revoke tx once revoked.
 */
export class AddRevokeTxHashToCredentials1712448000007
  implements MigrationInterface
{
  name = 'AddRevokeTxHashToCredentials1712448000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "credentials" ADD COLUMN IF NOT EXISTS "revoke_tx_hash" varchar(66)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "credentials" DROP COLUMN IF EXISTS "revoke_tx_hash"`,
    );
  }
}
