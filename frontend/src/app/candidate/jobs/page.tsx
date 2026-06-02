"use client";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { ApplyModal } from "@/components/candidate/ApplyModal";
import { JobCard } from "@/components/candidate/JobCard";
import { JobDetailModal } from "@/components/candidate/JobDetailModal";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { fetchJobs, fetchMyApplications } from "@/lib/candidate-api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";
import type { JobItem, PaginatedJobs } from "@/types/candidate";

const JOB_TYPES: { value: string; labelKey: TranslationKey }[] = [
  { value: "", labelKey: "candidate.jobs.anyType" },
  { value: "full_time", labelKey: "jobType.full_time" },
  { value: "part_time", labelKey: "jobType.part_time" },
  { value: "contract", labelKey: "jobType.contract" },
  { value: "internship", labelKey: "jobType.internship" },
];

const PAGE_SIZE = 10;

export default function CandidateJobsPage() {
  const { t } = useLanguage();
  // Filter state (live as user types/changes)
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [jobType, setJobType] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [isRemote, setIsRemote] = useState<"" | "true" | "false">("");
  const [page, setPage] = useState(1);

  // Server response
  const [data, setData] = useState<PaginatedJobs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [applyTarget, setApplyTarget] = useState<JobItem | null>(null);
  const [detailTarget, setDetailTarget] = useState<JobItem | null>(null);

  // Reset to page 1 when any filter changes
  useEffect(() => {
    setPage(1);
  }, [search, city, jobType, salaryMin, isRemote]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchJobs({
      search: search.trim() || undefined,
      city: city.trim() || undefined,
      jobType: jobType || undefined,
      salaryMin: salaryMin ? Number(salaryMin) : undefined,
      isRemote: isRemote === "" ? undefined : isRemote === "true",
      page,
      limit: PAGE_SIZE,
    })
      .then((r) => {
        if (!cancelled) setData(r);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(
          e instanceof Error ? e.message : t("candidate.jobs.failedJobs"),
        );
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [search, city, jobType, salaryMin, isRemote, page]);

  // Load applied job IDs once so we can disable Apply on already-applied jobs
  useEffect(() => {
    fetchMyApplications()
      .then((apps) => setAppliedJobIds(new Set(apps.map((a) => a.jobId))))
      .catch(() => {
        // Non-fatal
      });
  }, []);

  const totalPages = useMemo(
    () => (data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1),
    [data],
  );

  return (
    <>
      <PageHeader
        title={t("candidate.jobs.title")}
        description={t("candidate.jobs.description")}
      />

      <div className="rounded-2xl border border-border bg-canvas p-4 sm:p-5 mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
        <div className="relative lg:col-span-4">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none"
          />
          <Input
            type="search"
            placeholder={t("candidate.jobs.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
        <Input
          placeholder={t("candidate.jobs.cityPlaceholder")}
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="h-11 lg:col-span-2"
        />
        <Select
          value={jobType}
          onChange={(e) => setJobType(e.target.value)}
          className="h-11 lg:col-span-2"
        >
          {JOB_TYPES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {t(opt.labelKey)}
            </option>
          ))}
        </Select>
        <Input
          type="number"
          min={0}
          placeholder={t("candidate.jobs.minSalaryPlaceholder")}
          value={salaryMin}
          onChange={(e) => setSalaryMin(e.target.value)}
          className="h-11 lg:col-span-2"
        />
        <Select
          value={isRemote}
          onChange={(e) => setIsRemote(e.target.value as "" | "true" | "false")}
          className="h-11 lg:col-span-2"
        >
          <option value="">{t("candidate.jobs.anyLocation")}</option>
          <option value="true">{t("candidate.jobs.remoteOnly")}</option>
          <option value="false">{t("candidate.jobs.onsiteOnly")}</option>
        </Select>
      </div>

      <div className="text-[12.5px] text-fg-subtle mb-3">
        {data
          ? t("candidate.jobs.matchCount").replace(
              "{n}",
              data.total.toLocaleString(),
            )
          : ""}
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="rounded-2xl border border-border bg-canvas p-10 text-center text-fg-subtle">
          {t("candidate.jobs.loading")}
        </div>
      ) : data && data.items.length > 0 ? (
        <div className="flex flex-col gap-3">
          {data.items.map((j) => {
            const alreadyApplied = appliedJobIds.has(j.id);
            return (
              <JobCard
                key={j.id}
                job={j}
                onViewDetail={() => setDetailTarget(j)}
                onApply={
                  alreadyApplied
                    ? undefined
                    : () => setApplyTarget(j)
                }
                meta={
                  alreadyApplied ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-[12px] font-medium text-success">
                      {t("jobCard.applied")}
                    </span>
                  ) : null
                }
              />
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-canvas p-12 text-center text-fg-subtle">
          {t("candidate.jobs.empty")}
        </div>
      )}

      {data && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <span className="text-[13px] text-fg-subtle">
            {t("candidate.jobs.pageOf")
              .replace("{current}", String(data.page))
              .replace("{total}", String(totalPages))}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={data.page <= 1}
              leftIcon={<ChevronLeft size={14} />}
            >
              {t("candidate.jobs.previous")}
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={data.page >= totalPages}
              rightIcon={<ChevronRight size={14} />}
            >
              {t("candidate.jobs.next")}
            </Button>
          </div>
        </div>
      )}

      <JobDetailModal
        job={detailTarget}
        applied={detailTarget ? appliedJobIds.has(detailTarget.id) : false}
        onClose={() => setDetailTarget(null)}
        onApply={
          detailTarget && !appliedJobIds.has(detailTarget.id)
            ? () => {
                setDetailTarget(null);
                setApplyTarget(detailTarget);
              }
            : undefined
        }
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
