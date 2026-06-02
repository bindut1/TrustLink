"use client";

import { ArrowRight, Briefcase, Calendar, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";
import type { JobItem } from "@/types/candidate";

type JobDetailModalProps = {
  job: JobItem | null;
  applied?: boolean;
  onClose: () => void;
  onApply?: () => void;
};

export function JobDetailModal({
  job,
  applied = false,
  onClose,
  onApply,
}: JobDetailModalProps) {
  const { t } = useLanguage();

  if (!job) return null;

  const jobTypeKey = job.jobType ? jobTypeKeyFor(job.jobType) : null;
  const expKey = job.experienceLevel ? expKeyFor(job.experienceLevel) : null;

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={job.title}
      description={
        <div className="flex flex-wrap gap-1.5 mt-1">
          {job.isRemote && <Badge variant="info">{t("common.remote")}</Badge>}
          {jobTypeKey && <Badge variant="neutral">{t(jobTypeKey)}</Badge>}
          {expKey && <Badge variant="neutral">{t(expKey)}</Badge>}
        </div>
      }
      footer={
        applied ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-4 py-1.5 text-[13px] font-medium text-success">
            {t("jobCard.applied")}
          </span>
        ) : onApply ? (
          <Button
            onClick={() => {
              onClose();
              onApply();
            }}
            rightIcon={<ArrowRight size={14} />}
          >
            {t("jobCard.apply")}
          </Button>
        ) : null
      }
    >
      {/* Meta row */}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-fg-muted mb-5 pb-5 border-b border-border">
        {(job.city || job.location) && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={13} className="text-fg-subtle shrink-0" />
            {job.city ?? job.location}
          </span>
        )}
        {(job.salaryMin != null || job.salaryMax != null) &&
          job.salaryVisible !== false && (
            <span className="inline-flex items-center gap-1.5">
              <Briefcase size={13} className="text-fg-subtle shrink-0" />
              {formatSalary(job.salaryMin, job.salaryMax, t)}
            </span>
          )}
        {job.industry && (
          <span className="inline-flex items-center gap-1.5">
            <span className="text-fg-subtle">{t("jobModal.industry")}:</span>
            {job.industry}
          </span>
        )}
        {job.applicationDeadline && (
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={13} className="text-fg-subtle shrink-0" />
            {t("jobModal.deadline")}:{" "}
            {new Date(job.applicationDeadline).toLocaleDateString()}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 text-fg-subtle">
          {t("jobModal.postedAt")}:{" "}
          {new Date(job.createdAt).toLocaleDateString()}
        </span>
      </div>

      <div className="flex flex-col gap-5">
        {/* Description */}
        <Section title={t("jobModal.secDescription")}>
          <p className="text-[14px] text-fg-muted leading-relaxed whitespace-pre-wrap">
            {job.description}
          </p>
        </Section>

        {/* Requirements */}
        {job.requirements && (
          <Section title={t("jobModal.secRequirements")}>
            <p className="text-[14px] text-fg-muted leading-relaxed whitespace-pre-wrap">
              {job.requirements}
            </p>
          </Section>
        )}

        {/* Benefits */}
        {job.benefits && (
          <Section title={t("jobModal.secBenefits")}>
            <p className="text-[14px] text-fg-muted leading-relaxed whitespace-pre-wrap">
              {job.benefits}
            </p>
          </Section>
        )}

        {/* Required skills */}
        <Section title={t("jobModal.secRequiredSkills")}>
          {job.requiredSkills.length === 0 ? (
            <p className="text-[13px] text-fg-subtle">{t("jobModal.noSkills")}</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {job.requiredSkills.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center rounded-md border border-accent/25 bg-accent/8 px-2.5 py-0.5 text-[12.5px] text-accent"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </Section>

        {/* Preferred skills */}
        {job.preferredSkills && job.preferredSkills.length > 0 && (
          <Section title={t("jobModal.secPreferredSkills")}>
            <div className="flex flex-wrap gap-1.5">
              {job.preferredSkills.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center rounded-md border border-border bg-surface-2/60 px-2.5 py-0.5 text-[12.5px] text-fg-muted"
                >
                  {s}
                </span>
              ))}
            </div>
          </Section>
        )}
      </div>
    </Modal>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[11.5px] uppercase tracking-[0.10em] font-semibold text-fg-subtle mb-2">
        {title}
      </div>
      {children}
    </div>
  );
}

function jobTypeKeyFor(type: string): TranslationKey | null {
  switch (type) {
    case "full_time": return "jobType.full_time";
    case "part_time": return "jobType.part_time";
    case "contract":  return "jobType.contract";
    case "internship": return "jobType.internship";
    default: return null;
  }
}

function expKeyFor(level: string): TranslationKey | null {
  switch (level) {
    case "entry":  return "expLevel.entry";
    case "mid":    return "expLevel.mid";
    case "senior": return "expLevel.senior";
    case "lead":   return "expLevel.lead";
    default: return null;
  }
}

function formatSalary(
  min: number | null | undefined,
  max: number | null | undefined,
  t: (key: TranslationKey) => string,
): string {
  const fmt = (vndK: number) =>
    vndK >= 1000 ? `${(vndK / 1000).toFixed(1)}M VND` : `${vndK}k VND`;
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
  if (min != null) return t("jobCard.salaryFrom").replace("{amount}", fmt(min));
  if (max != null) return t("jobCard.salaryUpTo").replace("{amount}", fmt(max));
  return t("jobCard.salaryUndisclosed");
}
