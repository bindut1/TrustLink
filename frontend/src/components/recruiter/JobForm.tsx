"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input, Select } from "@/components/ui/Input";
import { ApiError } from "@/lib/api";
import type { CreateJobPayload } from "@/types/recruiter-app";
import { SkillChipsInput } from "./SkillChipsInput";

type JobFormProps = {
  initial?: Partial<CreateJobPayload>;
  submitLabel: string;
  onSubmit: (payload: CreateJobPayload) => Promise<unknown>;
};

const JOB_TYPES = [
  { value: "full_time", label: "Full time" },
  { value: "part_time", label: "Part time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
];

const EXPERIENCE = [
  { value: "", label: "Any level" },
  { value: "entry", label: "Entry" },
  { value: "mid", label: "Mid" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
];

export function JobForm({ initial, submitLabel, onSubmit }: JobFormProps) {
  const [form, setForm] = useState<CreateJobPayload>({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    requirements: initial?.requirements ?? "",
    benefits: initial?.benefits ?? "",
    jobType: initial?.jobType ?? "full_time",
    experienceLevel: initial?.experienceLevel ?? "",
    industry: initial?.industry ?? "",
    location: initial?.location ?? "",
    city: initial?.city ?? "",
    isRemote: initial?.isRemote ?? false,
    salaryMin: initial?.salaryMin,
    salaryMax: initial?.salaryMax,
    salaryVisible: initial?.salaryVisible ?? true,
    requiredSkills: initial?.requiredSkills ?? [],
    preferredSkills: initial?.preferredSkills ?? [],
    applicationDeadline: initial?.applicationDeadline ?? undefined,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function update<K extends keyof CreateJobPayload>(
    key: K,
    value: CreateJobPayload[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    try {
      // Strip undefined/empty optional strings so backend gets clean payload
      const payload: CreateJobPayload = {
        title: form.title.trim(),
        description: form.description.trim(),
        requirements: form.requirements?.trim() || undefined,
        benefits: form.benefits?.trim() || undefined,
        jobType: form.jobType || undefined,
        experienceLevel: form.experienceLevel || undefined,
        industry: form.industry?.trim() || undefined,
        location: form.location?.trim() || undefined,
        city: form.city?.trim() || undefined,
        isRemote: form.isRemote,
        salaryMin: form.salaryMin ?? undefined,
        salaryMax: form.salaryMax ?? undefined,
        salaryVisible: form.salaryVisible,
        requiredSkills: form.requiredSkills,
        preferredSkills: form.preferredSkills,
        applicationDeadline: form.applicationDeadline || undefined,
      };
      await onSubmit(payload);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
        if (e.fields) setFieldErrors(e.fields);
      } else {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="flex flex-col gap-5"
    >
      {error && <Alert variant="error">{error}</Alert>}

      <Card title="Basics">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Title"
            required
            error={fieldErrors.title}
            className="sm:col-span-2"
          >
            <Input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              required
              placeholder="e.g. Senior Smart Contract Engineer"
            />
          </FormField>
          <FormField label="Job type">
            <Select
              value={form.jobType ?? "full_time"}
              onChange={(e) => update("jobType", e.target.value)}
            >
              {JOB_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Experience level">
            <Select
              value={form.experienceLevel ?? ""}
              onChange={(e) => update("experienceLevel", e.target.value)}
            >
              {EXPERIENCE.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Industry">
            <Input
              value={form.industry ?? ""}
              onChange={(e) => update("industry", e.target.value)}
              placeholder="e.g. Fintech"
            />
          </FormField>
          <FormField label="City">
            <Input
              value={form.city ?? ""}
              onChange={(e) => update("city", e.target.value)}
              placeholder="e.g. Hanoi"
            />
          </FormField>
        </div>
        <label className="flex items-center gap-3 mt-4 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isRemote ?? false}
            onChange={(e) => update("isRemote", e.target.checked)}
            className="h-4 w-4 rounded border-border-strong text-accent focus:ring-accent/30"
          />
          <span className="text-[14px] text-fg font-medium">
            This role is remote-friendly
          </span>
        </label>
      </Card>

      <Card title="Compensation">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Salary min" hint="Thousand VND / month">
            <Input
              type="number"
              min={0}
              value={form.salaryMin != null ? String(form.salaryMin) : ""}
              onChange={(e) =>
                update(
                  "salaryMin",
                  e.target.value === "" ? undefined : Number(e.target.value),
                )
              }
            />
          </FormField>
          <FormField label="Salary max" hint="Thousand VND / month">
            <Input
              type="number"
              min={0}
              value={form.salaryMax != null ? String(form.salaryMax) : ""}
              onChange={(e) =>
                update(
                  "salaryMax",
                  e.target.value === "" ? undefined : Number(e.target.value),
                )
              }
            />
          </FormField>
        </div>
        <label className="flex items-center gap-3 mt-4 cursor-pointer">
          <input
            type="checkbox"
            checked={form.salaryVisible ?? true}
            onChange={(e) => update("salaryVisible", e.target.checked)}
            className="h-4 w-4 rounded border-border-strong text-accent focus:ring-accent/30"
          />
          <span className="text-[14px] text-fg font-medium">
            Show salary range publicly
          </span>
        </label>
      </Card>

      <Card title="Description">
        <FormField label="Description" required error={fieldErrors.description}>
          <textarea
            rows={6}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            required
            placeholder="Describe the role, the team and what success looks like."
            className="w-full rounded-lg border border-border bg-surface-1 p-3 text-[15px] text-fg placeholder:text-fg-faint focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-colors resize-y"
          />
        </FormField>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <FormField label="Requirements">
            <textarea
              rows={4}
              value={form.requirements ?? ""}
              onChange={(e) => update("requirements", e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-1 p-3 text-[14.5px] text-fg placeholder:text-fg-faint focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-colors resize-y"
            />
          </FormField>
          <FormField label="Benefits">
            <textarea
              rows={4}
              value={form.benefits ?? ""}
              onChange={(e) => update("benefits", e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-1 p-3 text-[14.5px] text-fg placeholder:text-fg-faint focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-colors resize-y"
            />
          </FormField>
        </div>
      </Card>

      <Card title="Skills">
        <FormField
          label="Required skills"
          hint="Used by AI matcher (keyword tier — 40% of total score)"
        >
          <SkillChipsInput
            value={form.requiredSkills ?? []}
            onChange={(v) => update("requiredSkills", v)}
            placeholder="e.g. Solidity"
          />
        </FormField>
        <div className="mt-5">
          <FormField
            label="Preferred skills"
            hint="Nice-to-haves — they don't penalize candidates who lack them"
          >
            <SkillChipsInput
              value={form.preferredSkills ?? []}
              onChange={(v) => update("preferredSkills", v)}
              placeholder="e.g. Foundry"
            />
          </FormField>
        </div>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button type="submit" loading={submitting}>
          {submitLabel}
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
    <section className="rounded-2xl border border-border bg-canvas p-5 sm:p-6">
      <div className="text-[11.5px] uppercase tracking-[0.10em] font-semibold text-fg-subtle mb-5">
        {title}
      </div>
      {children}
    </section>
  );
}
