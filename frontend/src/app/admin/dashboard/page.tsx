"use client";

import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Link2,
  LogIn,
  ShieldOff,
  UserCog,
  XCircle,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useSetPageMeta } from "@/components/app-shell/page-meta";
import { Card, CardHeader } from "@/components/ui/Card";
import { Donut } from "@/components/ui/Donut";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { StackBar } from "@/components/ui/StackBar";
import { fetchAuditLogs, fetchDashboardStats } from "@/lib/admin-api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";
import type { AdminDashboardStats, AuditLog } from "@/types/admin";

type ActivityTone = "success" | "warn" | "danger" | "info" | "neutral";

type ActionMeta = {
  icon: ReactNode;
  tone: ActivityTone;
  labelKey: TranslationKey;
};

const ACTION_META: Record<string, ActionMeta> = {
  "auth.login": {
    icon: <LogIn size={14} />,
    tone: "neutral",
    labelKey: "admin.dashboard.actLoggedIn",
  },
  "credential.issue": {
    icon: <Award size={14} />,
    tone: "success",
    labelKey: "admin.dashboard.actIssuedCredential",
  },
  "credential.revoke": {
    icon: <XCircle size={14} />,
    tone: "warn",
    labelKey: "admin.dashboard.actRevokedCredential",
  },
  "institution.approved": {
    icon: <CheckCircle2 size={14} />,
    tone: "success",
    labelKey: "admin.dashboard.actApprovedInstitution",
  },
  "institution.rejected": {
    icon: <AlertTriangle size={14} />,
    tone: "danger",
    labelKey: "admin.dashboard.actRejectedInstitution",
  },
  "user.status_change": {
    icon: <ShieldOff size={14} />,
    tone: "warn",
    labelKey: "admin.dashboard.actSuspendedUser",
  },
  "user.override_set": {
    icon: <UserCog size={14} />,
    tone: "info",
    labelKey: "admin.dashboard.actSetOverride",
  },
  "user.override_removed": {
    icon: <UserCog size={14} />,
    tone: "neutral",
    labelKey: "admin.dashboard.actRemovedOverride",
  },
};

const FALLBACK_META = {
  icon: <Link2 size={14} />,
  tone: "neutral" as ActivityTone,
};

function useRelativeTime() {
  const { t } = useLanguage();
  return (iso: string): string => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const sec = Math.floor(diffMs / 1000);
    if (sec < 60) return t("common.justNow");
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} ${t("common.minutesAgo")}`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} ${t("common.hoursAgo")}`;
    const day = Math.floor(hr / 24);
    if (day < 30) return `${day} ${t("common.daysAgo")}`;
    return new Date(iso).toLocaleDateString();
  };
}

