import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Canonical skill vocabulary. `normalized` is the match key; `aliases` resolve
 * variants to it. Seeded here (like actions) so it survives SEED_RESET.
 */
const CATALOG: Array<[string, string, string, string[]]> = [
  // normalized (match key), display name, category, aliases
  ['nodejs', 'Node.js', 'backend', ['node', 'node.js']],
  ['nestjs', 'NestJS', 'backend', ['nest.js']],
  ['express', 'Express.js', 'backend', ['expressjs', 'express.js']],
  ['spring boot', 'Spring Boot', 'backend', ['springboot']],
  ['rest api', 'REST API', 'backend', ['restful api']],
  ['firebase', 'Firebase', 'backend', []],
  ['typescript', 'TypeScript', 'language', ['ts']],
  ['javascript', 'JavaScript', 'language', ['js']],
  ['python', 'Python', 'language', []],
  ['java', 'Java', 'language', []],
  ['react', 'React', 'frontend', ['reactjs', 'react.js']],
  ['nextjs', 'Next.js', 'frontend', ['next', 'next.js']],
  ['tailwindcss', 'Tailwind CSS', 'frontend', ['tailwind']],
  ['react native', 'React Native', 'mobile', ['reactnative']],
  ['mobile', 'Mobile Development', 'mobile', []],
  ['postgresql', 'PostgreSQL', 'database', ['postgres', 'psql']],
  ['sql', 'SQL', 'database', []],
  ['aws', 'AWS', 'cloud', ['amazon web services']],
  ['terraform', 'Terraform', 'devops', []],
  ['docker', 'Docker', 'devops', []],
  ['kubernetes', 'Kubernetes', 'devops', ['k8s']],
  ['ci/cd', 'CI/CD', 'devops', ['cicd']],
  ['linux', 'Linux', 'devops', []],
  ['spark', 'Apache Spark', 'data', ['apache spark']],
  ['airflow', 'Apache Airflow', 'data', ['apache airflow']],
  ['pytorch', 'PyTorch', 'data', []],
  ['machine learning', 'Machine Learning', 'data', ['ml']],
  ['nlp', 'NLP', 'data', ['natural language processing']],
  ['cypress', 'Cypress', 'testing', []],
  ['automation testing', 'Automation Testing', 'testing', ['test automation']],
  ['english', 'English', 'language', []],
];

export class CreateSkillCatalog1712448000008 implements MigrationInterface {
  name = 'CreateSkillCatalog1712448000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "skill_catalog" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "normalized" varchar(255) NOT NULL,
        "name" varchar(255) NOT NULL,
        "category" varchar(64),
        "aliases" text[] NOT NULL DEFAULT '{}',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_skill_catalog" PRIMARY KEY ("id"),
        CONSTRAINT "uq_skill_catalog_normalized" UNIQUE ("normalized")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_skill_catalog_aliases" ON "skill_catalog" USING GIN ("aliases")`,
    );

    for (const [normalized, name, category, aliases] of CATALOG) {
      await queryRunner.query(
        `INSERT INTO "skill_catalog" ("normalized", "name", "category", "aliases")
         VALUES ($1, $2, $3, $4::text[])
         ON CONFLICT ("normalized") DO NOTHING`,
        [normalized, name, category, aliases],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_skill_catalog_aliases"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "skill_catalog"`);
  }
}
