import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tier 1 (Blockcerts-parity plan):
 *  - credentials.hash_version: lets verification recompute the credential hash
 *    with the same scheme it was issued with (legacy JSON.stringify vs canonical
 *    JCS). New issuance writes 'v2-jcs'; existing rows stay null (legacy).
 *  - verification_cache.content_integrity_valid: caches the new "recomputed hash
 *    matches anchored hash" check.
 *
 * Existing verification_cache rows are cleared because they were computed before
 * the content-integrity check existed; keeping them could surface a stale VALID
 * without the new guard. The cache simply repopulates on next verify.
 */
export class AddHashVersionAndContentIntegrity1712448000004
  implements MigrationInterface
{
  name = 'AddHashVersionAndContentIntegrity1712448000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "credentials" ADD COLUMN IF NOT EXISTS "hash_version" varchar(16)`,
    );
    await queryRunner.query(
      `ALTER TABLE "verification_cache" ADD COLUMN IF NOT EXISTS "content_integrity_valid" boolean NOT NULL DEFAULT false`,
    );
    // One-time invalidation: drop pre-integrity-check cache entries.
    await queryRunner.query(`DELETE FROM "verification_cache"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "verification_cache" DROP COLUMN IF EXISTS "content_integrity_valid"`,
    );
    await queryRunner.query(
      `ALTER TABLE "credentials" DROP COLUMN IF EXISTS "hash_version"`,
    );
  }
}
