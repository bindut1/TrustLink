"use client";

import { ClipboardList, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { useSetPageMeta } from "@/components/app-shell/page-meta";
import { JobDetailModal } from "@/components/candidate/JobDetailModal";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { MatchScoreBar } from "@/components/ui/MatchScoreBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { fetchJob, fetchMyApplications } from "@/lib/candidate-api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";
import type {
  ApplicationItem,
  ApplicationStatus,
  JobItem,
} from "@/types/candidate";

// Linear hiring pipeline; rejected / withdrawn are terminal off-pipeline.
const PIPELINE: ApplicationStatus[] = [
  "applied",
  "reviewing",
  "shortlisted",
  "interview",
  "offered",
];

const STATUS_KEY: Record<ApplicationStatus, TranslationKey> = {
  applied: "status.app.applied",
  reviewing: "status.app.reviewing",
  shortlisted: "status.app.shortlisted",
  interview: "status.app.interview",
  offered: "status.app.offered",
  rejected: "status.app.rejected",
  withdrawn: "status.app.withdrawn",
};

function statusPillClass(s: ApplicationStatus): string {
  if (s === "offered") return "bg-success/12 text-success";
  if (s === "rejected") return "bg-danger/10 text-danger";
  if (s === "withdrawn") return "bg-surface-2 text-fg-muted";
  return "bg-navy/8 text-navy"; // in-progress stages
}

export default function CandidateApplicationsPage() {
  const { t } = useLanguage();
  useSetPageMeta(
    t("candidate.applications.title"),
    t("candidate.applications.description"),
  );

  const [items, setItems] = useState<ApplicationItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailTarget, setDetailTarget] = useState<JobItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  async function openDetail(jobId: string) {
    setLoadingDetail(true);
    try {
      setDetailTarget(await fetchJob(jobId));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("candidate.recs.failedJob"));
    } finally {
      setLoadingDetail(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetchMyApplications()
      .then((r) => !cancelled && setItems(r))
      .catch((e: unknown) => {
        if (!cancelled)
          setError(
            e instanceof Error ? e.message : t("issuer.credentials.failedLoad"),
          );
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {!items ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={148} className="rounded-card" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={t("candidate.applications.emptyTitle")}
          description={
            <>
              {t("candidate.applications.emptyDescBefore")}
              <a href="/candidate/jobs" className="text-navy font-medium hover:underline">
                {t("candidate.applications.emptyDescJobsLink")}
              </a>
              {t("candidate.applications.emptyDescOr")}
              <a
                href="/candidate/recommendations"
                className="text-navy font-medium hover:underline"
              >
                {t("candidate.applications.emptyDescRecsLink")}
              </a>
              {t("candidate.applications.emptyDescAfter")}
            </>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              onViewDetail={
                app.job?.id && !loadingDetail
                  ? () => openDetail(app.job!.id)
                  : undefined
              }
            />
          ))}
        </div>
      )}
      <JobDetailModal
        job={detailTarget}
        applied
        onClose={() => setDetailTarget(null)}
      />
    </>
  );
}

function ApplicationCard({
  app,
  onViewDetail,
}: {
  app: ApplicationItem;
  onViewDetail?: () => void;
}) {
  const { t } = useLanguage();
  const job = app.job;
  const hasScore = app.matchScore != null;

  return (
    <article
      className={cn(
        "rounded-card border border-border bg-canvas p-5 sm:p-6 shadow-[var(--shadow-card)]",
        onViewDetail && "cursor-pointer tl-card-interactive",
      )}
      onClick={onViewDetail}
      role={onViewDetail ? "button" : undefined}
      tabIndex={onViewDetail ? 0 : undefined}
      onKeyDown={
        onViewDetail
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onViewDetail();
              }
            }
          : undefined
      }
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium",
                statusPillClass(app.status),
              )}
            >
              {t(STATUS_KEY[app.status])}
            </span>
            <span className="text-[12px] text-fg-subtle font-mono">
              {t("candidate.applications.appliedTime").replace(
                "{time}",
                timeAgo(app.createdAt, t),
              )}
            </span>
          </div>

          <h3 className="text-[17px] font-semibold tracking-[-0.015em] text-fg leading-snug mb-1.5">
            {job?.title ?? "—"}
          </h3>

          {(job?.city || job?.isRemote) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-fg-muted mb-3">
              {job?.city && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={13} className="text-fg-subtle" />
                  {job.city}
                </span>
              )}
              {job?.isRemote && <span>{t("common.remote")}</span>}
            </div>
          )}

          <StatusStepper status={app.status} />

          {app.recruiterNotes && (
            <p className="text-[13px] text-fg-muted leading-relaxed border-l-2 border-border pl-3 mt-3">
              <span className="font-semibold text-fg">
                {t("candidate.applications.recruiterNote")}{" "}
              </span>
              {app.recruiterNotes}
            </p>
          )}
        </div>

        {hasScore && (
          <div className="shrink-0 sm:w-[200px]">
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="font-mono text-[20px] font-semibold text-fg tabular-nums leading-none">
                {Math.round(Number(app.matchScore))}
              </span>
              <span className="text-[12px] text-fg-faint">/ 100</span>
            </div>
            <MatchScoreBar
              breakdown={{
                keywordScore: Number(app.keywordScore ?? 0),
                semanticScore: Number(app.semanticScore ?? 0),
                verifiedBonus: Number(app.verifiedBonus ?? 0),
                totalScore: Number(app.matchScore ?? 0),
              }}
            />
          </div>
        )}
      </div>
    </article>
  );
}

function StatusStepper({ status }: { status: ApplicationStatus }) {
  const { t } = useLanguage();
  const terminal = status === "rejected" || status === "withdrawn";
  const currentIndex = PIPELINE.indexOf(status);

  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      {PIPELINE.map((stage, i) => {
        const reached = !terminal && i <= currentIndex;
        const isCurrent = !terminal && i === currentIndex;
        return (
          <div key={stage} className="flex items-center gap-1.5">
            <span
              className={cn(
                "h-1.5 rounded-full transition-colors",
                isCurrent ? "w-6" : "w-4",
                reached ? "bg-navy" : terminal ? "bg-danger/30" : "bg-surface-3",
              )}
              title={t(STATUS_KEY[stage])}
            />
          </div>
        );
      })}
      <span
        className={cn(
          "ml-1.5 text-[11.5px] font-medium",
          terminal ? "text-danger" : "text-fg-subtle",
        )}
      >
        {terminal
          ? t(STATUS_KEY[status])
          : `${currentIndex + 1}/${PIPELINE.length}`}
      </span>
    </div>
  );
}

function timeAgo(
  iso: string,
  t: (
    key: "common.justNow" | "common.minutesAgo" | "common.hoursAgo" | "common.daysAgo",
  ) => string,
): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return t("common.justNow");
  if (sec < 3600) return `${Math.floor(sec / 60)} ${t("common.minutesAgo")}`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} ${t("common.hoursAgo")}`;
  return `${Math.floor(sec / 86400)} ${t("common.daysAgo")}`;
}
