import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds `is_self_declared` to `candidate_skills`. It records whether the
 * candidate added the skill themselves, INDEPENDENTLY of whether it is also
 * backed by a credential right now. This is what lets revocation tell the two
 * cases apart:
 *   - self-declared then verified by a credential -> on revoke, REVERT to a
 *     claimed skill (source_credential_id = null, is_verified = false);
 *   - skill that only ever came from the credential -> on revoke, DELETE it.
 *
 * Backfill: existing rows with no source credential are self-declared; rows
 * sourced from a credential are not.
 */
export class AddSelfDeclaredSkillFlag1712448000017
  implements MigrationInterface
{
  name = 'AddSelfDeclaredSkillFlag1712448000017';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "candidate_skills" ADD COLUMN IF NOT EXISTS "is_self_declared" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `UPDATE "candidate_skills" SET "is_self_declared" = true WHERE "source_credential_id" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "candidate_skills" DROP COLUMN IF EXISTS "is_self_declared"`,
    );
  }
}
