"use client";

import { Briefcase, MapPin, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { JobStatusBadge } from "@/components/recruiter/JobStatusBadge";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { useCurrentUser } from "@/lib/use-current-user";
import { fetchJobs } from "@/lib/recruiter-api";
import { cn } from "@/lib/cn";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { JobItem } from "@/types/candidate";
import type { JobStatus } from "@/types/recruiter-app";

export default function RecruiterJobsPage() {
  const { t } = useLanguage();
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

  return (
    <>
      <PageHeader
        title={t("recruiter.jobs.title")}
        description={t("recruiter.jobs.description")}
        actions={
          <Link href="/recruiter/jobs/new">
            <Button leftIcon={<Plus size={14} />}>
              {t("recruiter.jobs.postJob")}
            </Button>
          </Link>
        }
      />

      <div className="rounded-2xl border border-border bg-canvas p-4 sm:p-5 mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
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
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value as JobStatus | "all")}
          className="h-11 sm:w-[180px]"
        >
          <option value="all">{t("status.job.all")}</option>
          <option value="draft">{t("status.job.draft")}</option>
          <option value="open">{t("status.job.open")}</option>
          <option value="closed">{t("status.job.closed")}</option>
          <option value="expired">{t("status.job.expired")}</option>
        </Select>
      </div>

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
          <Briefcase size={32} className="mx-auto text-fg-subtle mb-4" />
          <h3 className="text-[16px] font-semibold text-fg mb-1.5">
            {t("recruiter.jobs.emptyTitle")}
          </h3>
          <p className="text-[13.5px] text-fg-muted max-w-[44ch] mx-auto mb-5">
            {t("recruiter.jobs.emptyDesc")}
          </p>
          <Link href="/recruiter/jobs/new">
            <Button leftIcon={<Plus size={14} />}>
              {t("recruiter.jobs.postJob")}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((job) => (
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
                      <span className="text-[12px] text-fg-subtle">
                        {t("common.remote")}
                      </span>
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
