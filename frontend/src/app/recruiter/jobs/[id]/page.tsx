"use client";

import {
  Briefcase,
  CheckCircle2,
  Edit2,
  Mail,
  MapPin,
  Send,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSetPageMeta } from "@/components/app-shell/page-meta";
import { ApplicationStatusBadge } from "@/components/candidate/ApplicationStatusBadge";
import { ApplicationStatusSelect } from "@/components/recruiter/ApplicationStatusSelect";
import {
  CandidateInfoModal,
  type CandidateInfoData,
} from "@/components/recruiter/CandidateInfoModal";
import { CandidateVerifyModal } from "@/components/recruiter/CandidateVerifyModal";
import { JobStatusBadge } from "@/components/recruiter/JobStatusBadge";
import { OfferModal } from "@/components/recruiter/OfferModal";
import { SentOfferDetailModal } from "@/components/recruiter/SentOfferDetailModal";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { MatchScoreBar } from "@/components/ui/MatchScoreBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { SkillTag } from "@/components/ui/SkillTag";
import { cn } from "@/lib/cn";
import {
  fetchJob,
  fetchJobApplications,
  fetchJobInvitations,
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
  SentInvitationItem,
} from "@/types/recruiter-app";

type Tab = "overview" | "candidates" | "applications" | "invitations";

const TABS: { key: Tab; labelKey: TranslationKey }[] = [
  { key: "overview", labelKey: "recruiter.jobDetail.tabOverview" },
  { key: "candidates", labelKey: "recruiter.jobDetail.tabCandidates" },
  { key: "applications", labelKey: "recruiter.jobDetail.tabApplications" },
  { key: "invitations", labelKey: "recruiter.jobDetail.tabInvitations" },
];

export default function RecruiterJobDetailPage() {
  const { t } = useLanguage();
  const params = useParams<{ id: string }>();
  const jobId = params?.id;

  const [tab, setTab] = useState<Tab>("overview");
  const [job, setJob] = useState<JobItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);

  useSetPageMeta(
    job?.title ?? t("recruiter.jobDetail.titleFallback"),
    job?.industry ?? undefined,
  );

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
    return <Alert variant="error">{error}</Alert>;
  }

  if (!job) {
    return (
      <div className="rounded-card border border-border bg-canvas p-10 text-center text-fg-subtle shadow-[var(--shadow-card)]">
        {t("common.loading")}
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <JobStatusBadge status={job.status as JobStatus} />
        <div className="flex flex-wrap items-center gap-2">
          {job.status === "draft" && (
            <Button onClick={() => transition("open")} loading={statusSaving}>
              {t("recruiter.jobDetail.publish")}
            </Button>
          )}
          {job.status === "open" && (
            <Button
              variant="secondary"
              onClick={() => transition("closed")}
              loading={statusSaving}
            >
              {t("recruiter.jobDetail.close")}
            </Button>
          )}
          <Link href={`/recruiter/jobs/${job.id}/edit`}>
            <Button variant="secondary" leftIcon={<Edit2 size={13} />}>
              {t("recruiter.jobDetail.edit")}
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-fg-muted mb-5">
        {(job.city || job.location) && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={13} className="text-fg-subtle" />
            {job.city ?? job.location}
          </span>
        )}
        {job.isRemote && <Badge variant="neutral">{t("common.remote")}</Badge>}
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
              "h-10 px-4 -mb-px border-b-2 text-[14px] font-medium transition-colors duration-150",
              tab === tabItem.key
                ? "border-navy text-fg"
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
      {tab === "invitations" && <InvitationsTab jobId={job.id} />}
    </>
  );
}

