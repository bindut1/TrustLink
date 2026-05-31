"use client";

import {
  AlertTriangle,
  Award,
  Building2,
  CheckCircle2,
  Link2,
  LogIn,
  ShieldOff,
  UserCog,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { StatsCard } from "@/components/admin/StatsCard";
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
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [activity, setActivity] = useState<AuditLog[] | null>(null);

  useEffect(() => {
    fetchDashboardStats().then(setStats);
    fetchAuditLogs({ limit: 6 }).then(setActivity);
  }, []);

  return (
    <>
      <PageHeader
        title={t("admin.dashboard.title")}
        description={t("admin.dashboard.description")}
      />

      {!stats ? (
        <div className="rounded-2xl border border-border bg-canvas p-10 text-center text-fg-subtle">
          {t("common.loading")}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard
              label={t("admin.dashboard.totalUsers")}
              value={stats.users.total.toLocaleString()}
              hint={`${stats.users.byRole.candidate} ${t("admin.dashboard.candidates")} · ${stats.users.byRole.recruiter} ${t("admin.dashboard.recruiters")} · ${stats.users.byRole.issuer} ${t("admin.dashboard.issuers")}`}
              icon={Users}
              tone="accent"
            />
            <StatsCard
              label={t("admin.dashboard.credentials")}
              value={stats.credentials.total.toLocaleString()}
              hint={`${stats.credentials.issued.toLocaleString()} ${t("admin.dashboard.issued")} · ${stats.credentials.revoked.toLocaleString()} ${t("admin.dashboard.revoked")}`}
              icon={Award}
              tone="success"
            />
            <StatsCard
              label={t("admin.dashboard.pendingInstitutions")}
              value={stats.institutions.pending}
              hint={`${stats.institutions.approved} ${t("admin.dashboard.approved")} · ${stats.institutions.total} ${t("admin.dashboard.total")}`}
              icon={Building2}
              tone="warn"
            />
            <StatsCard
              label={t("admin.dashboard.failedTransactions")}
              value={stats.transactions.failed}
              hint={`${stats.transactions.queued} ${t("admin.dashboard.queued")} · ${stats.transactions.confirmed.toLocaleString()} ${t("admin.dashboard.confirmed")}`}
              icon={AlertTriangle}
              tone={stats.transactions.failed > 0 ? "danger" : "neutral"}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-2xl border border-border bg-canvas p-6">
              <h2 className="text-[16px] font-semibold tracking-[-0.015em] text-fg mb-1">
                {t("admin.dashboard.recentActivity")}
              </h2>
              <p className="text-[13.5px] text-fg-subtle leading-relaxed">
                {t("admin.dashboard.recentActivityDesc")}
              </p>
              {activity === null ? (
                <p className="mt-5 text-[13.5px] text-fg-subtle">
                  {t("common.loading")}
                </p>
              ) : activity.length === 0 ? (
                <p className="mt-5 text-[13.5px] text-fg-subtle">
                  {t("admin.dashboard.noActivity")}
                </p>
              ) : (
                <ul className="mt-5 flex flex-col gap-3.5">
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
                  className="text-[13px] text-accent hover:underline"
                >
                  {t("admin.dashboard.viewAllAuditLogs")}
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-canvas p-6">
              <h2 className="text-[16px] font-semibold tracking-[-0.015em] text-fg mb-1">
                {t("admin.dashboard.quickLinks")}
              </h2>
              <p className="text-[13.5px] text-fg-subtle">
                {t("admin.dashboard.quickLinksDesc")}
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <QuickLink
                  href="/admin/institutions?status=pending"
                  label={t("admin.dashboard.approveInstitutions")}
                  count={stats.institutions.pending}
                />
                <QuickLink
                  href="/admin/blockchain?status=failed"
                  label={t("admin.dashboard.reviewFailedTx")}
                  count={stats.transactions.failed}
                />
                <QuickLink
                  href="/admin/users?status=suspended"
                  label={t("admin.dashboard.suspendedUsers")}
                  count={1}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

const TONE_CLASS: Record<ActivityTone, string> = {
  success: "bg-success/12 text-success",
  warn: "bg-warn/15 text-warn",
  danger: "bg-danger/12 text-danger",
  info: "bg-accent/12 text-accent",
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

function QuickLink({
  href,
  label,
  count,
}: {
  href: string;
  label: string;
  count: number;
}) {
  return (
    <a
      href={href}
      className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-2/50 px-3.5 py-2.5 hover:border-border-strong hover:bg-surface-2 transition-colors"
    >
      <span className="text-[14px] font-medium text-fg">{label}</span>
      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-accent/15 text-accent text-[12px] font-semibold px-2">
        {count}
      </span>
    </a>
  );
}
