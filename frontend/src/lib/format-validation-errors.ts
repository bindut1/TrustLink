/**
 * Turns class-validator messages from the backend into user-friendly strings.
 *
 *   "email must be an email"                              → "Email must be a valid email"
 *   "password must be longer than or equal to 8 characters" → "Password must be at least 8 characters"
 *   "fullName should not be empty"                        → "Full name should not be empty"
 *
 * Strategy: replace the leading camelCase field name with a friendly label,
 * apply pattern rewrites for awkward phrases, and capitalize the first letter.
 */

const FIELD_LABELS: Record<string, string> = {
  email: "Email",
  password: "Password",
  fullName: "Full name",
  phone: "Phone",
  role: "Account type",
  institutionName: "Institution name",
  institutionType: "Institution type",
  taxCode: "Tax code",
  website: "Website",
  companyName: "Company name",
  industry: "Industry",
  companySize: "Company size",
  token: "Reset link",
  newPassword: "New password",
};

type Rewrite = {
  test: RegExp;
  rewrite: (label: string, match: RegExpMatchArray) => string;
};

const REWRITES: Rewrite[] = [
  {
    test: /^\w+ must be an email$/,
    rewrite: (label) => `${label} must be a valid email`,
  },
  {
    test: /^\w+ must be longer than or equal to (\d+) characters?$/,
    rewrite: (label, m) => `${label} must be at least ${m[1]} characters`,
  },
  {
    test: /^\w+ must be shorter than or equal to (\d+) characters?$/,
    rewrite: (label, m) => `${label} must be at most ${m[1]} characters`,
  },
  {
    test: /^\w+ must be a (?:valid )?URL/i,
    rewrite: (label) => `${label} must be a valid URL`,
  },
  {
    test: /^\w+ must be a phone number/i,
    rewrite: (label) => `${label} must be a valid phone number`,
  },
  {
    test: /^\w+ must be one of the following values/,
    rewrite: (label) => `${label} is not valid`,
  },
];

function labelFor(field: string): string {
  if (FIELD_LABELS[field]) return FIELD_LABELS[field];
  // Fallback: split camelCase to "Camel case"
  const spaced = field.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function formatOne(raw: string): { field: string; message: string } {
  const fieldMatch = raw.match(/^(\w+)\s/);
  const field = fieldMatch?.[1] ?? "";
  const label = labelFor(field);

  for (const r of REWRITES) {
    const m = raw.match(r.test);
    if (m) return { field, message: r.rewrite(label, m) };
  }

  // Default: replace leading field name with friendly label, capitalize.
  const replaced = field
    ? raw.replace(new RegExp(`^${field}`), label)
    : raw;
  return { field, message: capitalize(replaced) };
}

export type FormattedValidation = {
  /** Single friendly message, or a generic prompt when many fields fail. */
  summary: string;
  /** Per-field friendly message keyed by the camelCase field name. */
  fields: Record<string, string>;
};

export function formatValidationMessages(raw: string[]): FormattedValidation {
  const fields: Record<string, string> = {};
  const messages: string[] = [];

  for (const r of raw) {
    const { field, message } = formatOne(r);
    messages.push(message);
    if (field && !fields[field]) fields[field] = message;
  }

  const unique = Array.from(new Set(messages));
  const summary =
    unique.length === 1
      ? unique[0]
      : "Please review the highlighted fields below.";

  return { summary, fields };
}
