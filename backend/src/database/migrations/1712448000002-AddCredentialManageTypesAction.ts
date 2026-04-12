import { MigrationInterface, QueryRunner } from 'typeorm';

const ACTION_CODE = 'credential.manage_types';

export class AddCredentialManageTypesAction1712448000002
  implements MigrationInterface
{
  name = 'AddCredentialManageTypesAction1712448000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "actions" ("code","name","description","module")
       VALUES ($1,$2,$3,$4)
       ON CONFLICT ("code") DO NOTHING`,
      [
        ACTION_CODE,
        'Manage credential types',
        'Create and update credential type definitions (field_schema)',
        'credentials',
      ],
    );

    // Grant to admin role.
    await queryRunner.query(
      `INSERT INTO "role_actions" ("role","action_id")
       SELECT 'admin'::"user_role", "id" FROM "actions" WHERE "code" = $1
       ON CONFLICT ON CONSTRAINT "uq_role_actions_role_action" DO NOTHING`,
      [ACTION_CODE],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "role_actions" WHERE "action_id" IN (
         SELECT "id" FROM "actions" WHERE "code" = $1
       )`,
      [ACTION_CODE],
    );
    await queryRunner.query(`DELETE FROM "actions" WHERE "code" = $1`, [
      ACTION_CODE,
    ]);
  }
}
