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
import type { AdminDashboardStats, AuditLog } from "@/types/admin";

type ActivityTone = "success" | "warn" | "danger" | "info" | "neutral";

const ACTION_META: Record<
  string,
  { icon: ReactNode; tone: ActivityTone; label: (log: AuditLog) => string }
> = {
  "auth.login": {
    icon: <LogIn size={14} />,
    tone: "neutral",
    label: (log) => `${log.user?.fullName ?? "User"} logged in`,
  },
  "credential.issue": {
    icon: <Award size={14} />,
    tone: "success",
    label: (log) => `${log.user?.fullName ?? "Issuer"} issued a credential`,
  },
  "credential.revoke": {
    icon: <XCircle size={14} />,
    tone: "warn",
    label: (log) => `${log.user?.fullName ?? "Issuer"} revoked a credential`,
  },
  "institution.approved": {
    icon: <CheckCircle2 size={14} />,
    tone: "success",
    label: (log) =>
      `${log.user?.fullName ?? "Admin"} approved an institution`,
  },
  "institution.rejected": {
    icon: <AlertTriangle size={14} />,
    tone: "danger",
    label: (log) =>
      `${log.user?.fullName ?? "Admin"} rejected an institution`,
  },
  "user.status_change": {
    icon: <ShieldOff size={14} />,
    tone: "warn",
    label: (log) => {
      const next = log.newValues?.status as string | undefined;
      const verb = next === "suspended" ? "suspended" : "updated";
      return `${log.user?.fullName ?? "Admin"} ${verb} a user`;
    },
  },
  "user.override_set": {
    icon: <UserCog size={14} />,
    tone: "info",
    label: (log) =>
      `${log.user?.fullName ?? "Admin"} set a permission override`,
  },
  "user.override_removed": {
    icon: <UserCog size={14} />,
    tone: "neutral",
    label: (log) =>
      `${log.user?.fullName ?? "Admin"} removed a permission override`,
  },
};

const FALLBACK_META = {
  icon: <Link2 size={14} />,
  tone: "neutral" as ActivityTone,
};

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [activity, setActivity] = useState<AuditLog[] | null>(null);

  useEffect(() => {
    fetchDashboardStats().then(setStats);
    fetchAuditLogs({ limit: 6 }).then(setActivity);
  }, []);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="System health at a glance — users, credentials, pending approvals and on-chain activity."
      />

      {!stats ? (
        <div className="rounded-2xl border border-border bg-canvas p-10 text-center text-fg-subtle">
          Loading…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard
              label="Total users"
              value={stats.users.total.toLocaleString()}
              hint={`${stats.users.byRole.candidate} candidates · ${stats.users.byRole.recruiter} recruiters · ${stats.users.byRole.issuer} issuers`}
              icon={Users}
              tone="accent"
            />
            <StatsCard
              label="Credentials"
              value={stats.credentials.total.toLocaleString()}
              hint={`${stats.credentials.issued.toLocaleString()} issued · ${stats.credentials.revoked.toLocaleString()} revoked`}
              icon={Award}
              tone="success"
            />
            <StatsCard
              label="Pending institutions"
              value={stats.institutions.pending}
              hint={`${stats.institutions.approved} approved · ${stats.institutions.total} total`}
              icon={Building2}
              tone="warn"
            />
            <StatsCard
              label="Failed transactions"
              value={stats.transactions.failed}
              hint={`${stats.transactions.queued} queued · ${stats.transactions.confirmed.toLocaleString()} confirmed`}
              icon={AlertTriangle}
              tone={stats.transactions.failed > 0 ? "danger" : "neutral"}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-2xl border border-border bg-canvas p-6">
              <h2 className="text-[16px] font-semibold tracking-[-0.015em] text-fg mb-1">
                Recent activity
              </h2>
              <p className="text-[13.5px] text-fg-subtle leading-relaxed">
                Latest privileged actions from the audit log.
              </p>
              {activity === null ? (
                <p className="mt-5 text-[13.5px] text-fg-subtle">Loading…</p>
              ) : activity.length === 0 ? (
                <p className="mt-5 text-[13.5px] text-fg-subtle">
                  No activity yet.
                </p>
              ) : (
                <ul className="mt-5 flex flex-col gap-3.5">
                  {activity.map((log) => {
                    const meta = ACTION_META[log.action];
                    return (
                      <ActivityRow
                        key={log.id}
                        icon={meta?.icon ?? FALLBACK_META.icon}
                        tone={meta?.tone ?? FALLBACK_META.tone}
                        text={meta?.label(log) ?? log.action}
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
                  View all audit logs →
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-canvas p-6">
              <h2 className="text-[16px] font-semibold tracking-[-0.015em] text-fg mb-1">
                Quick links
              </h2>
              <p className="text-[13.5px] text-fg-subtle">
                Jump straight to what needs attention.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <QuickLink
                  href="/admin/institutions?status=pending"
                  label="Approve institutions"
                  count={stats.institutions.pending}
                />
                <QuickLink
                  href="/admin/blockchain?status=failed"
                  label="Review failed transactions"
                  count={stats.transactions.failed}
                />
                <QuickLink
                  href="/admin/users?status=suspended"
                  label="Suspended users"
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
