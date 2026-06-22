"use client";

import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useSetPageMeta } from "@/components/app-shell/page-meta";
import { AvatarUploader } from "@/components/profile/AvatarUploader";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { SelectMenu } from "@/components/ui/SelectMenu";
import { SkillsEditor } from "@/components/profile/SkillsEditor";
import { ApiError } from "@/lib/api";
import {
  fetchMyProfile,
  fetchMySkills,
  updateMyProfile,
} from "@/lib/candidate-api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";
import { VIETNAM_PROVINCE_OPTIONS } from "@/lib/vietnam-provinces";
import type {
  CandidateProfile,
  CandidateSkill,
  UpdateCandidateProfilePayload,
} from "@/types/candidate";

function toEditableDraft(p: CandidateProfile): UpdateCandidateProfilePayload {
  return {
    dateOfBirth: p.dateOfBirth,
    gender: p.gender,
    bio: p.bio,
    resumeUrl: p.resumeUrl,
    linkedinUrl: p.linkedinUrl,
    githubUrl: p.githubUrl,
    portfolioUrl: p.portfolioUrl,
    yearsOfExperience: p.yearsOfExperience ?? undefined,
    desiredPosition: p.desiredPosition,
    desiredSalaryMin: p.desiredSalaryMin ?? undefined,
    desiredSalaryMax: p.desiredSalaryMax ?? undefined,
    preferredLocations: p.preferredLocations ?? [],
    isOpenToWork: p.isOpenToWork ?? false,
  };
}

const URL_FIELDS: Array<{
  key: keyof UpdateCandidateProfilePayload;
  labelKey: TranslationKey;
  placeholder: string;
}> = [
  { key: "resumeUrl", labelKey: "candidate.profile.fldResume", placeholder: "https://" },
  { key: "linkedinUrl", labelKey: "candidate.profile.fldLinkedIn", placeholder: "https://linkedin.com/in/…" },
  { key: "githubUrl", labelKey: "candidate.profile.fldGithub", placeholder: "https://github.com/…" },
  { key: "portfolioUrl", labelKey: "candidate.profile.fldPortfolio", placeholder: "https://" },
];

