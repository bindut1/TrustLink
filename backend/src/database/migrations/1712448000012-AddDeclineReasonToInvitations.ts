import { MigrationInterface, QueryRunner } from 'typeorm';

/** Optional reason a candidate gives when declining a job invitation. */
export class AddDeclineReasonToInvitations1712448000012
  implements MigrationInterface
{
  name = 'AddDeclineReasonToInvitations1712448000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "job_invitations" ADD COLUMN IF NOT EXISTS "decline_reason" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "job_invitations" DROP COLUMN IF EXISTS "decline_reason"`,
    );
  }
}
