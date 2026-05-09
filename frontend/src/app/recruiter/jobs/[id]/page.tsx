"use client";

import { Briefcase, Edit2, MapPin, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { ApplicationStatusBadge } from "@/components/candidate/ApplicationStatusBadge";
import { ScoreBreakdown } from "@/components/candidate/ScoreBreakdown";
import { ApplicationStatusSelect } from "@/components/recruiter/ApplicationStatusSelect";
import { CandidateVerifyModal } from "@/components/recruiter/CandidateVerifyModal";
import { JobStatusBadge } from "@/components/recruiter/JobStatusBadge";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  fetchJob,
  fetchJobApplications,
  fetchRecommendedCandidates,
  updateJob,
} from "@/lib/recruiter-api";
import type { ApplicationStatus, JobItem } from "@/types/candidate";
import type {
  ApplicationWithCandidate,
  JobStatus,
  RankedCandidate,
} from "@/types/recruiter-app";

type Tab = "overview" | "candidates" | "applications";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "candidates", label: "Recommended candidates" },
  { key: "applications", label: "Applications" },
];

export default function RecruiterJobDetailPage() {
  const params = useParams<{ id: string }>();
  const jobId = params?.id;

  const [tab, setTab] = useState<Tab>("overview");
  const [job, setJob] = useState<JobItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    fetchJob(jobId).then(setJob).catch((e: unknown) => {
      setError(e instanceof Error ? e.message : "Failed to load job");
    });
  }, [jobId]);

  async function transition(status: JobStatus) {
    if (!job) return;
    setStatusSaving(true);
    try {
      const next = await updateJob(job.id, { status });
      setJob(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Status update failed");
    } finally {
      setStatusSaving(false);
    }
  }

  if (error) {
    return (
      <>
        <PageHeader title="Job" />
        <Alert variant="error">{error}</Alert>
      </>
    );
  }

  if (!job) {
    return (
      <>
        <PageHeader title="Job" />
        <div className="rounded-2xl border border-border bg-canvas p-10 text-center text-fg-subtle">
          Loading…
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={job.title}
        description={job.industry ?? undefined}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <JobStatusBadge status={job.status as JobStatus} />
            {job.status === "draft" && (
              <Button
                size="md"
                onClick={() => transition("open")}
                loading={statusSaving}
              >
                Publish
              </Button>
            )}
            {job.status === "open" && (
              <Button
                size="md"
                variant="secondary"
                onClick={() => transition("closed")}
                loading={statusSaving}
              >
                Close
              </Button>
            )}
            <Link href={`/recruiter/jobs/${job.id}/edit`}>
              <Button size="md" variant="secondary" leftIcon={<Edit2 size={13} />}>
                Edit
              </Button>
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-fg-muted mb-5">
        {(job.city || job.location) && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={13} className="text-fg-subtle" />
            {job.city ?? job.location}
          </span>
        )}
        {job.isRemote && <Badge variant="info">Remote</Badge>}
        {job.jobType && (
          <span className="inline-flex items-center gap-1.5">
            <Briefcase size={13} className="text-fg-subtle" />
            {formatJobType(job.jobType)}
          </span>
        )}
        {(job.salaryMin != null || job.salaryMax != null) && (
          <span>{formatSalary(job.salaryMin, job.salaryMax)}</span>
        )}
      </div>

      {/* Tabs */}
      <div role="tablist" className="flex flex-wrap gap-1 mb-5 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "h-10 px-4 -mb-px border-b-2 text-[14px] font-medium transition-colors",
              tab === t.key
                ? "border-accent text-fg"
                : "border-transparent text-fg-muted hover:text-fg",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab job={job} />}
      {tab === "candidates" && <CandidatesTab jobId={job.id} />}
      {tab === "applications" && <ApplicationsTab jobId={job.id} />}
    </>
  );
}

function OverviewTab({ job }: { job: JobItem }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 rounded-2xl border border-border bg-canvas p-5 sm:p-6">
        <Section title="Description">
          <p className="text-[14.5px] text-fg-muted whitespace-pre-wrap leading-relaxed">
            {job.description}
          </p>
        </Section>
        {job.requirements && (
          <Section title="Requirements">
            <p className="text-[14.5px] text-fg-muted whitespace-pre-wrap leading-relaxed">
              {job.requirements}
            </p>
          </Section>
        )}
        {job.benefits && (
          <Section title="Benefits">
            <p className="text-[14.5px] text-fg-muted whitespace-pre-wrap leading-relaxed">
              {job.benefits}
            </p>
          </Section>
        )}
      </div>

      <aside className="rounded-2xl border border-border bg-canvas p-5 sm:p-6 h-fit">
        <Section title="Required skills">
          {job.requiredSkills.length === 0 ? (
            <p className="text-[13px] text-fg-subtle">None added.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {job.requiredSkills.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center rounded-md border border-accent/25 bg-accent/8 px-2 py-0.5 text-[12px] text-accent"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </Section>
        {job.preferredSkills && job.preferredSkills.length > 0 && (
          <Section title="Preferred skills">
            <div className="flex flex-wrap gap-1.5">
              {job.preferredSkills.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center rounded-md border border-border bg-surface-2/60 px-2 py-0.5 text-[12px] text-fg-muted"
                >
                  {s}
                </span>
              ))}
            </div>
          </Section>
        )}
      </aside>
    </div>
  );
}

