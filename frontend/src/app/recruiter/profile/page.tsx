"use client";

import { useEffect, useState } from "react";
import { useSetPageMeta } from "@/components/app-shell/page-meta";
import { AvatarUploader } from "@/components/profile/AvatarUploader";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { SelectMenu } from "@/components/ui/SelectMenu";
import { StatusPill } from "@/components/ui/StatusPill";
import { ApiError } from "@/lib/api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  fetchMyRecruiterProfile,
  updateMyRecruiterProfile,
} from "@/lib/recruiter-api";
import { VIETNAM_PROVINCE_OPTIONS } from "@/lib/vietnam-provinces";
import type {
  RecruiterProfile,
  UpdateRecruiterProfilePayload,
} from "@/types/recruiter-app";

const COMPANY_SIZES = [
  "1-10",
  "11-50",
  "51-200",
  "201-1000",
  "1000+",
];

// Fields the update DTO accepts — everything else (id, userId, isVerified,
// createdAt, user, …) must not be sent or the server rejects the request.
const EDITABLE_KEYS: (keyof UpdateRecruiterProfilePayload)[] = [
  "companyName",
  "companyNameEn",
  "companyLogoUrl",
  "industry",
  "companySize",
  "companyWebsite",
  "companyAddress",
  "city",
  "country",
  "description",
  "taxCode",
];

