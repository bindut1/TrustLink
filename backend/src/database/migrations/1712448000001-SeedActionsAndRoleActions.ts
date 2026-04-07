import { MigrationInterface, QueryRunner } from 'typeorm';

interface ActionSeed {
  code: string;
  name: string;
  description: string;
  module: string;
}

const ACTIONS: ActionSeed[] = [
  // credentials module
  {
    code: 'credential.view',
    name: 'View credentials',
    description: 'View credential records',
    module: 'credentials',
  },
  {
    code: 'credential.download',
    name: 'Download credential',
    description: 'Download VC JSON / PDF copy',
    module: 'credentials',
  },
  {
    code: 'credential.issue',
    name: 'Issue credential',
    description: 'Issue a new credential to a candidate',
    module: 'credentials',
  },
  {
    code: 'credential.revoke',
    name: 'Revoke credential',
    description: 'Revoke a previously issued credential',
    module: 'credentials',
  },
  {
    code: 'credential.batch_import',
    name: 'Batch import credentials',
    description: 'Upload Excel to issue multiple credentials at once',
    module: 'credentials',
  },
  {
    code: 'credential.verify',
    name: 'Verify credential',
    description: 'Run blockchain + VC signature verification',
    module: 'credentials',
  },

  // jobs module
  {
    code: 'job.create',
    name: 'Create job',
    description: 'Create a new job posting',
    module: 'jobs',
  },
  {
    code: 'job.edit',
    name: 'Edit job',
    description: 'Edit an existing job posting',
    module: 'jobs',
  },
  {
    code: 'job.view',
    name: 'View jobs',
    description: 'Browse / search job postings',
    module: 'jobs',
  },

  // applications module
  {
    code: 'application.create',
    name: 'Apply to job',
    description: 'Submit an application',
    module: 'applications',
  },
  {
    code: 'application.review',
    name: 'Review applications',
    description: 'View and update applicants for a job',
    module: 'applications',
  },

  // matching module
  {
    code: 'matching.view',
    name: 'View matching',
    description: 'View AI match scores and recommendations',
    module: 'matching',
  },

  // admin module
  {
    code: 'admin.users',
    name: 'Manage users',
    description: 'List, search, suspend, override permissions',
    module: 'admin',
  },
  {
    code: 'admin.institutions',
    name: 'Manage institutions',
    description: 'Approve / reject institutions',
    module: 'admin',
  },
  {
    code: 'admin.blockchain',
    name: 'Monitor blockchain',
    description: 'View blockchain transaction queue',
    module: 'admin',
  },
  {
    code: 'admin.dashboard',
    name: 'Admin dashboard',
    description: 'Access system stats and audit logs',
    module: 'admin',
  },
];

const ROLE_ACTION_MAP: Record<string, string[]> = {
  candidate: [
    'credential.view',
    'credential.download',
    'credential.verify',
    'application.create',
    'job.view',
    'matching.view',
  ],
  issuer: [
    'credential.view',
    'credential.issue',
    'credential.revoke',
    'credential.batch_import',
    'credential.verify',
  ],
  recruiter: [
    'credential.view',
    'credential.verify',
    'job.create',
    'job.edit',
    'job.view',
    'application.review',
    'matching.view',
  ],
  // admin: ALL actions, populated programmatically below.
  admin: ACTIONS.map((a) => a.code),
};

export class SeedActionsAndRoleActions1712448000001
  implements MigrationInterface
{
  name = 'SeedActionsAndRoleActions1712448000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert actions (idempotent on code).
    for (const action of ACTIONS) {
      await queryRunner.query(
        `INSERT INTO "actions" ("code","name","description","module")
         VALUES ($1,$2,$3,$4)
         ON CONFLICT ("code") DO NOTHING`,
        [action.code, action.name, action.description, action.module],
      );
    }

    // Insert role_actions mapping.
    for (const [role, codes] of Object.entries(ROLE_ACTION_MAP)) {
      for (const code of codes) {
        await queryRunner.query(
          `INSERT INTO "role_actions" ("role","action_id")
           SELECT $1::"user_role", "id" FROM "actions" WHERE "code" = $2
           ON CONFLICT ON CONSTRAINT "uq_role_actions_role_action" DO NOTHING`,
          [role, code],
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const codes = ACTIONS.map((a) => a.code);
    await queryRunner.query(
      `DELETE FROM "role_actions" WHERE "action_id" IN (
         SELECT "id" FROM "actions" WHERE "code" = ANY($1::text[])
       )`,
      [codes],
    );
    await queryRunner.query(
      `DELETE FROM "actions" WHERE "code" = ANY($1::text[])`,
      [codes],
    );
  }
}
