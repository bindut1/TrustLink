"use client";

import { Award, ClipboardList, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSetPageMeta } from "@/components/app-shell/page-meta";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { Donut } from "@/components/ui/Donut";
import { EmptyState } from "@/components/ui/EmptyState";
import { MatchScoreBar } from "@/components/ui/MatchScoreBar";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Skeleton } from "@/components/ui/Skeleton";
import { StackBar } from "@/components/ui/StackBar";
import {
  fetchCandidateDashboard,
  fetchRecommendedJobs,
} from "@/lib/candidate-api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";
import type { CandidateDashboard, RankedJob } from "@/types/candidate";

// Pipeline order + colors (teal intentionally reserved for verified/on-chain).
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
// Distinct categorical palette for the credentials donut.
const CAT_PALETTE = ["#0B1B3A", "#7C5CFF", "#3B82F6", "#F59E0B", "#10B981", "#94A3B8"];

export default function CandidateDashboardPage() {
  const { t } = useLanguage();
  useSetPageMeta(
    t("candidate.dashboard.title"),
    t("candidate.dashboard.description"),
  );

  const [data, setData] = useState<CandidateDashboard | null>(null);
  const [recs, setRecs] = useState<RankedJob[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchCandidateDashboard()
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setData(null));
    fetchRecommendedJobs(3)
      .then((r) => !cancelled && setRecs(r))
      .catch(() => !cancelled && setRecs([]));
    return () => {
      cancelled = true;
    };
  }, []);

  const pipelineSegments = data
    ? [...data.applications.byStatus]
        .sort((a, b) => APP_ORDER.indexOf(a.status) - APP_ORDER.indexOf(b.status))
        .map((s) => ({
          label: t(`status.app.${s.status}` as TranslationKey),
          value: s.count,
          color: APP_COLOR[s.status] ?? "#94A3B8",
        }))
    : [];

  const categorySegments = data
    ? data.credentials.byCategory.map((c, i) => ({
        label: t(`credCategory.${c.category}` as TranslationKey),
        value: c.count,
        color: CAT_PALETTE[i % CAT_PALETTE.length],
      }))
    : [];

  return (
    // Flat grid so cards in the same row share height and align (top + bottom),
    // instead of two independent columns drifting out of alignment.
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Row 1 — application pipeline (wide) + profile completeness */}
      <Card className="lg:col-span-2">
        <CardHeader
          title={t("candidate.dashboard.pipeline")}
          action={
            data && (
              <span className="text-[12.5px] text-fg-subtle">
                {t("candidate.dashboard.applicationsTotal").replace(
                  "{n}",
                  String(data.applications.total),
                )}
              </span>
            )
          }
        />
        {!data ? (
          <Skeleton height={56} />
        ) : data.applications.total === 0 ? (
          <p className="text-[13.5px] text-fg-subtle py-2">
            {t("candidate.dashboard.noApplications")}
          </p>
        ) : (
          <StackBar segments={pipelineSegments} />
        )}
      </Card>

      <Card>
        <CardHeader title={t("candidate.dashboard.profileTitle")} />
        {!data ? (
          <Skeleton width={64} height={64} circle />
        ) : (
          <div className="flex items-center gap-4">
            <ProgressRing value={data.profile.completeness} />
            <div className="min-w-0">
              {data.profile.isOpenToWork ? (
                <Badge variant="success">
                  {t("candidate.profile.openToWork")}
                </Badge>
              ) : (
                <Badge variant="neutral">
                  {t("candidate.profile.closedToOffers")}
                </Badge>
              )}
              <Link
                href="/candidate/profile"
                className="mt-2 block text-[13px] font-medium text-navy hover:underline"
              >
                {t("candidate.dashboard.completeProfile")}
              </Link>
            </div>
          </div>
        )}
      </Card>

      {/* Row 2 — top matches (wide) + credentials */}
      <Card className="lg:col-span-2">
        <CardHeader
          title={t("candidate.dashboard.topMatches")}
          action={
            <Link
              href="/candidate/recommendations"
              className="text-[13px] font-medium text-navy hover:underline"
            >
              {t("candidate.dashboard.viewAll")}
            </Link>
          }
        />
        {!recs ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} height={48} />
            ))}
          </div>
        ) : recs.length === 0 ? (
          <EmptyState
            compact
            icon={Sparkles}
            title={t("candidate.dashboard.noMatches")}
          />
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {recs.map((r) => (
              <li key={r.jobId} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-fg truncate">
                    {r.job.title}
                  </div>
                  <div className="mt-1.5 max-w-[260px]">
                    <MatchScoreBar breakdown={r} />
                  </div>
                </div>
                <span className="font-mono text-[15px] font-semibold text-fg tabular-nums shrink-0">
                  {Math.round(Number(r.totalScore))}
                  <span className="text-[11px] font-normal text-fg-faint"> /100</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader
          title={t("candidate.dashboard.credentialsTitle")}
          action={
            <Link
              href="/candidate/credentials"
              className="text-[13px] font-medium text-navy hover:underline"
            >
              {t("candidate.dashboard.viewAll")}
            </Link>
          }
        />
        {!data ? (
          <Skeleton height={120} />
        ) : data.credentials.total === 0 ? (
          <EmptyState
            compact
            icon={Award}
            title={t("candidate.dashboard.noCredentials")}
          />
        ) : (
          <>
            {categorySegments.length > 0 ? (
              <Donut
                size={120}
                data={categorySegments}
                centerLabel={t("candidate.dashboard.credentialsTitle")}
              />
            ) : (
              <div className="font-mono text-[28px] font-semibold text-fg tabular-nums">
                {data.credentials.total}
              </div>
            )}
            <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-teal font-medium">
              <Award size={13} />
              {t("candidate.dashboard.onChainCount").replace(
                "{n}",
                String(data.credentials.onChain),
              )}
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