export default function AdminDashboardPage() {
  const { t } = useLanguage();
  const relativeTime = useRelativeTime();
  useSetPageMeta(t("admin.dashboard.title"), t("admin.dashboard.description"));

  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [activity, setActivity] = useState<AuditLog[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    setError(false);
    Promise.all([fetchDashboardStats(), fetchAuditLogs({ limit: 6 })])
      .then(([s, a]) => {
        if (!alive) return;
        setStats(s);
        setActivity(a);
      })
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, []);

  const institutionsRejected = stats
    ? Math.max(
        0,
        stats.institutions.total -
          stats.institutions.approved -
          stats.institutions.pending,
      )
    : 0;

  return (
    <>
      {/* System overview — real aggregates only (no fabricated time-series):
          user role split + on-chain credential / transaction / institution
          health. Teal = on-chain "good" state; emerald = approved. */}
      <Card className="mb-4">
        <CardHeader
          title={t("admin.dashboard.overview")}
          description={t("admin.dashboard.overviewDesc")}
        />
        {!stats ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton height={148} className="rounded-card" />
            <div className="flex flex-col justify-center gap-6">
              <Skeleton height={56} />
              <Skeleton height={56} />
              <Skeleton height={56} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <div className="flex flex-col justify-center">
              <div className="mb-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-fg-subtle">
                {t("admin.dashboard.usersByRole")}
              </div>
              <Donut
                size={148}
                centerLabel={t("nav.users")}
                data={[
                  // Categorical palette — distinct hues, teal intentionally
                  // avoided (reserved for on-chain/verified).
                  { label: t("role.candidate"), value: stats.users.byRole.candidate, color: "#0B1B3A" },
                  { label: t("role.recruiter"), value: stats.users.byRole.recruiter, color: "#7C5CFF" },
                  { label: t("role.issuer"), value: stats.users.byRole.issuer, color: "#3B82F6" },
                  { label: t("role.admin"), value: stats.users.byRole.admin, color: "#F59E0B" },
                ]}
              />
            </div>
            <div className="flex flex-col justify-center gap-6">
              <StackBar
                title={t("admin.dashboard.credentialHealth")}
                segments={[
                  { label: t("admin.dashboard.issued"), value: stats.credentials.issued, color: "var(--teal-500)" },
                  { label: t("admin.dashboard.revoked"), value: stats.credentials.revoked, color: "var(--danger)" },
                ]}
              />
              <StackBar
                title={t("admin.dashboard.txHealth")}
                segments={[
                  { label: t("admin.dashboard.confirmed"), value: stats.transactions.confirmed, color: "var(--teal-500)" },
                  { label: t("admin.dashboard.queued"), value: stats.transactions.queued, color: "var(--warn)" },
                  { label: t("admin.dashboard.failed"), value: stats.transactions.failed, color: "var(--danger)" },
                ]}
              />
              <StackBar
                title={t("admin.dashboard.institutionHealth")}
                segments={[
                  { label: t("admin.dashboard.approved"), value: stats.institutions.approved, color: "var(--accent-2)" },
                  { label: t("admin.dashboard.pendingShort"), value: stats.institutions.pending, color: "var(--warn)" },
                  { label: t("admin.dashboard.rejected"), value: institutionsRejected, color: "var(--danger)" },
                ]}
              />
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader
            title={t("admin.dashboard.recentActivity")}
            description={t("admin.dashboard.recentActivityDesc")}
          />
          {error ? (
            <EmptyState
              compact
              icon={AlertTriangle}
              title={t("common.errorTitle")}
              description={t("common.errorRetry")}
            />
          ) : activity === null ? (
            <ActivitySkeleton />
          ) : activity.length === 0 ? (
            <EmptyState
              compact
              icon={Link2}
              title={t("admin.dashboard.noActivity")}
            />
          ) : (
            <ul className="flex flex-col gap-3.5">
              {activity.map((log) => {
                const meta = ACTION_META[log.action];
                const actor =
                  log.user?.fullName ?? t("admin.dashboard.systemActor");
                const label = meta ? t(meta.labelKey) : log.action;
                return (
                  <ActivityRow
                    key={log.id}
                    icon={meta?.icon ?? FALLBACK_META.icon}
                    tone={meta?.tone ?? FALLBACK_META.tone}
                    text={`${actor} ${label}`}
                    time={relativeTime(log.createdAt)}
                  />
                );
              })}
            </ul>
          )}
          <div className="mt-5 pt-4 border-t border-border">
            <a
              href="/admin/audit-logs"
              className="text-[13px] font-medium text-navy hover:underline"
            >
              {t("admin.dashboard.viewAllAuditLogs")}
            </a>
          </div>
        </Card>

        <Card>
          <CardHeader
            title={t("admin.dashboard.quickLinks")}
            description={t("admin.dashboard.quickLinksDesc")}
          />
          <div className="flex flex-col gap-2">
            <QuickLink
              href="/admin/institutions?status=pending"
              label={t("admin.dashboard.approveInstitutions")}
              count={stats?.institutions.pending}
              tone="warn"
            />
            <QuickLink
              href="/admin/blockchain?status=failed"
              label={t("admin.dashboard.reviewFailedTx")}
              count={stats?.transactions.failed}
              tone="danger"
            />
            {/* No suspended-user count in AdminDashboardStats — link only,
                no fabricated badge. */}
            <QuickLink
              href="/admin/users?status=suspended"
              label={t("admin.dashboard.suspendedUsers")}
            />
          </div>
        </Card>
      </div>
    </>
  );
}

const TONE_CLASS: Record<ActivityTone, string> = {
  success: "bg-success/12 text-success",
  warn: "bg-warn/15 text-warn",
  danger: "bg-danger/12 text-danger",
  info: "bg-navy/8 text-navy",
  neutral: "bg-surface-2 text-fg-muted",
};

function ActivityRow({
  icon,
  tone,
  text,
  time,
}: {
  icon: ReactNode;
  tone: ActivityTone;
  text: string;
  time: string;
}) {
  return (
    <li className="flex items-center gap-3">
      <span
        className={`shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full ${TONE_CLASS[tone]}`}
      >
        {icon}
      </span>
      <span className="flex-1 text-[14px] text-fg">{text}</span>
      <span className="text-[12px] text-fg-subtle font-mono whitespace-nowrap">
        {time}
      </span>
    </li>
  );
}

const QUICK_TONE = {
  warn: "bg-warn/15 text-warn",
  danger: "bg-danger/12 text-danger",
  neutral: "bg-surface-2 text-fg-muted",
} as const;

function QuickLink({
  href,
  label,
  count,
  tone = "neutral",
}: {
  href: string;
  label: string;
  count?: number;
  tone?: keyof typeof QUICK_TONE;
}) {
  // Urgent counts (>0) keep their semantic tone; zero reads as resolved.
  const badgeTone = count && count > 0 ? tone : "neutral";
  return (
    <a
      href={href}
      className="group flex items-center justify-between gap-3 rounded-ctl border border-border bg-surface-2/50 px-3.5 py-2.5 hover:border-border-strong hover:bg-surface-2 transition-colors duration-150"
    >
      <span className="text-[14px] font-medium text-fg">{label}</span>
      {typeof count === "number" && (
        <span
          className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full text-[12px] font-semibold px-2 tabular-nums ${QUICK_TONE[badgeTone]}`}
        >
          {count}
        </span>
      )}
    </a>
  );
}

function ActivitySkeleton() {
  return (
    <ul className="flex flex-col gap-3.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3">
          <Skeleton width={28} height={28} circle />
          <Skeleton height={13} className="flex-1" />
          <Skeleton height={11} className="w-12" />
        </li>
      ))}
    </ul>
  );
}
