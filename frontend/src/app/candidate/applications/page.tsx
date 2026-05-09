"use client";

import { ClipboardList, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { ApplicationStatusBadge } from "@/components/candidate/ApplicationStatusBadge";
import { ScoreBreakdown } from "@/components/candidate/ScoreBreakdown";
import { Alert } from "@/components/ui/Alert";
import { fetchMyApplications } from "@/lib/candidate-api";
import type { ApplicationItem } from "@/types/candidate";

export default function CandidateApplicationsPage() {
  const [items, setItems] = useState<ApplicationItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchMyApplications()
      .then((r) => {
        if (!cancelled) setItems(r);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <PageHeader
        title="My applications"
        description="Every job you've applied to. Recruiters see the match score that was snapshotted at the time you applied."
      />

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {!items ? (
        <div className="rounded-2xl border border-border bg-canvas p-10 text-center text-fg-subtle">
          Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-canvas p-12 text-center">
          <ClipboardList
            size={32}
            className="mx-auto text-fg-subtle mb-4"
          />
          <h3 className="text-[16px] font-semibold text-fg mb-1.5">
            No applications yet
          </h3>
          <p className="text-[13.5px] text-fg-muted max-w-[44ch] mx-auto">
            Browse <a href="/candidate/jobs" className="text-accent hover:underline">jobs</a>{" "}
            or{" "}
            <a href="/candidate/recommendations" className="text-accent hover:underline">
              AI recommendations
            </a>{" "}
            to send your first application.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((app) => (
            <ApplicationCard key={app.id} app={app} />
          ))}
        </div>
      )}
    </>
  );
}

function ApplicationCard({ app }: { app: ApplicationItem }) {
  const job = app.job;
  return (
    <article className="rounded-2xl border border-border bg-canvas p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <ApplicationStatusBadge status={app.status} />
            <span className="text-[12px] text-fg-subtle font-mono">
              applied {timeAgo(app.createdAt)}
            </span>
          </div>

          <h3 className="text-[18px] font-semibold tracking-[-0.015em] text-fg leading-snug mb-2">
            {job?.title ?? "Untitled job"}
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
                <span className="text-fg-muted">Remote</span>
              )}
            </div>
          )}

          {app.recruiterNotes && (
            <p className="text-[13px] text-fg-muted leading-relaxed border-l-2 border-border pl-3 mt-2">
              <span className="font-semibold text-fg">Recruiter note: </span>
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

function timeAgo(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}
