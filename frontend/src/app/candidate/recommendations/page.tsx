"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { ApplyModal } from "@/components/candidate/ApplyModal";
import { JobCard } from "@/components/candidate/JobCard";
import { ScoreBreakdown } from "@/components/candidate/ScoreBreakdown";
import { Alert } from "@/components/ui/Alert";
import {
  fetchJob,
  fetchMyApplications,
  fetchRecommendedJobs,
} from "@/lib/candidate-api";
import type { JobItem, RankedJob } from "@/types/candidate";

export default function RecommendationsPage() {
  const [items, setItems] = useState<RankedJob[] | null>(null);
  const [applyTarget, setApplyTarget] = useState<JobItem | null>(null);
  const [loadingApply, setLoadingApply] = useState(false);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchRecommendedJobs(20)
      .then((r) => {
        if (!cancelled) setItems(r);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load");
      });
    fetchMyApplications()
      .then((apps) => {
        if (!cancelled) setAppliedJobIds(new Set(apps.map((a) => a.jobId)));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function openApply(jobId: string) {
    setLoadingApply(true);
    try {
      const job = await fetchJob(jobId);
      setApplyTarget(job);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load job");
    } finally {
      setLoadingApply(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Recommended for you"
        description="Top open jobs ranked by our 3-tier AI matcher: keyword overlap (40%), semantic similarity (50%), and verified-skill bonus (10%)."
      />

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {!items ? (
        <div className="rounded-2xl border border-border bg-canvas p-10 text-center text-fg-subtle">
          Loading recommendations…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-canvas p-12 text-center">
          <Sparkles size={32} className="mx-auto text-fg-subtle mb-4" />
          <h3 className="text-[16px] font-semibold text-fg mb-1.5">
            No recommendations yet
          </h3>
          <p className="text-[13.5px] text-fg-muted max-w-[44ch] mx-auto">
            Once your profile and credentials are populated, we&apos;ll suggest
            jobs that fit your real, verified skills.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((r, i) => (
            <RankedJobCard
              key={r.jobId}
              rank={i + 1}
              ranked={r}
              alreadyApplied={appliedJobIds.has(r.jobId)}
              onApply={loadingApply ? () => undefined : () => openApply(r.jobId)}
            />
          ))}
        </div>
      )}

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
  alreadyApplied,
  onApply,
}: {
  rank: number;
  ranked: RankedJob;
  alreadyApplied: boolean;
  onApply: () => void;
}) {
  // Build a synthetic JobItem for the JobCard component (server returns a
  // pruned shape on `ranked.job`).
  const job: JobItem = {
    id: ranked.job.id,
    recruiterId: "",
    title: ranked.job.title,
    description: "",
    requirements: null,
    benefits: null,
    jobType: undefined,
    experienceLevel: null,
    industry: null,
    location: null,
    city: ranked.job.city ?? null,
    isRemote: ranked.job.isRemote,
    salaryMin: ranked.job.salaryMin ?? null,
    salaryMax: ranked.job.salaryMax ?? null,
    salaryVisible: true,
    requiredSkills: [],
    preferredSkills: [],
    status: "open",
    applicationDeadline: null,
    viewCount: 0,
    createdAt: "",
  };

  return (
    <div className="relative">
      <span
        aria-hidden
        className="absolute -left-1 top-5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-accent text-[12px] font-mono font-semibold border border-accent/30"
      >
        #{rank}
      </span>
      <div className="pl-9">
        <JobCard
          job={job}
          onApply={alreadyApplied ? undefined : onApply}
          meta={
            <div className="flex flex-col items-stretch gap-2.5 min-w-[260px]">
              <ScoreBreakdown
                keywordScore={ranked.keywordScore}
                semanticScore={ranked.semanticScore}
                verifiedBonus={ranked.verifiedBonus}
                totalScore={ranked.totalScore}
                variant="full"
              />
              {alreadyApplied && (
                <span className="inline-flex items-center justify-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-[12px] font-medium text-success">
                  Applied
                </span>
              )}
            </div>
          }
        />
      </div>
    </div>
  );
}
