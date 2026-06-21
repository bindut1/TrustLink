import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drops two redundant columns from `credentials`:
 *   - `vc_jwt`            — leftover from the abandoned JWT-VC design; never
 *                           written or read (credentials use the JSON-LD
 *                           `vc_json` + EthereumEip712Signature2021 proof).
 *   - `digital_signature` — write-only; duplicated `vc_json.proof.proofValue`,
 *                           which is the authoritative signature location.
 */
export class DropDeadCredentialColumns1712448000016
  implements MigrationInterface
{
  name = 'DropDeadCredentialColumns1712448000016';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "credentials" DROP COLUMN IF EXISTS "vc_jwt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "credentials" DROP COLUMN IF EXISTS "digital_signature"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "credentials" ADD COLUMN "vc_jwt" TEXT`,
    );
    await queryRunner.query(
      `ALTER TABLE "credentials" ADD COLUMN "digital_signature" TEXT`,
    );
  }
}
