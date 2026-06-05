"use client";

import { Briefcase, MapPin, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSetPageMeta } from "@/components/app-shell/page-meta";
import { JobStatusBadge } from "@/components/recruiter/JobStatusBadge";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { SelectMenu } from "@/components/ui/SelectMenu";
import { SkillTag } from "@/components/ui/SkillTag";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCurrentUser } from "@/lib/use-current-user";
import { fetchJobs } from "@/lib/recruiter-api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { JobItem } from "@/types/candidate";
import type { JobStatus } from "@/types/recruiter-app";

export default function RecruiterJobsPage() {
  const { t } = useLanguage();
  useSetPageMeta(t("recruiter.jobs.title"), t("recruiter.jobs.description"));
  const { user } = useCurrentUser();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<JobStatus | "all">("all");
  const [items, setItems] = useState<JobItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input — fire API after 300ms of inactivity
  function handleSearchChange(value: string) {
    setSearch(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedSearch(value), 300);
  }

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setItems(null);
    fetchJobs({
      search: debouncedSearch.trim() || undefined,
      status,
      recruiterId: user.id,
      limit: 100,
    })
      .then((r) => {
        if (!cancelled) setItems(r.items);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : t("common.loading"));
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, status, user, t]);

  const statusOptions = [
    { value: "all", label: t("status.job.all") },
    { value: "draft", label: t("status.job.draft") },
    { value: "open", label: t("status.job.open") },
    { value: "closed", label: t("status.job.closed") },
    { value: "expired", label: t("status.job.expired") },
  ];

  return (
    <>
      <div className="rounded-card border border-border bg-canvas p-4 sm:p-5 mb-4 flex flex-col sm:flex-row sm:items-center gap-3 shadow-[var(--shadow-card)]">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none"
          />
          <Input
            type="search"
            placeholder={t("recruiter.jobs.searchPlaceholder")}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-11 pl-10"
          />
        </div>
        <SelectMenu
          value={status}
          onChange={(v) => setStatus(v as JobStatus | "all")}
          options={statusOptions}
          ariaLabel={t("common.status")}
          className="sm:w-[180px]"
        />
        <Link href="/recruiter/jobs/new">
          <Button leftIcon={<Plus size={16} />} className="w-full sm:w-auto">
            {t("recruiter.jobs.postJob")}
          </Button>
        </Link>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {!items ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={140} className="rounded-card" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={t("recruiter.jobs.emptyTitle")}
          description={t("recruiter.jobs.emptyDesc")}
          action={
            <Link href="/recruiter/jobs/new">
              <Button leftIcon={<Plus size={16} />}>
                {t("recruiter.jobs.postJob")}
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((job) => (
            <Link
              key={job.id}
              href={`/recruiter/jobs/${job.id}`}
              className="group block rounded-card border border-border bg-canvas p-5 sm:p-6 shadow-[var(--shadow-card)] tl-card-interactive"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <JobStatusBadge status={job.status as JobStatus} />
                    {job.isRemote && (
                      <span className="text-[12px] text-fg-subtle">
                        {t("common.remote")}
                      </span>
                    )}
                  </div>
                  <h3 className="text-[18px] sm:text-[19px] font-bold tracking-[-0.018em] leading-snug text-fg group-hover:text-navy transition-colors mb-2">
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
                      <span>
                        {t("recruiter.jobs.viewsCount").replace(
                          "{n}",
                          String(job.viewCount),
                        )}
                      </span>
                    )}
                    <span className="text-fg-subtle font-mono">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {job.requiredSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {job.requiredSkills.slice(0, 6).map((s) => (
                        <SkillTag key={s} size="sm">
                          {s}
                        </SkillTag>
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