export default function CandidateProfilePage() {
  const { t } = useLanguage();
  useSetPageMeta(t("candidate.profile.title"), t("candidate.profile.description"));
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [draft, setDraft] = useState<UpdateCandidateProfilePayload>({});
  const [skills, setSkills] = useState<CandidateSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchMyProfile()
      .then((p) => {
        if (cancelled) return;
        setProfile(p);
        setDraft(toEditableDraft(p));
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(
          e instanceof Error ? e.message : t("candidate.profile.failedLoad"),
        );
      })
      .finally(() => !cancelled && setLoading(false));
    fetchMySkills()
      .then((s) => !cancelled && setSkills(s))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update<K extends keyof UpdateCandidateProfilePayload>(
    key: K,
    value: UpdateCandidateProfilePayload[K],
  ) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function addLocation(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    const current = draft.preferredLocations ?? [];
    if (current.includes(trimmed)) return;
    update("preferredLocations", [...current, trimmed]);
  }

  function removeLocation(loc: string) {
    update(
      "preferredLocations",
      (draft.preferredLocations ?? []).filter((l) => l !== loc),
    );
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const next = await updateMyProfile(draft);
      setProfile(next);
      setDraft(toEditableDraft(next));
      setSaved(true);
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : t("candidate.profile.saveFailed"),
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-card border border-border bg-canvas p-10 text-center text-fg-subtle">
        {t("candidate.profile.loading")}
      </div>
    );
  }

  if (!profile) {
    return (
      <Alert variant="error">{error ?? t("candidate.profile.notFound")}</Alert>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      className="flex flex-col gap-5"
    >
      {error && <Alert variant="error">{error}</Alert>}
      {saved && <Alert variant="success">{t("candidate.profile.saved")}</Alert>}

      {/* Summary: avatar + completeness + open-to-work */}
      <section className="rounded-card border border-border bg-canvas p-5 sm:p-6 shadow-[var(--shadow-card)] flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="flex-1 min-w-0">
          <AvatarUploader />
        </div>
        <div className="flex items-center gap-5 sm:border-l sm:border-border sm:pl-6">
          <ProgressRing value={profile.profileCompleteness ?? 0}>
            {(profile.profileCompleteness ?? 0) >= 100 ? (
              <CheckCircle2 size={22} className="text-teal" />
            ) : undefined}
          </ProgressRing>
          <div>
            {profile.isOpenToWork ? (
              <Badge variant="success">{t("candidate.profile.openToWork")}</Badge>
            ) : (
              <Badge variant="neutral">
                {t("candidate.profile.closedToOffers")}
              </Badge>
            )}
            <p className="mt-2 text-[12.5px] text-fg-subtle max-w-[28ch]">
              {t("candidate.profile.completenessHint")}
            </p>
          </div>
        </div>
      </section>

      {/* Skills — self-declared (editable) + credential-verified (read-only) */}
      <Card title={t("candidate.profile.sectionSkills")}>
        <SkillsEditor skills={skills} onChange={setSkills} />
      </Card>

        {/* Personal information */}
        <Card title={t("candidate.profile.sectionPersonal")}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={t("candidate.profile.fldDob")}>
              <Input
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                value={String(draft.dateOfBirth ?? "").slice(0, 10)}
                onChange={(e) =>
                  update("dateOfBirth", e.target.value || undefined)
                }
              />
            </FormField>
            <FormField label={t("candidate.profile.fldGender")}>
              <SelectMenu
                value={draft.gender ?? ""}
                onChange={(v) => update("gender", v)}
                ariaLabel={t("candidate.profile.fldGender")}
                options={[
                  { value: "", label: t("candidate.profile.genderUnspecified") },
                  { value: "male", label: t("candidate.profile.genderMale") },
                  { value: "female", label: t("candidate.profile.genderFemale") },
                  { value: "other", label: t("candidate.profile.genderOther") },
                ]}
              />
            </FormField>
          </div>
        </Card>

        {/* About */}
        <Card title={t("candidate.profile.sectionAbout")}>
          <FormField
            label={t("candidate.profile.fldBio")}
            hint={t("candidate.profile.fldBioHint")}
          >
            <textarea
              rows={5}
              value={(draft.bio as string) ?? ""}
              onChange={(e) => update("bio", e.target.value)}
              placeholder={t("candidate.profile.fldBioPlaceholder")}
              className="w-full rounded-ctl border border-border bg-surface-1 p-3 text-[15px] text-fg placeholder:text-fg-faint focus:border-navy focus:ring-4 focus:ring-navy/12 outline-none transition-colors resize-y"
            />
          </FormField>
        </Card>

        {/* Links */}
        <Card title={t("candidate.profile.sectionLinks")}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {URL_FIELDS.map((f) => (
              <FormField key={f.key} label={t(f.labelKey)}>
                <Input
                  type="url"
                  value={(draft[f.key] as string | undefined) ?? ""}
                  onChange={(e) => update(f.key, e.target.value)}
                  placeholder={f.placeholder}
                />
              </FormField>
            ))}
          </div>
        </Card>

        {/* Career preferences */}
        <Card title={t("candidate.profile.sectionCareer")}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={t("candidate.profile.fldDesiredPosition")}>
              <Input
                value={(draft.desiredPosition as string | undefined) ?? ""}
                onChange={(e) => update("desiredPosition", e.target.value)}
                placeholder={t("candidate.profile.fldDesiredPositionPlaceholder")}
              />
            </FormField>
            <FormField label={t("candidate.profile.fldYearsExperience")}>
              <Input
                type="number"
                min={0}
                max={100}
                value={
                  draft.yearsOfExperience != null
                    ? String(draft.yearsOfExperience)
                    : ""
                }
                onChange={(e) =>
                  update(
                    "yearsOfExperience",
                    e.target.value === "" ? undefined : Number(e.target.value),
                  )
                }
              />
            </FormField>
            <FormField
              label={t("candidate.profile.fldSalaryMin")}
              hint={t("candidate.profile.fldSalaryUnit")}
            >
              <Input
                type="number"
                min={0}
                value={
                  draft.desiredSalaryMin != null
                    ? String(draft.desiredSalaryMin)
                    : ""
                }
                onChange={(e) =>
                  update(
                    "desiredSalaryMin",
                    e.target.value === "" ? undefined : Number(e.target.value),
                  )
                }
              />
            </FormField>
            <FormField
              label={t("candidate.profile.fldSalaryMax")}
              hint={t("candidate.profile.fldSalaryUnit")}
            >
              <Input
                type="number"
                min={0}
                value={
                  draft.desiredSalaryMax != null
                    ? String(draft.desiredSalaryMax)
                    : ""
                }
                onChange={(e) =>
                  update(
                    "desiredSalaryMax",
                    e.target.value === "" ? undefined : Number(e.target.value),
                  )
                }
              />
            </FormField>
          </div>

          <div className="mt-4">
            <FormField label={t("candidate.profile.fldLocations")}>
              <SelectMenu
                value=""
                onChange={(v) => addLocation(v)}
                ariaLabel={t("candidate.profile.fldLocations")}
                placeholder={t("candidate.profile.fldLocationPlaceholder")}
                options={VIETNAM_PROVINCE_OPTIONS.filter(
                  (o) =>
                    !(draft.preferredLocations ?? []).includes(o.value),
                )}
              />
            </FormField>
            {(draft.preferredLocations ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {(draft.preferredLocations ?? []).map((loc) => (
                  <button
                    type="button"
                    key={loc}
                    onClick={() => removeLocation(loc)}
                    className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2/60 pl-3 pr-2 py-1 text-[13px] text-fg-muted hover:border-danger/40 hover:text-danger transition-colors"
                  >
                    {loc}
                    <span className="text-fg-faint group-hover:text-danger">×</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-border">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(draft.isOpenToWork)}
                onChange={(e) => update("isOpenToWork", e.target.checked)}
                className="h-4 w-4 rounded border-border-strong text-navy focus:ring-navy/30"
              />
              <span className="text-[14px] text-fg font-medium">
                {t("candidate.profile.openToWorkLabel")}
              </span>
            </label>
            <p className="text-[12.5px] text-fg-subtle mt-1.5 ml-7">
              {t("candidate.profile.openToWorkHint")}
            </p>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setDraft(profile)}
          >
            {t("candidate.profile.discard")}
          </Button>
          <Button type="submit" loading={saving}>
            {t("candidate.profile.save")}
          </Button>
        </div>
    </form>
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
