"use client";

import { useState } from "react";
import { Select } from "@/components/ui/Input";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";
import { updateApplicationStatus } from "@/lib/recruiter-api";
import type { ApplicationStatus } from "@/types/candidate";

const STATUSES: { value: ApplicationStatus; labelKey: TranslationKey }[] = [
  { value: "applied", labelKey: "status.app.applied" },
  { value: "reviewing", labelKey: "status.app.reviewing" },
  { value: "shortlisted", labelKey: "status.app.shortlisted" },
  { value: "interview", labelKey: "status.app.interview" },
  { value: "offered", labelKey: "status.app.offered" },
  { value: "rejected", labelKey: "status.app.rejected" },
  { value: "withdrawn", labelKey: "status.app.withdrawn" },
];

type ApplicationStatusSelectProps = {
  applicationId: string;
  status: ApplicationStatus;
  onChange: (status: ApplicationStatus) => void;
};

export function ApplicationStatusSelect({
  applicationId,
  status,
  onChange,
}: ApplicationStatusSelectProps) {
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(next: ApplicationStatus) {
    setSaving(true);
    setError(null);
    try {
      await updateApplicationStatus(applicationId, next);
      onChange(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("appStatus.updateFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Select
        value={status}
        onChange={(e) => handleChange(e.target.value as ApplicationStatus)}
        disabled={saving}
        className="h-9 w-[160px] text-[13.5px]"
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {t(s.labelKey)}
          </option>
        ))}
      </Select>
      {saving && (
        <span className="text-[11px] text-fg-subtle">
          {t("appStatus.saving")}
        </span>
      )}
      {error && <span className="text-[11px] text-danger">{error}</span>}
    </div>
  );
}
