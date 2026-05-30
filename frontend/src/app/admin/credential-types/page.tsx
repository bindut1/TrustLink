"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/Table";
import {
  createCredentialType,
  fetchCredentialTypes,
  updateCredentialType,
} from "@/lib/admin-api";
import type {
  CredentialCategory,
  CredentialType,
  CredentialTypeField,
} from "@/types/admin";

const CATEGORIES: { value: CredentialCategory; label: string }[] = [
  { value: "degree", label: "Degree" },
  { value: "it_certificate", label: "IT certificate" },
  { value: "language_certificate", label: "Language certificate" },
  { value: "award", label: "Award" },
  { value: "professional_certificate", label: "Professional certificate" },
  { value: "other", label: "Other" },
];

const CATEGORY_LABEL: Record<CredentialCategory, string> = CATEGORIES.reduce(
  (acc, c) => ({ ...acc, [c.value]: c.label }),
  {} as Record<CredentialCategory, string>,
);

type FormState = {
  id?: string;
  name: string;
  nameEn: string;
  category: CredentialCategory;
  description: string;
  fieldSchemaJson: string;
  isActive: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  nameEn: "",
  category: "degree",
  description: "",
  fieldSchemaJson: '{\n  "fields": []\n}',
  isActive: true,
};

export default function AdminCredentialTypesPage() {
  const [items, setItems] = useState<CredentialType[] | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setItems(null);
    const list = await fetchCredentialTypes();
    setItems(list);
  }

  useEffect(() => {
    refresh();
  }, []);

  function openCreate() {
    setForm({ ...EMPTY_FORM });
    setError(null);
  }

  function openEdit(item: CredentialType) {
    setForm({
      id: item.id,
      name: item.name,
      nameEn: item.nameEn ?? "",
      category: item.category,
      description: item.description ?? "",
      fieldSchemaJson: JSON.stringify(item.fieldSchema, null, 2),
      isActive: item.isActive,
    });
    setError(null);
  }

  async function handleSave() {
    if (!form) return;
    setError(null);
    let parsedSchema: { fields: CredentialTypeField[] };
    try {
      parsedSchema = JSON.parse(form.fieldSchemaJson);
      if (!parsedSchema.fields || !Array.isArray(parsedSchema.fields)) {
        throw new Error('JSON must contain a "fields" array');
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? `Invalid JSON: ${e.message}`
          : "Invalid field schema JSON",
      );
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        nameEn: form.nameEn || undefined,
        category: form.category,
        description: form.description || undefined,
        fieldSchema: parsedSchema,
        isActive: form.isActive,
      };
      if (form.id) {
        await updateCredentialType(form.id, payload);
      } else {
        await createCredentialType(payload);
      }
      await refresh();
      setForm(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Credential types"
        description="Define the schema (dynamic form fields) for credentials that issuers can grant."
        actions={
          <Button onClick={openCreate} leftIcon={<Plus size={16} />}>
            New type
          </Button>
        }
      />

      <div className="text-[12.5px] text-fg-subtle mb-3">
        {items
          ? `${items.length} ${items.length === 1 ? "type" : "types"}`
          : ""}
      </div>

      <Table>
        <THead>
          <TR>
            <TH>Name</TH>
            <TH>Category</TH>
            <TH>Fields</TH>
            <TH>Status</TH>
            <TH className="text-right">Actions</TH>
          </TR>
        </THead>
        <TBody>
          {!items ? (
            <TR>
              <TD colSpan={5} className="text-center text-fg-subtle py-10">
                Loading…
              </TD>
            </TR>
          ) : items.length === 0 ? (
            <TR>
              <TD colSpan={5} className="text-center text-fg-subtle py-10">
                No credential types yet. Click “New type” to create the first one.
              </TD>
            </TR>
          ) : (
            items.map((it) => (
              <TR key={it.id}>
                <TD>
                  <div className="font-medium text-fg">{it.name}</div>
                  {it.nameEn && (
                    <div className="text-[12.5px] text-fg-subtle">
                      {it.nameEn}
                    </div>
                  )}
                </TD>
                <TD className="text-fg-muted">
                  {CATEGORY_LABEL[it.category]}
                </TD>
                <TD className="font-mono text-[12.5px] text-fg-muted">
                  {it.fieldSchema?.fields?.length ?? 0}
                </TD>
                <TD>
                  <Badge variant={it.isActive ? "success" : "neutral"}>
                    {it.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TD>
                <TD className="text-right">
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => openEdit(it)}
                    className="h-8 px-3 text-[13px]"
                  >
                    Edit
                  </Button>
                </TD>
              </TR>
            ))
          )}
        </TBody>
      </Table>

      <Modal
        open={form !== null}
        onClose={() => setForm(null)}
        title={form?.id ? "Edit credential type" : "New credential type"}
        description="The field schema drives the dynamic form issuers fill when granting a credential of this type."
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setForm(null)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              loading={saving}
              disabled={!form?.name}
            >
              {form?.id ? "Save changes" : "Create"}
            </Button>
          </>
        }
      >
        {form && (
          <div className="space-y-4">
            <FormField label="Name" required>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Bachelor of Engineering"
              />
            </FormField>

            <FormField label="Name (English)">
              <Input
                value={form.nameEn}
                onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                placeholder="Optional English name"
              />
            </FormField>

            <FormField label="Category" required>
              <Select
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category: e.target.value as CredentialCategory,
                  })
                }
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Description">
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={2}
                className="w-full rounded-lg bg-surface-1 px-4 py-3 text-[15px] text-fg placeholder:text-fg-faint border border-border outline-none hover:border-border-strong focus:border-accent focus:ring-4 focus:ring-accent/15 transition-colors"
                placeholder="Short description shown to issuers"
              />
            </FormField>

            <FormField
              label="Field schema (JSON)"
              hint={
                <>
                  Example:{" "}
                  <code className="rounded bg-surface-2 px-1.5 py-0.5 text-[12px] font-mono text-fg-muted">
                    {'{"fields":[{"key":"gpa","label":"GPA","type":"number","required":true}]}'}
                  </code>
                </>
              }
            >
              <textarea
                value={form.fieldSchemaJson}
                onChange={(e) =>
                  setForm({ ...form, fieldSchemaJson: e.target.value })
                }
                rows={10}
                spellCheck={false}
                className="w-full rounded-lg bg-surface-1 px-4 py-3 text-[13px] font-mono text-fg border border-border outline-none hover:border-border-strong focus:border-accent focus:ring-4 focus:ring-accent/15 transition-colors"
              />
            </FormField>

            <label className="flex items-center gap-2 text-[14px] text-fg cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm({ ...form, isActive: e.target.checked })
                }
                className="h-4 w-4 rounded border-border accent-accent"
              />
              Active (issuers can use this type)
            </label>

            {error && <Alert variant="error">{error}</Alert>}
          </div>
        )}
      </Modal>
    </>
  );
}
