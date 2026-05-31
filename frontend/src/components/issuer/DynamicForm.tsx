"use client";

"use client";

import { FormField } from "@/components/ui/FormField";
import { Input, Select } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { FieldSchema } from "@/types/issuer";

type FieldValue = string | number | undefined;

export type DynamicFormProps = {
  schema: FieldSchema;
  value: Record<string, FieldValue>;
  onChange: (next: Record<string, FieldValue>) => void;
  errors?: Record<string, string>;
  className?: string;
};

/**
 * Renders a form built from `credential_type.field_schema`. Supports text,
 * number, date, select, textarea. Caller manages state.
 */
export function DynamicForm({
  schema,
  value,
  onChange,
  errors,
  className,
}: DynamicFormProps) {
  const { t } = useLanguage();
  function set(key: string, v: FieldValue) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 gap-4",
        className,
      )}
    >
      {schema.fields.map((field) => {
        const current = value[field.key];
        const err = errors?.[field.key];
        const isFullWidth = field.type === "textarea";

        return (
          <div
            key={field.key}
            className={cn(isFullWidth && "sm:col-span-2")}
          >
            <FormField
              label={field.label}
              required={field.required}
              hint={!err ? field.helpText : undefined}
              error={err}
            >
              {field.type === "select" ? (
                <Select
                  value={(current as string) ?? ""}
                  onChange={(e) => set(field.key, e.target.value || undefined)}
                  required={field.required}
                >
                  <option value="">
                    {field.placeholder ?? t("dynForm.selectPlaceholder")}
                  </option>
                  {(field.options ?? []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </Select>
              ) : field.type === "textarea" ? (
                <textarea
                  value={(current as string) ?? ""}
                  onChange={(e) => set(field.key, e.target.value)}
                  required={field.required}
                  rows={4}
                  placeholder={field.placeholder}
                  className="w-full rounded-lg border border-border bg-surface-1 p-3 text-[15px] text-fg placeholder:text-fg-faint focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-colors resize-y"
                />
              ) : (
                <Input
                  type={field.type === "number" ? "number" : field.type}
                  value={(current as string | number | undefined) ?? ""}
                  onChange={(e) =>
                    set(
                      field.key,
                      field.type === "number"
                        ? e.target.value === ""
                          ? undefined
                          : Number(e.target.value)
                        : e.target.value,
                    )
                  }
                  required={field.required}
                  placeholder={field.placeholder}
                  step={field.type === "number" ? "any" : undefined}
                />
              )}
            </FormField>
          </div>
        );
      })}
    </div>
  );
}
