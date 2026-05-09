"use client";

import { useState } from "react";
import { Select } from "@/components/ui/Input";
import { updateApplicationStatus } from "@/lib/recruiter-api";
import type { ApplicationStatus } from "@/types/candidate";

const STATUSES: { value: ApplicationStatus; label: string }[] = [
  { value: "applied", label: "Applied" },
  { value: "reviewing", label: "Reviewing" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interview", label: "Interview" },
  { value: "offered", label: "Offered" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(next: ApplicationStatus) {
    setSaving(true);
    setError(null);
    try {
      await updateApplicationStatus(applicationId, next);
      onChange(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
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
            {s.label}
          </option>
        ))}
      </Select>
      {saving && (
        <span className="text-[11px] text-fg-subtle">Saving…</span>
      )}
      {error && <span className="text-[11px] text-danger">{error}</span>}
    </div>
  );
}