function CandidatesTab({ jobId }: { jobId: string }) {
  const [items, setItems] = useState<RankedCandidate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifyTarget, setVerifyTarget] = useState<{
    id: string;
    fullName: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchRecommendedCandidates(jobId, 20)
      .then((r) => {
        if (!cancelled) setItems(r);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load candidates");
      });
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  if (error) return <Alert variant="error">{error}</Alert>;
  if (!items)
    return (
      <div className="rounded-2xl border border-border bg-canvas p-10 text-center text-fg-subtle">
        Computing AI rankings…
      </div>
    );
  if (items.length === 0)
    return (
      <div className="rounded-2xl border border-dashed border-border bg-canvas p-10 text-center text-fg-subtle">
        No candidates ranked yet — try once you have candidate embeddings in
        the system.
      </div>
    );

  return (
    <>
      <div className="flex flex-col gap-3">
        {items.map((r, i) => (
          <article
            key={r.candidate.id}
            className="rounded-2xl border border-border bg-canvas p-5 sm:p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <span className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-accent text-[12px] font-mono font-semibold border border-accent/25">
                  #{i + 1}
                </span>
                <div className="min-w-0">
                  <div className="text-[16px] font-semibold text-fg leading-tight">
                    {r.candidate.fullName}
                  </div>
                  <div className="text-[12.5px] text-fg-subtle font-mono mt-0.5">
                    {r.candidate.email}
                  </div>
                </div>
              </div>
              <div className="shrink-0 flex flex-col items-stretch gap-2.5 min-w-[260px]">
                <ScoreBreakdown
                  keywordScore={r.keywordScore}
                  semanticScore={r.semanticScore}
                  verifiedBonus={r.verifiedBonus}
                  totalScore={r.totalScore}
                  variant="full"
                />
                <Button
                  variant="secondary"
                  size="md"
                  leftIcon={<ShieldCheck size={14} />}
                  onClick={() =>
                    setVerifyTarget({
                      id: r.candidate.id,
                      fullName: r.candidate.fullName,
                    })
                  }
                >
                  1-click verify
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
      <CandidateVerifyModal
        candidate={verifyTarget}
        onClose={() => setVerifyTarget(null)}
      />
    </>
  );
}

function ApplicationsTab({ jobId }: { jobId: string }) {
  const [items, setItems] = useState<ApplicationWithCandidate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifyTarget, setVerifyTarget] = useState<{
    id: string;
    fullName: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchJobApplications(jobId)
      .then((r) => {
        if (!cancelled) {
          // Sort by match_score DESC client-side as a safety net.
          const sorted = [...r].sort(
            (a, b) =>
              Number(b.matchScore ?? 0) - Number(a.matchScore ?? 0),
          );
          setItems(sorted);
        }
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load applications");
      });
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  function handleStatusChange(appId: string, status: ApplicationStatus) {
    setItems((prev) =>
      prev
        ? prev.map((a) => (a.id === appId ? { ...a, status } : a))
        : prev,
    );
  }

  if (error) return <Alert variant="error">{error}</Alert>;
  if (!items)
    return (
      <div className="rounded-2xl border border-border bg-canvas p-10 text-center text-fg-subtle">
        Loading…
      </div>
    );
  if (items.length === 0)
    return (
      <div className="rounded-2xl border border-dashed border-border bg-canvas p-10 text-center text-fg-subtle">
        No applications yet.
      </div>
    );

  return (
    <>
      <div className="flex flex-col gap-3">
        {items.map((app) => (
          <article
            key={app.id}
            className="rounded-2xl border border-border bg-canvas p-5 sm:p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <ApplicationStatusBadge status={app.status} />
                  <span className="text-[12px] text-fg-subtle font-mono">
                    {new Date(app.createdAt).toLocaleString()}
                  </span>
                </div>
                <h3 className="text-[16px] font-semibold text-fg leading-snug">
                  {app.candidate?.fullName ?? "Anonymous candidate"}
                </h3>
                {app.candidate?.email && (
                  <div className="text-[12.5px] text-fg-subtle font-mono mt-0.5">
                    {app.candidate.email}
                  </div>
                )}
                {app.coverLetter && (
                  <p className="mt-3 text-[13.5px] text-fg-muted leading-relaxed border-l-2 border-border pl-3">
                    {app.coverLetter}
                  </p>
                )}
              </div>
              <div className="shrink-0 flex flex-col items-stretch gap-3 min-w-[240px]">
                {app.matchScore != null && (
                  <ScoreBreakdown
                    keywordScore={Number(app.keywordScore ?? 0)}
                    semanticScore={Number(app.semanticScore ?? 0)}
                    verifiedBonus={Number(app.verifiedBonus ?? 0)}
                    totalScore={Number(app.matchScore)}
                  />
                )}
                <ApplicationStatusSelect
                  applicationId={app.id}
                  status={app.status}
                  onChange={(s) => handleStatusChange(app.id, s)}
                />
                {app.candidate && (
                  <Button
                    variant="secondary"
                    size="md"
                    leftIcon={<ShieldCheck size={13} />}
                    onClick={() =>
                      setVerifyTarget({
                        id: app.candidate!.id,
                        fullName: app.candidate!.fullName,
                      })
                    }
                  >
                    Verify credentials
                  </Button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
      <CandidateVerifyModal
        candidate={verifyTarget}
        onClose={() => setVerifyTarget(null)}
      />
    </>
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
    <div className="mb-5 last:mb-0">
      <div className="text-[11.5px] uppercase tracking-[0.10em] font-semibold text-fg-subtle mb-2">
        {title}
      </div>
      {children}
    </div>
  );
}

function formatJobType(t: string): string {
  return t
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function formatSalary(min?: number | null, max?: number | null): string {
  const fmt = (vndK: number) => {
    if (vndK >= 1000) return `${(vndK / 1000).toFixed(1)}M VND`;
    return `${vndK}k VND`;
  };
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
  if (min != null) return `From ${fmt(min)}`;
  if (max != null) return `Up to ${fmt(max)}`;
  return "Salary undisclosed";
}

