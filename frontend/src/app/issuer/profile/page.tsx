"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { AvatarUploader } from "@/components/profile/AvatarUploader";
import { ApprovalStatusBadge } from "@/components/issuer/StatusBadge";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { ApiError } from "@/lib/api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";
import { fetchMyInstitution, updateInstitution } from "@/lib/issuer-api";
import type { Institution } from "@/types/issuer";

type EditableFields =
  | "name"
  | "nameEn"
  | "abbreviation"
  | "institutionType"
  | "taxCode"
  | "website"
  | "address"
  | "city"
  | "country"
  | "description";

const FIELDS: {
  key: EditableFields;
  labelKey: TranslationKey;
  full?: boolean;
  placeholderKey?: TranslationKey;
  placeholder?: string;
  type?: string;
}[] = [
  {
    key: "name",
    labelKey: "issuer.profile.fldName",
    full: true,
    placeholder: "VD: Đại học Bách Khoa Hà Nội",
  },
  {
    key: "nameEn",
    labelKey: "issuer.profile.fldNameEn",
    full: true,
    placeholder: "e.g. Hanoi University of Science and Technology",
  },
  { key: "abbreviation", labelKey: "issuer.profile.fldAbbreviation", placeholder: "HUST" },
  {
    key: "institutionType",
    labelKey: "issuer.profile.fldType",
    placeholderKey: "issuer.profile.fldTypePlaceholder",
  },
  { key: "taxCode", labelKey: "issuer.profile.fldTaxCode" },
  { key: "website", labelKey: "issuer.profile.fldWebsite", type: "url", placeholder: "https://" },
  { key: "city", labelKey: "issuer.profile.fldCity" },
  { key: "country", labelKey: "issuer.profile.fldCountry" },
  { key: "address", labelKey: "issuer.profile.fldAddress", full: true },
];

export default function IssuerProfilePage() {
  const { t } = useLanguage();
  const [inst, setInst] = useState<Institution | null>(null);
  const [draft, setDraft] = useState<Partial<Institution>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchMyInstitution()
      .then((data) => {
        if (cancelled) return;
        setInst(data);
        setDraft(data);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const msg =
          e instanceof ApiError
            ? e.status === 404
              ? t("issuer.profile.notRegistered")
              : e.message
            : t("issuer.profile.failedLoad");
        setError(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const set =
    <K extends EditableFields>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft((d) => ({ ...d, [key]: e.target.value }));

  async function save() {
    if (!inst) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const patch: Partial<Institution> = {};
      for (const { key } of FIELDS) {
        const value = draft[key];
        if (value !== inst[key]) {
          (patch as Record<string, unknown>)[key] = value;
        }
      }
      const next = await updateInstitution(inst.id, patch);
      setInst(next);
      setDraft(next);
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("issuer.profile.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <PageHeader title={t("issuer.profile.title")} />
        <div className="rounded-2xl border border-border bg-canvas p-10 text-center text-fg-subtle">
          {t("issuer.profile.loading")}
        </div>
      </>
    );
  }

  if (!inst) {
    return (
      <>
        <PageHeader title={t("issuer.profile.title")} />
        <Alert variant="error">{error ?? t("issuer.profile.notFound")}</Alert>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={t("issuer.profile.title")}
        description={t("issuer.profile.description")}
        actions={<ApprovalStatusBadge status={inst.approvalStatus} />}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
        className="flex flex-col gap-5"
      >
        {error && <Alert variant="error">{error}</Alert>}
        {success && (
          <Alert variant="success">{t("issuer.profile.saved")}</Alert>
        )}

        {inst.approvalStatus === "rejected" && inst.rejectionReason && (
          <Alert variant="error">
            <div className="font-semibold mb-0.5">
              {t("issuer.profile.rejectedTitle")}
            </div>
            <div>{inst.rejectionReason}</div>
          </Alert>
        )}

        {inst.approvalStatus === "approved" && inst.blockchainAddress && (
          <Alert variant="success">
            <div className="font-semibold">
              {t("issuer.profile.onChainAuthorized")}
            </div>
            <code className="text-[12px] font-mono break-all">
              {inst.blockchainAddress}
            </code>
          </Alert>
        )}

        <AvatarUploader />

        <div className="rounded-2xl border border-border bg-canvas p-5 sm:p-6">
          <div className="text-[11.5px] uppercase tracking-[0.10em] font-semibold text-fg-subtle mb-5">
            {t("issuer.profile.sectionBasic")}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FIELDS.slice(0, FIELDS.length - 1).map((f) => (
              <div
                key={f.key}
                className={f.full ? "sm:col-span-2" : undefined}
              >
                <FormField label={t(f.labelKey)}>
                  <Input
                    type={f.type ?? "text"}
                    value={(draft[f.key] as string | undefined) ?? ""}
                    onChange={set(f.key)}
                    placeholder={
                      f.placeholderKey ? t(f.placeholderKey) : f.placeholder
                    }
                  />
                </FormField>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-canvas p-5 sm:p-6">
          <div className="text-[11.5px] uppercase tracking-[0.10em] font-semibold text-fg-subtle mb-5">
            {t("issuer.profile.sectionAbout")}
          </div>
          <FormField label={t("issuer.profile.fldDescription")}>
            <textarea
              rows={5}
              value={(draft.description as string | undefined) ?? ""}
              onChange={set("description")}
              className="w-full rounded-lg border border-border bg-surface-1 p-3 text-[15px] text-fg placeholder:text-fg-faint focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-colors resize-y"
              placeholder={t("issuer.profile.fldDescriptionPlaceholder")}
            />
          </FormField>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setDraft(inst)}
          >
            {t("issuer.profile.discard")}
          </Button>
          <Button type="submit" loading={saving}>
            {t("issuer.profile.save")}
          </Button>
        </div>
      </form>
    </>
  );
}
