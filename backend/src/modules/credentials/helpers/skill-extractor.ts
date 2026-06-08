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
 * Extract skill names from credential metadata — ONLY from explicit skill fields:
 * `metadata.skills` arrays and field_schema fields of type/key 'skills'.
 * Free-text fields (major/subject) are intentionally NOT treated as skills (they
 * produced coarse tokens that never matched a JD). Deduped by normalized form.
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

  return [...byNormalized.values()];
}
