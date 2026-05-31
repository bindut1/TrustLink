"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { ApiError } from "@/lib/api";
import { fetchMyProfile, updateMyProfile } from "@/lib/candidate-api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";
import type {
  CandidateProfile,
  UpdateCandidateProfilePayload,
} from "@/types/candidate";

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
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [draft, setDraft] = useState<UpdateCandidateProfilePayload>({});
  const [locationInput, setLocationInput] = useState("");
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
        setDraft(p);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(
          e instanceof Error ? e.message : t("candidate.profile.failedLoad"),
        );
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  function update<K extends keyof UpdateCandidateProfilePayload>(
    key: K,
    value: UpdateCandidateProfilePayload[K],
  ) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function addLocation() {
    const trimmed = locationInput.trim();
    if (!trimmed) return;
    const current = draft.preferredLocations ?? [];
    if (current.includes(trimmed)) return;
    update("preferredLocations", [...current, trimmed]);
    setLocationInput("");
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
      setDraft(next);
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
      <>
        <PageHeader title={t("candidate.profile.title")} />
        <div className="rounded-2xl border border-border bg-canvas p-10 text-center text-fg-subtle">
          {t("candidate.profile.loading")}
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <PageHeader title={t("candidate.profile.title")} />
        <Alert variant="error">{error ?? t("candidate.profile.notFound")}</Alert>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={t("candidate.profile.title")}
        description={t("candidate.profile.description")}
        actions={
          profile.isOpenToWork ? (
            <Badge variant="success">{t("candidate.profile.openToWork")}</Badge>
          ) : (
            <Badge variant="neutral">
              {t("candidate.profile.closedToOffers")}
            </Badge>
          )
        }
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
        className="flex flex-col gap-5"
      >
        {error && <Alert variant="error">{error}</Alert>}
        {saved && <Alert variant="success">{t("candidate.profile.saved")}</Alert>}

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
              className="w-full rounded-lg border border-border bg-surface-1 p-3 text-[15px] text-fg placeholder:text-fg-faint focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-colors resize-y"
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
              <div className="flex gap-2">
                <Input
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addLocation();
                    }
                  }}
                  placeholder={t("candidate.profile.fldLocationPlaceholder")}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={addLocation}
                  disabled={!locationInput.trim()}
                >
                  {t("candidate.profile.fldLocationAdd")}
                </Button>
              </div>
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
                className="h-4 w-4 rounded border-border-strong text-accent focus:ring-accent/30"
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
    <section className="rounded-2xl border border-border bg-canvas p-5 sm:p-6">
      <div className="text-[11.5px] uppercase tracking-[0.10em] font-semibold text-fg-subtle mb-5">
        {title}
      </div>
      {children}
    </section>
  );
}
