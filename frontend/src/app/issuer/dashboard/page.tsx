"use client";

import { Award, Building2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSetPageMeta } from "@/components/app-shell/page-meta";
import { ApprovalStatusBadge } from "@/components/issuer/StatusBadge";
import { BarChart } from "@/components/ui/BarChart";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SelectMenu } from "@/components/ui/SelectMenu";
import { Skeleton } from "@/components/ui/Skeleton";
import { StackBar } from "@/components/ui/StackBar";
import { StatusPill, type StatusTone } from "@/components/ui/StatusPill";
import { fetchIssuerDashboard } from "@/lib/issuer-api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";
import type { ApprovalStatus, CredentialStatus, IssuerDashboard } from "@/types/issuer";

const RECENT_TONE: Record<CredentialStatus, StatusTone> = {
  issued: "on-chain",
  reissued: "on-chain",
  pending: "pending",
  revoked: "revoked",
};

const now = () => new Date();

export default function IssuerDashboardPage() {
  const { t } = useLanguage();
  useSetPageMeta(t("issuer.dashboard.title"), t("issuer.dashboard.description"));

  const [data, setData] = useState<IssuerDashboard | null>(null);
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchIssuerDashboard()
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setData(null));
    return () => {
      cancelled = true;
    };
  }, []);

  // Years that actually have issuances, descending.
  const years = useMemo(() => {
    if (!data) return [];
    const set = new Set<number>();
    for (const m of data.issuanceByMonth) set.add(Number(m.month.slice(0, 4)));
    return [...set].sort((a, b) => b - a);
  }, [data]);

  const current = now();
  const effectiveYear = year ?? years[0] ?? current.getFullYear();

  // Past year → full 12 months; current year → only up to the current month.
  const bars = useMemo(() => {
    if (!data) return [];
    const map = new Map(data.issuanceByMonth.map((m) => [m.month, m.count]));
    const monthsToShow =
      effectiveYear === current.getFullYear() ? current.getMonth() + 1 : 12;
    return Array.from({ length: monthsToShow }, (_, i) => {
      const mm = String(i + 1).padStart(2, "0");
      const key = `${effectiveYear}-${mm}`;
      return { label: mm, fullLabel: key, value: map.get(key) ?? 0 };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, effectiveYear]);

  const activeIssued = data
    ? Math.max(0, data.credentials.total - data.credentials.revoked)
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Row 1 — issuance trend (wide) + institution */}
      <Card className="lg:col-span-2">
        <CardHeader
          title={t("issuer.dashboard.issuanceTrend")}
          action={
            data && years.length > 0 ? (
              <SelectMenu
                value={String(effectiveYear)}
                onChange={(v) => setYear(Number(v))}
                options={years.map((y) => ({ value: String(y), label: String(y) }))}
                ariaLabel={t("issuer.dashboard.issuanceTrend")}
                className="w-[110px]"
              />
            ) : undefined
          }
        />
        {!data ? (
          <Skeleton height={130} />
        ) : data.credentials.total === 0 ? (
          <EmptyState compact icon={Award} title={t("issuer.dashboard.noRecent")} />
        ) : (
          <>
            <BarChart data={bars} height={130} />
            <div className="mt-3 text-[12.5px] text-fg-subtle">
              {t("issuer.dashboard.candidatesReached")}:{" "}
              <span className="font-mono font-semibold text-fg">
                {data.candidatesReached}
              </span>
            </div>
          </>
        )}
      </Card>

      <Card>
        <CardHeader title={t("issuer.dashboard.institutionTitle")} />
        {!data ? (
          <Skeleton height={80} />
        ) : (
          <div className="flex flex-col">
            <div className="flex items-start gap-3">
              <span className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-navy/8 text-navy">
                <Building2 size={18} strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold text-fg leading-snug">
                  {data.institution.name}
                </div>
                <div className="mt-1.5">
                  <ApprovalStatusBadge
                    status={data.institution.approvalStatus as ApprovalStatus}
                  />
                </div>
              </div>
            </div>
            {data.institution.blockchainAddress && (
              <div className="mt-4 pt-3 border-t border-border">
                <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-fg-subtle mb-1.5">
                  {t("issuer.profile.onChainAddress")}
                </div>
                <a
                  href={`https://amoy.polygonscan.com/address/${data.institution.blockchainAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-[12.5px] text-teal hover:underline"
                >
                  {`${data.institution.blockchainAddress.slice(0, 12)}…${data.institution.blockchainAddress.slice(-6)}`}
                  <ExternalLink size={12} />
                </a>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Row 2 — recent issuances (wide) + status breakdown */}
      <Card className="lg:col-span-2">
        <CardHeader
          title={t("issuer.dashboard.recent")}
          action={
            <Link
              href="/issuer/credentials"
              className="text-[13px] font-medium text-navy hover:underline"
            >
              {t("issuer.dashboard.viewAll")}
            </Link>
          }
        />
        {!data ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height={36} />
            ))}
          </div>
        ) : data.recent.length === 0 ? (
          <EmptyState compact icon={Award} title={t("issuer.dashboard.noRecent")} />
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {data.recent.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-medium text-fg truncate">
                    {c.title}
                  </div>
                  <div className="text-[12px] text-fg-subtle truncate">
                    {c.candidateName ?? "—"}
                  </div>
                </div>
                <StatusPill tone={RECENT_TONE[c.status]}>
                  {t(`status.cred.${c.status}` as TranslationKey)}
                </StatusPill>
                <span className="font-mono text-[12px] text-fg-subtle whitespace-nowrap w-[88px] text-right">
                  {c.issuedDate ? new Date(c.issuedDate).toLocaleDateString() : "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader title={t("issuer.dashboard.statusBreakdown")} />
        {!data ? (
          <Skeleton height={56} />
        ) : (
          <>
            <StackBar
              segments={[
                {
                  label: t("issuer.dashboard.totalIssued"),
                  value: activeIssued,
                  color: "var(--teal-500)",
                },
                {
                  label: t("issuer.dashboard.revokedCount"),
                  value: data.credentials.revoked,
                  color: "var(--danger)",
                },
              ]}
            />
            <dl className="mt-4 grid grid-cols-2 gap-2 text-center">
              <Metric label={t("issuer.dashboard.totalIssued")} value={data.credentials.total} />
              <Metric
                label={t("issuer.dashboard.revokedCount")}
                value={data.credentials.revoked}
                tone="danger"
              />
            </dl>
          </>
        )}
      </Card>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "danger";
}) {
  const color = tone === "danger" ? "text-danger" : "text-fg";
  return (
    <div className="rounded-ctl bg-surface-2/60 px-2 py-2.5">
      <dd className={`font-mono text-[22px] font-semibold leading-none tabular-nums ${color}`}>
        {value}
      </dd>
      <dt className="mt-1 text-[11px] uppercase tracking-[0.06em] text-fg-subtle">
        {label}
      </dt>
    </div>
  );
}
