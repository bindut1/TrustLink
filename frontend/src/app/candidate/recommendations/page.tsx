"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useSetPageMeta } from "@/components/app-shell/page-meta";
import { ApplyModal } from "@/components/candidate/ApplyModal";
import { JobMatchModal } from "@/components/candidate/JobMatchModal";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { MatchScoreBar } from "@/components/ui/MatchScoreBar";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  fetchJob,
  fetchMyApplications,
  fetchMySkills,
  fetchRecommendedJobs,
} from "@/lib/candidate-api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { CandidateSkill, JobItem, RankedJob } from "@/types/candidate";

export default function RecommendationsPage() {
  const { t } = useLanguage();
  useSetPageMeta(t("candidate.recs.title"), t("candidate.recs.description"));

  const [items, setItems] = useState<RankedJob[] | null>(null);
  const [skills, setSkills] = useState<CandidateSkill[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Match modal: the ranked row + its fully-loaded job.
  const [matchJob, setMatchJob] = useState<JobItem | null>(null);
  const [matchRanked, setMatchRanked] = useState<RankedJob | null>(null);
  const [applyTarget, setApplyTarget] = useState<JobItem | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchRecommendedJobs(10)
      .then((r) => !cancelled && setItems(r))
      .catch((e: unknown) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : t("candidate.recs.failedJob"));
      });
    fetchMySkills().then((s) => !cancelled && setSkills(s)).catch(() => {});
    fetchMyApplications()
      .then((apps) => !cancelled && setAppliedJobIds(new Set(apps.map((a) => a.jobId))))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openMatch(ranked: RankedJob) {
    setOpeningId(ranked.jobId);
    try {
      const job = await fetchJob(ranked.jobId);
      setMatchJob(job);
      setMatchRanked(ranked);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("candidate.recs.failedJob"));
    } finally {
      setOpeningId(null);
    }
  }

  function closeMatch() {
    setMatchJob(null);
    setMatchRanked(null);
  }

  return (
    <>
      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {!items ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={104} className="rounded-card" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title={t("candidate.recs.emptyTitle")}
          description={t("candidate.recs.emptyDesc")}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((r, i) => (
            <RankedJobCard
              key={r.jobId}
              rank={i + 1}
              ranked={r}
              applied={appliedJobIds.has(r.jobId)}
              opening={openingId === r.jobId}
              onOpen={() => openMatch(r)}
            />
          ))}
        </div>
      )}

      <JobMatchModal
        job={matchJob}
        ranked={matchRanked}
        skills={skills}
        applied={matchJob ? appliedJobIds.has(matchJob.id) : false}
        onClose={closeMatch}
        onApply={() => {
          if (matchJob) {
            const job = matchJob;
            closeMatch();
            setApplyTarget(job);
          }
        }}
      />

      <ApplyModal
        job={applyTarget}
        onClose={() => setApplyTarget(null)}
        onApplied={() => {
          if (applyTarget) {
            setAppliedJobIds((prev) => new Set(prev).add(applyTarget.id));
          }
        }}
      />
    </>
  );
}

function RankedJobCard({
  rank,
  ranked,
  applied,
  opening,
  onOpen,
}: {
  rank: number;
  ranked: RankedJob;
  applied: boolean;
  opening: boolean;
  onOpen: () => void;
}) {
  const { t } = useLanguage();
  const job = ranked.job;
  const meta = [
    job.city || (job.isRemote ? t("common.remote") : null),
    formatSalary(job.salaryMin, job.salaryMax),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="flex items-center gap-4 rounded-card border border-border bg-canvas p-4 sm:p-5 shadow-[var(--shadow-card)] tl-card-interactive">
      <span
        aria-hidden
        className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full bg-navy/8 text-navy text-[12px] font-mono font-semibold"
      >
        {rank}
      </span>

      <div className="min-w-0 flex-1">
        <h3 className="text-[15.5px] font-semibold text-fg leading-snug truncate">
          {job.title}
        </h3>
        {meta && <p className="text-[12.5px] text-fg-subtle mt-0.5">{meta}</p>}
        <div className="mt-2.5 flex items-center gap-3">
          <MatchScoreBar breakdown={ranked} className="max-w-[220px]" />
          <span className="font-mono text-[15px] font-semibold text-fg tabular-nums">
            {Math.round(Number(ranked.totalScore))}
            <span className="text-[12px] font-normal text-fg-faint"> /100</span>
          </span>
        </div>
      </div>

      <div className="shrink-0 flex flex-col items-stretch gap-2">
        <Button variant="verified" size="sm" onClick={onOpen} loading={opening}>
          {t("common.view")}
        </Button>
        {applied && (
          <span className="text-center text-[11.5px] font-medium text-success">
            {t("candidate.recs.applied")}
          </span>
        )}
      </div>
    </article>
  );
}

function formatSalary(min?: number | null, max?: number | null): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) => `${Math.round(n / 1_000_000)}M`;
  if (min && max) return `${fmt(min)} – ${fmt(max)} VND`;
  return `${fmt((min ?? max)!)}+ VND`;
}
