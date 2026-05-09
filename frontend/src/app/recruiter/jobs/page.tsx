"use client";

import { Briefcase, MapPin, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { JobStatusBadge } from "@/components/recruiter/JobStatusBadge";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { useCurrentUser } from "@/lib/use-current-user";
import { fetchJobs } from "@/lib/recruiter-api";
import { cn } from "@/lib/cn";
import type { JobItem, PaginatedJobs } from "@/types/candidate";
import type { JobStatus } from "@/types/recruiter-app";

export default function RecruiterJobsPage() {
  const { user } = useCurrentUser();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<JobStatus | "all">("all");
  const [data, setData] = useState<PaginatedJobs | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    fetchJobs({
      search: search.trim() || undefined,
      status,
      limit: 50,
    })
      .then((r) => {
        if (!cancelled) setData(r);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load jobs");
      });
    return () => {
      cancelled = true;
    };
  }, [search, status]);

  // Backend `/jobs` returns ALL recruiters' jobs — filter to mine.
  const myJobs = useMemo<JobItem[] | null>(() => {
    if (!data || !user) return null;
    return data.items.filter((j) => j.recruiterId === user.id);
  }, [data, user]);

  return (
    <>
      <PageHeader
        title="My jobs"
        description="Manage every role your team is hiring for. Click a job to see ranked candidates and applications."
        actions={
          <Link href="/recruiter/jobs/new">
            <Button leftIcon={<Plus size={14} />}>Post a job</Button>
          </Link>
        }
      />

      <div className="rounded-2xl border border-border bg-canvas p-4 sm:p-5 mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <Input
          placeholder="Search by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 flex-1"
        />
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value as JobStatus | "all")}
          className="h-11 sm:w-[180px]"
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="expired">Expired</option>
        </Select>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {!myJobs ? (
        <div className="rounded-2xl border border-border bg-canvas p-10 text-center text-fg-subtle">
          Loading…
        </div>
      ) : myJobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-canvas p-12 text-center">
          <Briefcase size={32} className="mx-auto text-fg-subtle mb-4" />
          <h3 className="text-[16px] font-semibold text-fg mb-1.5">
            No jobs yet
          </h3>
          <p className="text-[13.5px] text-fg-muted max-w-[44ch] mx-auto mb-5">
            Post your first role to start receiving AI-ranked candidates.
          </p>
          <Link href="/recruiter/jobs/new">
            <Button leftIcon={<Plus size={14} />}>Post a job</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {myJobs.map((job) => (
            <Link
              key={job.id}
              href={`/recruiter/jobs/${job.id}`}
              className="group rounded-2xl border border-border bg-canvas p-5 sm:p-6 transition-colors hover:border-border-strong"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <JobStatusBadge status={job.status as JobStatus} />
                    {job.isRemote && (
                      <span className="text-[12px] text-fg-subtle">Remote</span>
                    )}
                  </div>
                  <h3 className="text-[18px] sm:text-[19px] font-bold tracking-[-0.018em] leading-snug text-fg group-hover:text-accent transition-colors mb-2">
                    {job.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-fg-muted">
                    {(job.city || job.location) && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={13} className="text-fg-subtle" />
                        {job.city ?? job.location}
                      </span>
                    )}
                    {job.viewCount != null && (
                      <span>{job.viewCount} views</span>
                    )}
                    <span className="text-fg-subtle font-mono">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {job.requiredSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {job.requiredSkills.slice(0, 6).map((s) => (
                        <span
                          key={s}
                          className={cn(
                            "inline-flex items-center rounded-md border px-2 py-0.5 text-[12px]",
                            "border-border bg-surface-2/60 text-fg-muted",
                          )}
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
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
