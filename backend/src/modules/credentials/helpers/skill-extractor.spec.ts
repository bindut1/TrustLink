import { extractSkillsFromMetadata } from './skill-extractor';

describe('extractSkillsFromMetadata', () => {
  it('extracts skills from metadata.skills', () => {
    const skills = extractSkillsFromMetadata(
      { skills: ['React', 'Node.js'] },
      null,
    );
    expect(skills).toEqual([
      { name: 'React', normalized: 'react' },
      { name: 'Node.js', normalized: 'node.js' },
    ]);
  });

  it('dedupes by normalized form, keeping the first display name', () => {
    const skills = extractSkillsFromMetadata(
      { skills: ['React', 'react', ' REACT '] },
      null,
    );
    expect(skills).toEqual([{ name: 'React', normalized: 'react' }]);
  });

  it('ignores non-string and empty entries', () => {
    const skills = extractSkillsFromMetadata(
      { skills: ['React', 42, null, '', '   ', { name: 'x' }] },
      null,
    );
    expect(skills).toEqual([{ name: 'React', normalized: 'react' }]);
  });

  it('extracts from schema fields of type "skills" under a custom key', () => {
    const skills = extractSkillsFromMetadata(
      { competencies: ['Docker', 'K8s'] },
      { fields: [{ key: 'competencies', type: 'skills' }] },
    );
    expect(skills.map((s) => s.normalized)).toEqual(['docker', 'k8s']);
  });

  it('does NOT extract free-text fields (major/subject are not skills)', () => {
    const skills = extractSkillsFromMetadata(
      { major: 'Computer Science', subject: 'Math' },
      {
        fields: [
          { key: 'major', type: 'text' },
          { key: 'subject', type: 'text' },
        ],
      },
    );
    expect(skills).toEqual([]);
  });

  it('merges metadata.skills with schema skill fields without duplicates', () => {
    const skills = extractSkillsFromMetadata(
      { skills: ['React'], certSkills: ['react', 'GraphQL'] },
      { fields: [{ key: 'certSkills', type: 'skills' }] },
    );
    expect(skills.map((s) => s.normalized)).toEqual(['react', 'graphql']);
  });

  it('handles missing skills key, non-array values, and malformed schema', () => {
    expect(extractSkillsFromMetadata({}, null)).toEqual([]);
    expect(extractSkillsFromMetadata({ skills: 'React' }, null)).toEqual([]);
    expect(
      extractSkillsFromMetadata(
        { skills: ['React'] },
        { fields: 'not-an-array' },
      ),
    ).toEqual([{ name: 'React', normalized: 'react' }]);
  });
});
