"use client";

import { Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSetPageMeta } from "@/components/app-shell/page-meta";
import { ApplicationStatusBadge } from "@/components/candidate/ApplicationStatusBadge";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { BarChart } from "@/components/ui/BarChart";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SelectMenu } from "@/components/ui/SelectMenu";
import { Skeleton } from "@/components/ui/Skeleton";
import { StackBar } from "@/components/ui/StackBar";
import { StatusPill } from "@/components/ui/StatusPill";
import { fetchRecruiterDashboard } from "@/lib/recruiter-api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";
import type { ApplicationStatus } from "@/types/candidate";
import type { RecruiterDashboard } from "@/types/recruiter-app";

// Funnel order + colors (teal reserved for verified/on-chain, not used here).
const APP_ORDER = [
  "applied",
  "reviewing",
  "shortlisted",
  "interview",
  "offered",
  "rejected",
  "withdrawn",
];
const APP_COLOR: Record<string, string> = {
  applied: "#94A3B8",
  reviewing: "#3B82F6",
  shortlisted: "#7C5CFF",
  interview: "#F59E0B",
  offered: "var(--accent-2)",
  rejected: "var(--danger)",
  withdrawn: "#CBD5E1",
};

export default function RecruiterDashboardPage() {
  const { t } = useLanguage();
  useSetPageMeta(t("recruiter.dashboard.title"), t("recruiter.dashboard.description"));

  const [data, setData] = useState<RecruiterDashboard | null>(null);
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchRecruiterDashboard()
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setData(null));
    return () => {
      cancelled = true;
    };
  }, []);

  const years = useMemo(() => {
    if (!data) return [];
    const set = new Set<number>();
    for (const m of data.applicationsByMonth) set.add(Number(m.month.slice(0, 4)));
    return [...set].sort((a, b) => b - a);
  }, [data]);

  const cur = new Date();
  const effectiveYear = year ?? years[0] ?? cur.getFullYear();

  const bars = useMemo(() => {
    if (!data) return [];
    const map = new Map(data.applicationsByMonth.map((m) => [m.month, m.count]));
    const monthsToShow =
      effectiveYear === cur.getFullYear() ? cur.getMonth() + 1 : 12;
    return Array.from({ length: monthsToShow }, (_, i) => {
      const mm = String(i + 1).padStart(2, "0");
      const key = `${effectiveYear}-${mm}`;
      return { label: mm, fullLabel: key, value: map.get(key) ?? 0 };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, effectiveYear]);

  const funnelSegments = data
    ? [...data.applicants.byStatus]
        .sort((a, b) => APP_ORDER.indexOf(a.status) - APP_ORDER.indexOf(b.status))
        .map((s) => ({
          label: t(`status.app.${s.status}` as TranslationKey),
          value: s.count,
          color: APP_COLOR[s.status] ?? "#94A3B8",
        }))
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Row 1 — applications trend (wide) + KPIs/company */}
      <Card className="lg:col-span-2">
        <CardHeader
          title={t("recruiter.dashboard.applicationsTrend")}
          action={
            data && years.length > 0 ? (
              <SelectMenu
                value={String(effectiveYear)}
                onChange={(v) => setYear(Number(v))}
                options={years.map((y) => ({ value: String(y), label: String(y) }))}
                ariaLabel={t("recruiter.dashboard.applicationsTrend")}
                className="w-[110px]"
              />
            ) : undefined
          }
        />
        {!data ? (
          <Skeleton height={130} />
        ) : data.applicants.total === 0 ? (
          <EmptyState compact icon={Users} title={t("recruiter.dashboard.noApplicants")} />
        ) : (
          <BarChart data={bars} height={130} />
        )}
      </Card>

      <Card>
        <CardHeader title={t("recruiter.dashboard.companyTitle")} />
        {!data ? (
          <Skeleton height={90} />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[15px] font-semibold text-fg truncate">
                {data.profile.companyName || "—"}
              </span>
              {data.profile.isVerified ? (
                <StatusPill tone="verified">
                  {t("recruiter.profile.verified")}
                </StatusPill>
              ) : (
                <Badge variant="neutral">{t("recruiter.profile.notVerified")}</Badge>
              )}
            </div>
            <dl className="grid grid-cols-3 gap-2 text-center">
              <Metric label={t("recruiter.dashboard.openJobs")} value={data.jobs.open} />
              <Metric label={t("recruiter.dashboard.totalJobs")} value={data.jobs.total} />
              <Metric
                label={t("recruiter.dashboard.totalApplicants")}
                value={data.applicants.total}
              />
            </dl>
          </div>
        )}
      </Card>

      {/* Row 2 — recent applicants (wide) + funnel */}
      <Card className="lg:col-span-2">
        <CardHeader
          title={t("recruiter.dashboard.recent")}
          action={
            <Link
              href="/recruiter/jobs"
              className="text-[13px] font-medium text-navy hover:underline"
            >
              {t("recruiter.dashboard.viewAll")}
            </Link>
          }
        />
        {!data ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height={44} />
            ))}
          </div>
        ) : data.recent.length === 0 ? (
          <EmptyState compact icon={Users} title={t("recruiter.dashboard.noApplicants")} />
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {data.recent.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <Avatar
                  name={a.candidateName ?? "—"}
                  src={a.candidateAvatarUrl}
                  size={34}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-medium text-fg truncate">
                    {a.candidateName ?? "—"}
                  </div>
                  <div className="text-[12px] text-fg-subtle truncate">
                    {a.jobTitle ?? "—"}
                  </div>
                </div>
                {a.matchScore != null && (
                  <span className="font-mono text-[13px] font-semibold text-fg tabular-nums">
                    {Math.round(a.matchScore)}
                    <span className="text-[10px] font-normal text-fg-faint"> /100</span>
                  </span>
                )}
                <ApplicationStatusBadge status={a.status as ApplicationStatus} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader title={t("recruiter.dashboard.funnel")} />
        {!data ? (
          <Skeleton height={56} />
        ) : data.applicants.total === 0 ? (
          <p className="text-[13.5px] text-fg-subtle py-2">
            {t("recruiter.dashboard.noApplicants")}
          </p>
        ) : (
          <StackBar segments={funnelSegments} />
        )}
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-ctl bg-surface-2/60 px-2 py-2.5">
      <dd className="font-mono text-[20px] font-semibold leading-none tabular-nums text-fg">
        {value}
      </dd>
      <dt className="mt-1 text-[10.5px] uppercase tracking-[0.05em] text-fg-subtle leading-tight">
        {label}
      </dt>
    </div>
  );
}
