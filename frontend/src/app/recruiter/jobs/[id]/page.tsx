"use client";

import { Briefcase, Edit2, MapPin, ShieldCheck, User } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { ApplicationStatusBadge } from "@/components/candidate/ApplicationStatusBadge";
import { ScoreBreakdown } from "@/components/candidate/ScoreBreakdown";
import { ApplicationStatusSelect } from "@/components/recruiter/ApplicationStatusSelect";
import {
  CandidateInfoModal,
  type CandidateInfoData,
} from "@/components/recruiter/CandidateInfoModal";
import { CandidateVerifyModal } from "@/components/recruiter/CandidateVerifyModal";
import { JobStatusBadge } from "@/components/recruiter/JobStatusBadge";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  fetchJob,
  fetchJobApplications,
  fetchRecommendedCandidates,
  updateJob,
} from "@/lib/recruiter-api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";
import type { ApplicationStatus, JobItem } from "@/types/candidate";
import type {
  ApplicationWithCandidate,
  JobStatus,
  RankedCandidate,
} from "@/types/recruiter-app";

type Tab = "overview" | "candidates" | "applications";

const TABS: { key: Tab; labelKey: TranslationKey }[] = [
  { key: "overview", labelKey: "recruiter.jobDetail.tabOverview" },
  { key: "candidates", labelKey: "recruiter.jobDetail.tabCandidates" },
  { key: "applications", labelKey: "recruiter.jobDetail.tabApplications" },
];

