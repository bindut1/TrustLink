import { MigrationInterface, QueryRunner } from 'typeorm';

/** Additional common skills for the catalog. Additive + idempotent. */
const EXTRA: Array<[string, string, string, string[]]> = [
  ['redis', 'Redis', 'database', []],
  ['mongodb', 'MongoDB', 'database', ['mongo']],
  ['mysql', 'MySQL', 'database', []],
  ['graphql', 'GraphQL', 'backend', []],
  ['django', 'Django', 'backend', []],
  ['flask', 'Flask', 'backend', []],
  ['kafka', 'Apache Kafka', 'data', ['apache kafka']],
  ['tensorflow', 'TensorFlow', 'data', ['tf']],
  ['grafana', 'Grafana', 'devops', []],
  ['jenkins', 'Jenkins', 'devops', []],
  ['git', 'Git', 'devops', []],
  ['azure', 'Azure', 'cloud', ['microsoft azure']],
  ['gcp', 'Google Cloud', 'cloud', ['google cloud platform', 'google cloud']],
  ['go', 'Go', 'language', ['golang']],
  ['rust', 'Rust', 'language', []],
  ['php', 'PHP', 'language', []],
  ['c#', 'C#', 'language', ['csharp']],
  ['vue', 'Vue.js', 'frontend', ['vuejs', 'vue.js']],
  ['angular', 'Angular', 'frontend', ['angularjs']],
  ['redux', 'Redux', 'frontend', []],
  ['kotlin', 'Kotlin', 'mobile', []],
  ['swift', 'Swift', 'mobile', []],
  ['fastlane', 'Fastlane', 'mobile', []],
  ['playwright', 'Playwright', 'testing', []],
  ['selenium', 'Selenium', 'testing', []],
  ['k6', 'k6', 'testing', []],
];

export class ExpandSkillCatalog1712448000009 implements MigrationInterface {
  name = 'ExpandSkillCatalog1712448000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [normalized, name, category, aliases] of EXTRA) {
      await queryRunner.query(
        `INSERT INTO "skill_catalog" ("normalized", "name", "category", "aliases")
         VALUES ($1, $2, $3, $4::text[])
         ON CONFLICT ("normalized") DO NOTHING`,
        [normalized, name, category, aliases],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const normals = EXTRA.map(([n]) => n);
    await queryRunner.query(
      `DELETE FROM "skill_catalog" WHERE "normalized" = ANY($1::text[])`,
      [normals],
    );
  }
}
