interface SchemaField {
  key: string;
  type?: string;
}

interface FieldSchema {
  fields?: SchemaField[];
}

export interface ExtractedSkill {
  name: string;
  normalized: string;
}

/**
 * Extract skill names from credential metadata.
 *
 * Strategy:
 * 1. If `metadata.skills` is an array of strings, use those.
 * 2. For any field in `field_schema` with type === 'skills' or whose key is
 *    'skills', collect array values from metadata.
 * 3. Also treat common single-value skill-like fields (`major`, `subject`,
 *    `specialization`) as skills so degrees still contribute to matching.
 *
 * All names are trimmed; duplicates are removed by normalized (lowercased) form.
 */
export function extractSkillsFromMetadata(
  metadata: Record<string, unknown>,
  fieldSchema: Record<string, unknown> | null | undefined,
): ExtractedSkill[] {
  const byNormalized = new Map<string, ExtractedSkill>();

  const add = (raw: unknown): void => {
    if (typeof raw !== 'string') return;
    const name = raw.trim();
    if (!name) return;
    const normalized = name.toLowerCase();
    if (!byNormalized.has(normalized)) {
      byNormalized.set(normalized, { name, normalized });
    }
  };

  // 1. metadata.skills as array.
  const metaSkills = metadata?.skills;
  if (Array.isArray(metaSkills)) {
    for (const s of metaSkills) add(s);
  }

  // 2. Fields of type 'skills' in field_schema.
  const schema = (fieldSchema ?? {}) as FieldSchema;
  const fields = Array.isArray(schema.fields) ? schema.fields : [];
  for (const field of fields) {
    if (!field?.key) continue;
    if (field.type === 'skills' || field.key === 'skills') {
      const value = metadata?.[field.key];
      if (Array.isArray(value)) {
        for (const s of value) add(s);
      }
    }
  }

  // 3. Common single-value skill-like fields.
  const SKILL_LIKE_KEYS = ['major', 'subject', 'specialization'];
  for (const key of SKILL_LIKE_KEYS) {
    add(metadata?.[key]);
  }

  return [...byNormalized.values()];
}
