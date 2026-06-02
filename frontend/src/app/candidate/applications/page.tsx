"use client";

import { ClipboardList, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { ApplicationStatusBadge } from "@/components/candidate/ApplicationStatusBadge";
import { JobDetailModal } from "@/components/candidate/JobDetailModal";
import { ScoreBreakdown } from "@/components/candidate/ScoreBreakdown";
import { Alert } from "@/components/ui/Alert";
import { fetchJob, fetchMyApplications } from "@/lib/candidate-api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { ApplicationItem, JobItem } from "@/types/candidate";

export default function CandidateApplicationsPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState<ApplicationItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailTarget, setDetailTarget] = useState<JobItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  async function openDetail(jobId: string) {
    setLoadingDetail(true);
    try {
      const job = await fetchJob(jobId);
      setDetailTarget(job);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("candidate.recs.failedJob"));
    } finally {
      setLoadingDetail(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetchMyApplications()
      .then((r) => {
        if (!cancelled) setItems(r);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(
          e instanceof Error ? e.message : t("issuer.credentials.failedLoad"),
        );
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  return (
    <>
      <PageHeader
        title={t("candidate.applications.title")}
        description={t("candidate.applications.description")}
      />

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {!items ? (
        <div className="rounded-2xl border border-border bg-canvas p-10 text-center text-fg-subtle">
          {t("common.loading")}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-canvas p-12 text-center">
          <ClipboardList
            size={32}
            className="mx-auto text-fg-subtle mb-4"
          />
          <h3 className="text-[16px] font-semibold text-fg mb-1.5">
            {t("candidate.applications.emptyTitle")}
          </h3>
          <p className="text-[13.5px] text-fg-muted max-w-[44ch] mx-auto">
            {t("candidate.applications.emptyDescBefore")}
            <a
              href="/candidate/jobs"
              className="text-accent hover:underline"
            >
              {t("candidate.applications.emptyDescJobsLink")}
            </a>
            {t("candidate.applications.emptyDescOr")}
            <a
              href="/candidate/recommendations"
              className="text-accent hover:underline"
            >
              {t("candidate.applications.emptyDescRecsLink")}
            </a>
            {t("candidate.applications.emptyDescAfter")}
          </p>
        </div>
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
  return (
    <article
      className={`rounded-2xl border border-border bg-canvas p-5 sm:p-6 transition-colors hover:border-border-strong${onViewDetail ? " cursor-pointer" : ""}`}
      onClick={onViewDetail}
      role={onViewDetail ? "button" : undefined}
      tabIndex={onViewDetail ? 0 : undefined}
      onKeyDown={
        onViewDetail
          ? (e) => { if (e.key === "Enter" || e.key === " ") onViewDetail(); }
          : undefined
      }
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <ApplicationStatusBadge status={app.status} />
            <span className="text-[12px] text-fg-subtle font-mono">
              {t("candidate.applications.appliedTime").replace(
                "{time}",
                timeAgo(app.createdAt, t),
              )}
            </span>
          </div>

          <h3 className="text-[18px] font-semibold tracking-[-0.015em] text-fg leading-snug mb-2">
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
              {job?.isRemote && (
                <span className="text-fg-muted">{t("common.remote")}</span>
              )}
            </div>
          )}

          {app.recruiterNotes && (
            <p className="text-[13px] text-fg-muted leading-relaxed border-l-2 border-border pl-3 mt-2">
              <span className="font-semibold text-fg">
                {t("candidate.applications.recruiterNote")}{" "}
              </span>
              {app.recruiterNotes}
            </p>
          )}
        </div>

        {app.matchScore != null && (
          <div className="shrink-0 sm:min-w-[260px]">
            <ScoreBreakdown
              keywordScore={Number(app.keywordScore ?? 0)}
              semanticScore={Number(app.semanticScore ?? 0)}
              verifiedBonus={Number(app.verifiedBonus ?? 0)}
              totalScore={Number(app.matchScore ?? 0)}
              variant="full"
            />
          </div>
        )}
      </div>
    </article>
  );
}

function timeAgo(iso: string, t: (key: "common.justNow" | "common.minutesAgo" | "common.hoursAgo" | "common.daysAgo") => string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return t("common.justNow");
  if (sec < 3600) return `${Math.floor(sec / 60)} ${t("common.minutesAgo")}`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} ${t("common.hoursAgo")}`;
  return `${Math.floor(sec / 86400)} ${t("common.daysAgo")}`;
}
