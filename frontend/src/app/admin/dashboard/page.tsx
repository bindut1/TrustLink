"use client";

import {
  AlertTriangle,
  Award,
  Building2,
  CheckCircle2,
  Clock,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { StatsCard } from "@/components/admin/StatsCard";
import { fetchDashboardStats } from "@/lib/admin-api";
import type { AdminDashboardStats } from "@/types/admin";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);

  useEffect(() => {
    fetchDashboardStats().then(setStats);
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
                Connect a real activity feed once <code>/admin/dashboard</code>{" "}
                returns recent events.
              </p>
              <ul className="mt-5 flex flex-col gap-3.5">
                <ActivityRow
                  icon={<CheckCircle2 size={14} />}
                  tone="success"
                  text="HUST issued 12 credentials in the last hour"
                  time="just now"
                />
                <ActivityRow
                  icon={<Clock size={14} />}
                  tone="warn"
                  text="3 institutions awaiting your approval"
                  time="2h ago"
                />
                <ActivityRow
                  icon={<AlertTriangle size={14} />}
                  tone="danger"
                  text="Transaction tx_6 failed after 3 retries"
                  time="6h ago"
                />
              </ul>
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

function ActivityRow({
  icon,
  tone,
  text,
  time,
}: {
  icon: React.ReactNode;
  tone: "success" | "warn" | "danger";
  text: string;
  time: string;
}) {
  const toneClass =
    tone === "success"
      ? "bg-success/12 text-success"
      : tone === "warn"
        ? "bg-warn/15 text-warn"
        : "bg-danger/12 text-danger";
  return (
    <li className="flex items-center gap-3">
      <span
        className={`shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full ${toneClass}`}
      >
        {icon}
      </span>
      <span className="flex-1 text-[14px] text-fg">{text}</span>
      <span className="text-[12px] text-fg-subtle font-mono">{time}</span>
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