export default function RecruiterJobDetailPage() {
  const { t } = useLanguage();
  const params = useParams<{ id: string }>();
  const jobId = params?.id;

  const [tab, setTab] = useState<Tab>("overview");
  const [job, setJob] = useState<JobItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    fetchJob(jobId).then(setJob).catch((e: unknown) => {
      setError(
        e instanceof Error ? e.message : t("recruiter.jobDetail.failedLoad"),
      );
    });
  }, [jobId, t]);

  async function transition(status: JobStatus) {
    if (!job) return;
    setStatusSaving(true);
    try {
      const next = await updateJob(job.id, { status });
      setJob(next);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : t("recruiter.jobDetail.statusUpdateFailed"),
      );
    } finally {
      setStatusSaving(false);
    }
  }

  if (error) {
    return (
      <>
        <PageHeader title={t("recruiter.jobDetail.titleFallback")} />
        <Alert variant="error">{error}</Alert>
      </>
    );
  }

  if (!job) {
    return (
      <>
        <PageHeader title={t("recruiter.jobDetail.titleFallback")} />
        <div className="rounded-2xl border border-border bg-canvas p-10 text-center text-fg-subtle">
          {t("common.loading")}
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
                {t("recruiter.jobDetail.publish")}
              </Button>
            )}
            {job.status === "open" && (
              <Button
                size="md"
                variant="secondary"
                onClick={() => transition("closed")}
                loading={statusSaving}
              >
                {t("recruiter.jobDetail.close")}
              </Button>
            )}
            <Link href={`/recruiter/jobs/${job.id}/edit`}>
              <Button size="md" variant="secondary" leftIcon={<Edit2 size={13} />}>
                {t("recruiter.jobDetail.edit")}
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
        {job.isRemote && <Badge variant="info">{t("common.remote")}</Badge>}
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
        {TABS.map((tabItem) => (
          <button
            key={tabItem.key}
            type="button"
            role="tab"
            aria-selected={tab === tabItem.key}
            onClick={() => setTab(tabItem.key)}
            className={cn(
              "h-10 px-4 -mb-px border-b-2 text-[14px] font-medium transition-colors",
              tab === tabItem.key
                ? "border-accent text-fg"
                : "border-transparent text-fg-muted hover:text-fg",
            )}
          >
            {t(tabItem.labelKey)}
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
  const { t } = useLanguage();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 rounded-2xl border border-border bg-canvas p-5 sm:p-6">
        <Section title={t("recruiter.jobDetail.secDescription")}>
          <p className="text-[14.5px] text-fg-muted whitespace-pre-wrap leading-relaxed">
            {job.description}
          </p>
        </Section>
        {job.requirements && (
          <Section title={t("recruiter.jobDetail.secRequirements")}>
            <p className="text-[14.5px] text-fg-muted whitespace-pre-wrap leading-relaxed">
              {job.requirements}
            </p>
          </Section>
        )}
        {job.benefits && (
          <Section title={t("recruiter.jobDetail.secBenefits")}>
            <p className="text-[14.5px] text-fg-muted whitespace-pre-wrap leading-relaxed">
              {job.benefits}
            </p>
          </Section>
        )}
      </div>

      <aside className="rounded-2xl border border-border bg-canvas p-5 sm:p-6 h-fit">
        <Section title={t("recruiter.jobDetail.secRequiredSkills")}>
          {job.requiredSkills.length === 0 ? (
            <p className="text-[13px] text-fg-subtle">
              {t("recruiter.jobDetail.noSkills")}
            </p>
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
          <Section title={t("recruiter.jobDetail.secPreferredSkills")}>
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
  const { t } = useLanguage();
  const [items, setItems] = useState<RankedCandidate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [infoTarget, setInfoTarget] = useState<CandidateInfoData | null>(null);
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
        setError(
          e instanceof Error
            ? e.message
            : t("recruiter.jobDetail.candidatesFailedLoad"),
        );
      });
    return () => {
      cancelled = true;
    };
  }, [jobId, t]);

  if (error) return <Alert variant="error">{error}</Alert>;
  if (!items)
    return (
      <div className="rounded-2xl border border-border bg-canvas p-10 text-center text-fg-subtle">
        {t("recruiter.jobDetail.candidatesLoading")}
      </div>
    );
  if (items.length === 0)
    return (
      <div className="rounded-2xl border border-dashed border-border bg-canvas p-10 text-center text-fg-subtle">
        {t("recruiter.jobDetail.candidatesEmpty")}
      </div>
    );

  return (
    <>
      <div className="flex flex-col gap-3">
        {items.map((r, i) => (
          <article
            key={r.candidate.id}
            role="button"
            tabIndex={0}
            onClick={() => setInfoTarget({ candidate: r.candidate })}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                setInfoTarget({ candidate: r.candidate });
            }}
            className="rounded-2xl border border-border bg-canvas p-5 sm:p-6 cursor-pointer hover:border-border-strong transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <span className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-accent text-[12px] font-mono font-semibold border border-accent/25">
                  #{i + 1}
                </span>
                <Avatar
                  name={r.candidate.fullName}
                  src={r.candidate.avatarUrl}
                  size={40}
                />
                <div className="min-w-0">
                  <div className="text-[16px] font-semibold text-fg leading-tight">
                    {r.candidate.fullName}
                  </div>
                  <div className="text-[12.5px] text-fg-subtle font-mono mt-0.5">
                    {r.candidate.email}
                  </div>
                </div>
              </div>
              <div
                className="shrink-0 flex flex-col items-stretch gap-2.5 min-w-[260px]"
                onClick={(e) => e.stopPropagation()}
              >
                <ScoreBreakdown
                  keywordScore={r.keywordScore}
                  semanticScore={r.semanticScore}
                  verifiedBonus={r.verifiedBonus}
                  totalScore={r.totalScore}
                  variant="full"
                />
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="md"
                    className="flex-1"
                    leftIcon={<User size={13} />}
                    onClick={() => setInfoTarget({ candidate: r.candidate })}
                  >
                    {t("recruiter.jobDetail.viewProfile")}
                  </Button>
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
                    {t("recruiter.jobDetail.verifyClick")}
                  </Button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
      <CandidateInfoModal
        data={infoTarget}
        onClose={() => setInfoTarget(null)}
      />
      <CandidateVerifyModal
        candidate={verifyTarget}
        onClose={() => setVerifyTarget(null)}
      />
    </>
  );
}

function toInfoData(app: ApplicationWithCandidate): CandidateInfoData {
  return {
    candidate: app.candidate ?? {
      id: "",
      fullName: "",
      email: "",
    },
    coverLetter: app.coverLetter,
  };
}

function ApplicationsTab({ jobId }: { jobId: string }) {
  const { t } = useLanguage();
  const [items, setItems] = useState<ApplicationWithCandidate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [infoTarget, setInfoTarget] = useState<CandidateInfoData | null>(null);
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
        setError(
          e instanceof Error
            ? e.message
            : t("recruiter.jobDetail.appsFailedLoad"),
        );
      });
    return () => {
      cancelled = true;
    };
  }, [jobId, t]);

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
        {t("common.loading")}
      </div>
    );
  if (items.length === 0)
    return (
      <div className="rounded-2xl border border-dashed border-border bg-canvas p-10 text-center text-fg-subtle">
        {t("recruiter.jobDetail.appsEmpty")}
      </div>
    );

  return (
    <>
      <div className="flex flex-col gap-3">
        {items.map((app) => (
          <article
            key={app.id}
            role="button"
            tabIndex={0}
            onClick={() => setInfoTarget(toInfoData(app))}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setInfoTarget(toInfoData(app));
            }}
            className="rounded-2xl border border-border bg-canvas p-5 sm:p-6 cursor-pointer hover:border-border-strong transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <Avatar
                  name={
                    app.candidate?.fullName ??
                    t("recruiter.jobDetail.anonymousCandidate")
                  }
                  src={app.candidate?.avatarUrl}
                  size={40}
                  className="mt-0.5"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <ApplicationStatusBadge status={app.status} />
                    <span className="text-[12px] text-fg-subtle font-mono">
                      {new Date(app.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="text-[16px] font-semibold text-fg leading-snug">
                    {app.candidate?.fullName ??
                      t("recruiter.jobDetail.anonymousCandidate")}
                  </h3>
                  {app.candidate?.email && (
                    <div className="text-[12.5px] text-fg-subtle font-mono mt-0.5">
                      {app.candidate.email}
                    </div>
                  )}
                  {app.coverLetter && (
                    <p className="mt-3 text-[13.5px] text-fg-muted leading-relaxed border-l-2 border-border pl-3 line-clamp-2">
                      {app.coverLetter}
                    </p>
                  )}
                </div>
              </div>
              <div
                className="shrink-0 flex flex-col items-stretch gap-3 min-w-[240px]"
                onClick={(e) => e.stopPropagation()}
              >
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
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="md"
                    className="flex-1"
                    leftIcon={<User size={13} />}
                    onClick={() => setInfoTarget(toInfoData(app))}
                  >
                    {t("recruiter.jobDetail.viewProfile")}
                  </Button>
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
                      {t("recruiter.jobDetail.verifyClick")}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
      <CandidateInfoModal
        data={infoTarget}
        onClose={() => setInfoTarget(null)}
      />
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

