"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useSetPageMeta } from "@/components/app-shell/page-meta";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SelectMenu } from "@/components/ui/SelectMenu";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/Table";
import {
  createCredentialType,
  fetchAllCredentialTypes,
  updateCredentialType,
} from "@/lib/admin-api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";
import type {
  CredentialCategory,
  CredentialType,
  CredentialTypeField,
} from "@/types/admin";

const CATEGORIES: { value: CredentialCategory; labelKey: TranslationKey }[] = [
  { value: "degree", labelKey: "credCategory.degree" },
  { value: "it_certificate", labelKey: "credCategory.it_certificate" },
  {
    value: "language_certificate",
    labelKey: "credCategory.language_certificate",
  },
  { value: "award", labelKey: "credCategory.award" },
  {
    value: "professional_certificate",
    labelKey: "credCategory.professional_certificate",
  },
  { value: "other", labelKey: "credCategory.other" },
];

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
  const { t } = useLanguage();
  useSetPageMeta(t("admin.credTypes.title"), t("admin.credTypes.description"));
  const [items, setItems] = useState<CredentialType[] | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryLabel = (cat: CredentialCategory) => {
    const found = CATEGORIES.find((c) => c.value === cat);
    return found ? t(found.labelKey) : cat;
  };

  async function refresh() {
    setItems(null);
    const list = await fetchAllCredentialTypes();
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
        throw new Error(t("admin.credTypes.mustHaveFields"));
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? `${t("admin.credTypes.invalidJson")} ${e.message}`
          : t("admin.credTypes.invalidSchema"),
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
      setError(
        e instanceof Error ? e.message : t("admin.credTypes.failedSave"),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <Button onClick={openCreate} leftIcon={<Plus size={16} />}>
          {t("admin.credTypes.newType")}
        </Button>
      </div>

      <div className="text-[12.5px] text-fg-subtle mb-3">
        {items
          ? t(
              items.length === 1
                ? "admin.credTypes.summaryOne"
                : "admin.credTypes.summaryMany",
            ).replace("{n}", String(items.length))
          : ""}
      </div>

      <Table>
        <THead>
          <TR>
            <TH>{t("admin.credTypes.colName")}</TH>
            <TH>{t("admin.credTypes.colCategory")}</TH>
            <TH>{t("admin.credTypes.colFields")}</TH>
            <TH>{t("common.status")}</TH>
            <TH className="text-right">{t("common.actions")}</TH>
          </TR>
        </THead>
        <TBody>
          {!items ? (
            <TR>
              <TD colSpan={5} className="text-center text-fg-subtle py-10">
                {t("common.loading")}
              </TD>
            </TR>
          ) : items.length === 0 ? (
            <TR>
              <TD colSpan={5} className="text-center text-fg-subtle py-10">
                {t("admin.credTypes.empty")}
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
                <TD className="text-fg-muted">{categoryLabel(it.category)}</TD>
                <TD className="font-mono text-[12.5px] text-fg-muted">
                  {it.fieldSchema?.fields?.length ?? 0}
                </TD>
                <TD>
                  <Badge variant={it.isActive ? "success" : "neutral"}>
                    {it.isActive
                      ? t("status.account.active")
                      : t("status.account.inactive")}
                  </Badge>
                </TD>
                <TD className="text-right">
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => openEdit(it)}
                    className="h-8 px-3 text-[13px]"
                  >
                    {t("common.edit")}
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
        title={
          form?.id
            ? t("admin.credTypes.modalEditTitle")
            : t("admin.credTypes.modalNewTitle")
        }
        description={t("admin.credTypes.modalDescription")}
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setForm(null)}
              disabled={saving}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSave}
              loading={saving}
              disabled={!form?.name}
            >
              {form?.id ? t("common.saveChanges") : t("common.create")}
            </Button>
          </>
        }
      >
        {form && (
          <div className="space-y-4">
            <FormField label={t("admin.credTypes.fldName")} required>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t("admin.credTypes.fldNamePlaceholder")}
              />
            </FormField>

            <FormField label={t("admin.credTypes.fldNameEn")}>
              <Input
                value={form.nameEn}
                onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                placeholder={t("admin.credTypes.fldNameEnPlaceholder")}
              />
            </FormField>

            <FormField label={t("admin.credTypes.fldCategory")} required>
              <SelectMenu
                value={form.category}
                onChange={(v) =>
                  setForm({ ...form, category: v as CredentialCategory })
                }
                options={CATEGORIES.map((c) => ({
                  value: c.value,
                  label: t(c.labelKey),
                }))}
                ariaLabel={t("admin.credTypes.fldCategory")}
              />
            </FormField>

            <FormField label={t("admin.credTypes.fldDescription")}>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={2}
                className="w-full rounded-lg bg-surface-1 px-4 py-3 text-[15px] text-fg placeholder:text-fg-faint border border-border outline-none hover:border-border-strong focus:border-accent focus:ring-4 focus:ring-accent/15 transition-colors"
                placeholder={t("admin.credTypes.fldDescriptionPlaceholder")}
              />
            </FormField>

            <FormField
              label={t("admin.credTypes.fldSchema")}
              hint={
                <>
                  {t("admin.credTypes.fldSchemaHint")}{" "}
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
              {t("admin.credTypes.fldActive")}
            </label>

            {error && <Alert variant="error">{error}</Alert>}
          </div>
        )}
      </Modal>
    </>
  );
}
