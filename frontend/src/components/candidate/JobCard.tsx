import { ArrowRight, Briefcase, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { JobItem } from "@/types/candidate";
import type { ReactNode } from "react";

type JobCardProps = {
  job: JobItem;
  onApply?: () => void;
  /** Optional slot for a score panel etc. */
  meta?: ReactNode;
};

export function JobCard({ job, onApply, meta }: JobCardProps) {
  return (
    <article className="rounded-2xl border border-border bg-canvas p-5 sm:p-6 transition-colors hover:border-border-strong">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {job.isRemote && <Badge variant="info">Remote</Badge>}
            {job.jobType && (
              <Badge variant="neutral">{formatJobType(job.jobType)}</Badge>
            )}
            {job.experienceLevel && (
              <Badge variant="neutral">
                {capitalize(job.experienceLevel)}
              </Badge>
            )}
          </div>

          <h3 className="text-[19px] sm:text-[20px] font-bold tracking-[-0.02em] leading-snug text-fg mb-2">
            {job.title}
          </h3>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-fg-muted mb-3">
            {(job.city || job.location) && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={13} className="text-fg-subtle" />
                {job.city ?? job.location}
              </span>
            )}
            {(job.salaryMin != null || job.salaryMax != null) && (
              <span className="inline-flex items-center gap-1.5">
                <Briefcase size={13} className="text-fg-subtle" />
                {formatSalary(job.salaryMin, job.salaryMax)}
              </span>
            )}
          </div>

          {job.requiredSkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {job.requiredSkills.slice(0, 6).map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center rounded-md border border-border bg-surface-2/60 px-2 py-0.5 text-[12px] text-fg-muted"
                >
                  {s}
                </span>
              ))}
              {job.requiredSkills.length > 6 && (
                <span className="text-[12px] text-fg-subtle px-2 py-0.5">
                  +{job.requiredSkills.length - 6}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="shrink-0 flex flex-col items-stretch sm:items-end gap-3">
          {meta}
          {onApply && (
            <Button onClick={onApply} rightIcon={<ArrowRight size={14} />}>
              Apply
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

function formatJobType(t: string): string {
  return t
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatSalary(min?: number | null, max?: number | null): string {
  // Backend stores in VND thousands; show in million-VND for readability.
  const fmt = (vndK: number) => {
    if (vndK >= 1000) return `${(vndK / 1000).toFixed(1)}M VND`;
    return `${vndK}k VND`;
  };
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
  if (min != null) return `From ${fmt(min)}`;
  if (max != null) return `Up to ${fmt(max)}`;
  return "Salary undisclosed";
}
