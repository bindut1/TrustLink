import { BadRequestException } from '@nestjs/common';

interface SchemaField {
  key: string;
  label?: string;
  type?: string;
  required?: boolean;
  options?: unknown[];
}

interface FieldSchema {
  fields?: SchemaField[];
}

/**
 * Validates credential `metadata` against the owning credential type's
 * `field_schema`. Throws BadRequestException listing all missing required fields.
 */
export function validateCredentialMetadata(
  metadata: Record<string, unknown>,
  fieldSchema: Record<string, unknown> | null | undefined,
): void {
  const schema = (fieldSchema ?? {}) as FieldSchema;
  const fields = Array.isArray(schema.fields) ? schema.fields : [];
  const errors: string[] = [];

  for (const field of fields) {
    if (!field?.key) continue;
    if (!field.required) continue;

    const value = metadata?.[field.key];
    const missing =
      value === undefined ||
      value === null ||
      (typeof value === 'string' && value.trim() === '') ||
      (Array.isArray(value) && value.length === 0);

    if (missing) {
      errors.push(`Field '${field.key}' is required`);
    }
  }

  if (errors.length > 0) {
    throw new BadRequestException({
      message: 'Invalid credential metadata',
      errors,
    });
  }
}