function OverviewTab({ job }: { job: JobItem }) {
  const { t } = useLanguage();
  return (
    <div className="rounded-card border border-border bg-canvas p-5 sm:p-6 shadow-[var(--shadow-card)]">
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
        <Section title={t("recruiter.jobDetail.secRequiredSkills")}>
          {job.requiredSkills.length === 0 ? (
            <p className="text-[13px] text-fg-subtle">
              {t("recruiter.jobDetail.noSkills")}
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {job.requiredSkills.map((s) => (
                <SkillTag key={s} size="sm">
                  {s}
                </SkillTag>
              ))}
            </div>
          )}
        </Section>
        {job.preferredSkills && job.preferredSkills.length > 0 && (
          <Section title={t("recruiter.jobDetail.secPreferredSkills")}>
            <div className="flex flex-wrap gap-1.5">
              {job.preferredSkills.map((s) => (
                <SkillTag key={s} size="sm">
                  {s}
                </SkillTag>
              ))}
            </div>
          </Section>
        )}
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
  // Candidate currently being offered (compose-message modal target).
  const [offerTarget, setOfferTarget] = useState<{
    jobId: string;
    candidateId: string;
    fullName: string;
  } | null>(null);
  // Candidates already invited (seeded from the server so the "Đã gửi lời mời"
  // state survives reload/logout, then updated optimistically on new sends).
  const [invited, setInvited] = useState<Record<string, true>>({});

  useEffect(() => {
    let cancelled = false;
    fetchRecommendedCandidates(jobId, 5)
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
    // Seed already-invited candidates so their button stays "Đã gửi lời mời".
    fetchJobInvitations(jobId)
      .then((list) => {
        if (cancelled) return;
        const seeded: Record<string, true> = {};
        for (const inv of list) seeded[inv.candidate.id] = true;
        setInvited(seeded);
      })
      .catch(() => {
        /* non-fatal — buttons just won't be pre-marked */
      });
    return () => {
      cancelled = true;
    };
  }, [jobId, t]);

  if (error) return <Alert variant="error">{error}</Alert>;
  if (!items)
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={120} className="rounded-card" />
        ))}
      </div>
    );
  if (items.length === 0)
    return (
      <EmptyState icon={Users} title={t("recruiter.jobDetail.candidatesEmpty")} />
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
            className="rounded-card border border-border bg-canvas p-5 sm:p-6 shadow-[var(--shadow-card)] cursor-pointer tl-card-interactive"
          >
            <div className="flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-8">
              {/* Candidate */}
              <div className="flex items-start gap-3 min-w-0 lg:w-[280px] lg:shrink-0">
                <span className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full bg-navy/8 text-navy text-[12px] font-mono font-semibold">
                  {i + 1}
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
                  <div className="text-[12.5px] text-fg-subtle font-mono mt-0.5 truncate">
                    {r.candidate.email}
                  </div>
                  {r.candidate.candidateProfile?.desiredPosition && (
                    <div className="text-[12.5px] text-fg-muted mt-1 truncate">
                      {r.candidate.candidateProfile.desiredPosition}
                    </div>
                  )}
                </div>
              </div>

              {/* Match score — compact (big number + thin bar) */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="font-mono text-[26px] font-semibold text-fg tabular-nums leading-none">
                    {Math.round(Number(r.totalScore))}
                  </span>
                  <span className="text-[13px] text-fg-subtle">
                    / 100 {t("candidate.recs.match")}
                  </span>
                </div>
                <MatchScoreBar breakdown={r} className="max-w-[360px]" />
              </div>

              {/* Actions */}
              <div
                className="shrink-0 flex flex-col gap-2 lg:w-[176px]"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="secondary"
                  size="sm"
                  block
                  leftIcon={<User size={13} />}
                  onClick={() => setInfoTarget({ candidate: r.candidate })}
                >
                  {t("recruiter.jobDetail.viewProfile")}
                </Button>
                <Button
                  variant="verified"
                  size="sm"
                  block
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
                {invited[r.candidate.id] ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    block
                    disabled
                    leftIcon={<CheckCircle2 size={14} />}
                  >
                    {t("recruiter.jobDetail.invited")}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    block
                    leftIcon={<Send size={13} />}
                    onClick={() =>
                      setOfferTarget({
                        jobId,
                        candidateId: r.candidate.id,
                        fullName: r.candidate.fullName,
                      })
                    }
                  >
                    {t("recruiter.jobDetail.invite")}
                  </Button>
                )}
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
      <OfferModal
        target={offerTarget}
        onClose={() => setOfferTarget(null)}
        onSent={(candidateId) =>
          setInvited((s) => ({ ...s, [candidateId]: true }))
        }
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
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} height={140} className="rounded-card" />
        ))}
      </div>
    );
  if (items.length === 0)
    return (
      <EmptyState icon={User} title={t("recruiter.jobDetail.appsEmpty")} />
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
            className="rounded-card border border-border bg-canvas p-5 sm:p-6 shadow-[var(--shadow-card)] cursor-pointer tl-card-interactive"
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
                  <div>
                    <div className="flex items-baseline gap-1.5 mb-1.5">
                      <span className="font-mono text-[18px] font-semibold text-fg tabular-nums leading-none">
                        {Math.round(Number(app.matchScore))}
                      </span>
                      <span className="text-[11px] text-fg-faint">/ 100</span>
                    </div>
                    <MatchScoreBar
                      breakdown={{
                        keywordScore: Number(app.keywordScore ?? 0),
                        semanticScore: Number(app.semanticScore ?? 0),
                        verifiedBonus: Number(app.verifiedBonus ?? 0),
                        totalScore: Number(app.matchScore),
                      }}
                    />
                  </div>
                )}
                <ApplicationStatusSelect
                  applicationId={app.id}
                  status={app.status}
                  onChange={(s) => handleStatusChange(app.id, s)}
                />
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    leftIcon={<User size={13} />}
                    onClick={() => setInfoTarget(toInfoData(app))}
                  >
                    {t("recruiter.jobDetail.viewProfile")}
                  </Button>
                  {app.candidate && (
                    <Button
                      variant="verified"
                      size="sm"
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

function InvitationsTab({ jobId }: { jobId: string }) {
  const { t } = useLanguage();
  const [items, setItems] = useState<SentInvitationItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailTarget, setDetailTarget] = useState<SentInvitationItem | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    fetchJobInvitations(jobId)
      .then((r) => !cancelled && setItems(r))
      .catch((e: unknown) => {
        if (!cancelled)
          setError(
            e instanceof Error
              ? e.message
              : t("recruiter.jobDetail.invitationsFailedLoad"),
          );
      });
    return () => {
      cancelled = true;
    };
  }, [jobId, t]);

  if (error) return <Alert variant="error">{error}</Alert>;
  if (!items)
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} height={96} className="rounded-card" />
        ))}
      </div>
    );
  if (items.length === 0)
    return (
      <EmptyState
        icon={Mail}
        title={t("recruiter.jobDetail.invitationsEmpty")}
      />
    );

  return (
    <>
      <div className="flex flex-col gap-3">
        {items.map((inv) => {
          const badge = inv.hasApplied
            ? {
                label: t("recruiter.jobDetail.invStatusApplied"),
                cls: "bg-success/12 text-success",
              }
            : inv.status === "declined"
              ? {
                  label: t("recruiter.jobDetail.invStatusDeclined"),
                  cls: "bg-danger/10 text-danger",
                }
              : {
                  label: t("recruiter.jobDetail.invStatusPending"),
                  cls: "bg-navy/8 text-navy",
                };
          return (
            <article
              key={inv.id}
              role="button"
              tabIndex={0}
              onClick={() => setDetailTarget(inv)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setDetailTarget(inv);
                }
              }}
              className="rounded-card border border-border bg-canvas p-5 shadow-[var(--shadow-card)] cursor-pointer tl-card-interactive"
            >
              <div className="flex items-start gap-3">
                <Avatar
                  name={inv.candidate.fullName}
                  src={inv.candidate.avatarUrl}
                  size={40}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[15px] font-semibold text-fg leading-tight">
                      {inv.candidate.fullName}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium",
                        badge.cls,
                      )}
                    >
                      {badge.label}
                    </span>
                    <span className="text-[12px] text-fg-subtle font-mono">
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-[12.5px] text-fg-subtle font-mono mt-0.5 truncate">
                    {inv.candidate.email}
                  </div>
                  {inv.message && (
                    <p className="text-[13px] text-fg-muted leading-relaxed border-l-2 border-border pl-3 mt-2 line-clamp-2">
                      {inv.message}
                    </p>
                  )}
                  {inv.status === "declined" && inv.declineReason && (
                    <p className="text-[13px] text-danger leading-relaxed border-l-2 border-danger/30 pl-3 mt-2">
                      <span className="font-semibold">
                        {t("recruiter.jobDetail.invDeclineReason")}{" "}
                      </span>
                      {inv.declineReason}
                    </p>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <SentOfferDetailModal
        invitation={detailTarget}
        onClose={() => setDetailTarget(null)}
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