export default function RecruiterProfilePage() {
  const { t } = useLanguage();
  useSetPageMeta(t("recruiter.profile.title"), t("recruiter.profile.description"));
  const [profile, setProfile] = useState<RecruiterProfile | null>(null);
  const [draft, setDraft] = useState<UpdateRecruiterProfilePayload>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchMyRecruiterProfile()
      .then((p) => {
        if (cancelled) return;
        setProfile(p);
        setDraft(p);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(
          e instanceof ApiError ? e.message : t("recruiter.profile.failedLoad"),
        );
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  function set<K extends keyof UpdateRecruiterProfilePayload>(
    key: K,
    value: UpdateRecruiterProfilePayload[K],
  ) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      // Only send fields the API DTO accepts — the server rejects unknown
      // props (whitelist + forbidNonWhitelisted), e.g. id/userId/isVerified.
      const payload: UpdateRecruiterProfilePayload = {};
      for (const key of EDITABLE_KEYS) {
        const value = draft[key];
        if (value !== undefined) {
          (payload as Record<string, unknown>)[key] = value;
        }
      }
      const next = await updateMyRecruiterProfile(payload);
      setProfile(next);
      setDraft(next);
      setSaved(true);
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : t("recruiter.profile.saveFailed"),
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-card border border-border bg-canvas p-10 text-center text-fg-subtle shadow-[var(--shadow-card)]">
        {t("recruiter.profile.loading")}
      </div>
    );
  }

  if (!profile) {
    return (
      <Alert variant="error">{error ?? t("recruiter.profile.notFound")}</Alert>
    );
  }

  return (
    <>
      <div className="rounded-card border border-border bg-canvas p-5 mb-5 shadow-[var(--shadow-card)] flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[15px] font-semibold text-fg truncate">
            {profile.companyName || t("recruiter.profile.title")}
          </div>
          <div className="text-[12.5px] text-fg-subtle mt-0.5">
            {t("recruiter.profile.description")}
          </div>
        </div>
        {profile.isVerified ? (
          <StatusPill tone="verified">{t("recruiter.profile.verified")}</StatusPill>
        ) : (
          <Badge variant="neutral">{t("recruiter.profile.notVerified")}</Badge>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
        className="flex flex-col gap-5"
      >
        {error && <Alert variant="error">{error}</Alert>}
        {saved && <Alert variant="success">{t("recruiter.profile.saved")}</Alert>}

        <AvatarUploader />

        <Card title={t("recruiter.profile.sectionCompany")}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label={t("recruiter.profile.fldCompanyName")}
              required
              className="sm:col-span-2"
            >
              <Input
                value={(draft.companyName as string | undefined) ?? ""}
                onChange={(e) => set("companyName", e.target.value)}
                required
              />
            </FormField>
            <FormField label={t("recruiter.profile.fldCompanyNameEn")}>
              <Input
                value={(draft.companyNameEn as string | undefined) ?? ""}
                onChange={(e) => set("companyNameEn", e.target.value)}
              />
            </FormField>
            <FormField label={t("recruiter.profile.fldIndustry")}>
              <Input
                value={(draft.industry as string | undefined) ?? ""}
                onChange={(e) => set("industry", e.target.value)}
                placeholder={t("jobForm.industryPlaceholder")}
              />
            </FormField>
            <FormField label={t("recruiter.profile.fldCompanySize")}>
              <SelectMenu
                value={(draft.companySize as string | undefined) ?? ""}
                onChange={(v) => set("companySize", v || null)}
                ariaLabel={t("recruiter.profile.fldCompanySize")}
                placeholder={t("recruiter.profile.fldSelect")}
                options={[
                  { value: "", label: t("recruiter.profile.fldSelect") },
                  ...COMPANY_SIZES.map((s) => ({
                    value: s,
                    label: t("recruiter.profile.fldEmployees").replace("{size}", s),
                  })),
                ]}
              />
            </FormField>
            <FormField label={t("recruiter.profile.fldTaxCode")}>
              <Input
                value={(draft.taxCode as string | undefined) ?? ""}
                onChange={(e) => set("taxCode", e.target.value)}
              />
            </FormField>
            <FormField label={t("recruiter.profile.fldWebsite")}>
              <Input
                type="url"
                value={(draft.companyWebsite as string | undefined) ?? ""}
                onChange={(e) => set("companyWebsite", e.target.value)}
                placeholder="https://"
              />
            </FormField>
            <FormField label={t("recruiter.profile.fldLogoUrl")}>
              <Input
                type="url"
                value={(draft.companyLogoUrl as string | undefined) ?? ""}
                onChange={(e) => set("companyLogoUrl", e.target.value)}
                placeholder="https://"
              />
            </FormField>
          </div>
        </Card>

        <Card title={t("recruiter.profile.sectionLocation")}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={t("recruiter.profile.fldCity")}>
              <SelectMenu
                value={(draft.city as string | undefined) ?? ""}
                onChange={(v) => set("city", v || null)}
                ariaLabel={t("recruiter.profile.fldCity")}
                placeholder={t("recruiter.profile.fldCityPlaceholder")}
                options={VIETNAM_PROVINCE_OPTIONS}
              />
            </FormField>
            <FormField label={t("recruiter.profile.fldCountry")}>
              <Input
                value={(draft.country as string | undefined) ?? ""}
                onChange={(e) => set("country", e.target.value)}
              />
            </FormField>
            <FormField
              label={t("recruiter.profile.fldAddress")}
              className="sm:col-span-2"
            >
              <textarea
                rows={3}
                value={(draft.companyAddress as string | undefined) ?? ""}
                onChange={(e) => set("companyAddress", e.target.value)}
                className="w-full rounded-ctl border border-border bg-surface-1 p-3 text-[15px] text-fg placeholder:text-fg-faint focus:border-navy focus:ring-4 focus:ring-navy/12 outline-none transition-colors resize-y"
              />
            </FormField>
          </div>
        </Card>

        <Card title={t("recruiter.profile.sectionAbout")}>
          <FormField label={t("recruiter.profile.fldDescription")}>
            <textarea
              rows={5}
              value={(draft.description as string | undefined) ?? ""}
              onChange={(e) => set("description", e.target.value)}
              placeholder={t("recruiter.profile.fldDescriptionPlaceholder")}
              className="w-full rounded-ctl border border-border bg-surface-1 p-3 text-[15px] text-fg placeholder:text-fg-faint focus:border-navy focus:ring-4 focus:ring-navy/12 outline-none transition-colors resize-y"
            />
          </FormField>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setDraft(profile)}
          >
            {t("recruiter.profile.discard")}
          </Button>
          <Button type="submit" loading={saving}>
            {t("recruiter.profile.save")}
          </Button>
        </div>
      </form>
    </>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card border border-border bg-canvas p-5 sm:p-6 shadow-[var(--shadow-card)]">
      <div className="text-[11.5px] uppercase tracking-[0.10em] font-semibold text-fg-subtle mb-5">
        {title}
      </div>
      {children}
    </section>
  );
}
