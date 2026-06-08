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
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/Table";
import {
  createSkill,
  deleteSkill,
  fetchAllSkills,
  updateSkill,
} from "@/lib/admin-api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { SkillCatalogEntry } from "@/types/admin";

type FormState = {
  id?: string;
  name: string;
  normalized: string;
  category: string;
  aliasesText: string;
  isActive: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  normalized: "",
  category: "",
  aliasesText: "",
  isActive: true,
};

const parseAliases = (text: string): string[] =>
  text
    .split(/[,;\n]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

export default function AdminSkillsPage() {
  const { t } = useLanguage();
  useSetPageMeta(t("admin.skills.title"), t("admin.skills.description"));
  const [items, setItems] = useState<SkillCatalogEntry[] | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setItems(null);
    setItems(await fetchAllSkills());
  }

  useEffect(() => {
    refresh();
  }, []);

  function openCreate() {
    setForm({ ...EMPTY_FORM });
    setError(null);
  }

  function openEdit(item: SkillCatalogEntry) {
    setForm({
      id: item.id,
      name: item.name,
      normalized: item.normalized,
      category: item.category ?? "",
      aliasesText: (item.aliases ?? []).join(", "),
      isActive: item.isActive,
    });
    setError(null);
  }

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      if (form.id) {
        await updateSkill(form.id, {
          name: form.name,
          category: form.category || undefined,
          aliases: parseAliases(form.aliasesText),
          isActive: form.isActive,
        });
      } else {
        await createSkill({
          name: form.name,
          normalized: form.normalized || undefined,
          category: form.category || undefined,
          aliases: parseAliases(form.aliasesText),
          isActive: form.isActive,
        });
      }
      await refresh();
      setForm(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.skills.failedSave"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: SkillCatalogEntry) {
    if (!window.confirm(t("admin.skills.confirmDelete").replace("{name}", item.name))) {
      return;
    }
    try {
      await deleteSkill(item.id);
      await refresh();
    } catch {
      // surfaced on next refresh; keep UI responsive
    }
  }

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <Button onClick={openCreate} leftIcon={<Plus size={16} />}>
          {t("admin.skills.newSkill")}
        </Button>
      </div>

      <div className="text-[12.5px] text-fg-subtle mb-3">
        {items
          ? t(
              items.length === 1
                ? "admin.skills.summaryOne"
                : "admin.skills.summaryMany",
            ).replace("{n}", String(items.length))
          : ""}
      </div>

      <Table>
        <THead>
          <TR>
            <TH>{t("admin.skills.colName")}</TH>
            <TH>{t("admin.skills.colToken")}</TH>
            <TH>{t("admin.skills.colCategory")}</TH>
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
                {t("admin.skills.empty")}
              </TD>
            </TR>
          ) : (
            items.map((it) => (
              <TR key={it.id}>
                <TD>
                  <div className="font-medium text-fg">{it.name}</div>
                </TD>
                <TD className="font-mono text-[12.5px] text-fg-muted">
                  {it.normalized}
                </TD>
                <TD className="text-fg-muted">{it.category || "—"}</TD>
                <TD>
                  <Badge variant={it.isActive ? "success" : "neutral"}>
                    {it.isActive
                      ? t("status.account.active")
                      : t("status.account.inactive")}
                  </Badge>
                </TD>
                <TD className="text-right whitespace-nowrap">
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => openEdit(it)}
                    className="h-8 px-3 text-[13px]"
                  >
                    {t("common.edit")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => handleDelete(it)}
                    className="h-8 px-3 text-[13px] text-danger"
                  >
                    {t("common.delete")}
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
            ? t("admin.skills.modalEditTitle")
            : t("admin.skills.modalNewTitle")
        }
        description={t("admin.skills.modalDescription")}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setForm(null)}
              disabled={saving}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSave} loading={saving} disabled={!form?.name}>
              {form?.id ? t("common.saveChanges") : t("common.create")}
            </Button>
          </>
        }
      >
        {form && (
          <div className="space-y-4">
            <FormField label={t("admin.skills.fldName")} required>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Node.js"
              />
            </FormField>

            <FormField
              label={t("admin.skills.fldToken")}
              hint={t("admin.skills.fldTokenHint")}
            >
              <Input
                value={form.normalized}
                onChange={(e) =>
                  setForm({ ...form, normalized: e.target.value })
                }
                placeholder={form.name ? form.name.toLowerCase() : "nodejs"}
                disabled={Boolean(form.id)}
              />
            </FormField>

            <FormField label={t("admin.skills.fldCategory")}>
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="backend / frontend / data…"
              />
            </FormField>

            <FormField
              label={t("admin.skills.fldAliases")}
              hint={t("admin.skills.fldAliasesHint")}
            >
              <Input
                value={form.aliasesText}
                onChange={(e) =>
                  setForm({ ...form, aliasesText: e.target.value })
                }
                placeholder="node, node.js"
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
              {t("admin.skills.fldActive")}
            </label>

            {error && <Alert variant="error">{error}</Alert>}
          </div>
        )}
      </Modal>
    </>
  );
}
