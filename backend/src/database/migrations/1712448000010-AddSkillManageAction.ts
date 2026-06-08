import { MigrationInterface, QueryRunner } from 'typeorm';

/** RBAC action for managing the skill catalog, granted to admin. */
export class AddSkillManageAction1712448000010 implements MigrationInterface {
  name = 'AddSkillManageAction1712448000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "actions" ("code","name","description","module")
       VALUES ('skill.manage','Manage skill catalog','Create/edit the canonical skill catalog','skills')
       ON CONFLICT ("code") DO NOTHING`,
    );
    await queryRunner.query(
      `INSERT INTO "role_actions" ("role","action_id")
       SELECT 'admin'::"user_role", "id" FROM "actions" WHERE "code" = 'skill.manage'
       ON CONFLICT ON CONSTRAINT "uq_role_actions_role_action" DO NOTHING`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "role_actions" WHERE "action_id" IN (
         SELECT "id" FROM "actions" WHERE "code" = 'skill.manage'
       )`,
    );
    await queryRunner.query(
      `DELETE FROM "actions" WHERE "code" = 'skill.manage'`,
    );
  }
}
