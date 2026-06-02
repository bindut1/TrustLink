"use client";

import {
  Award,
  Bell,
  BellDot,
  Briefcase,
  Building2,
  CheckCheck,
  Info,
  Megaphone,
  UserCheck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useNotificationStream } from "@/lib/notifications-api";
import type { NotificationItem, NotificationType } from "@/types/notification";

type Props = { enabled: boolean };

export function NotificationsDropdown({ enabled }: Props) {
  const { t } = useLanguage();
  const { notifications, unreadCount, markRead, markAllRead } =
    useNotificationStream(enabled);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    function handle(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        title={t("a11y.notifications")}
        aria-label={t("a11y.notifications")}
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
      >
        {unreadCount > 0 ? <BellDot size={18} /> : <Bell size={18} />}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white px-[3px] leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[360px] max-w-[calc(100vw-24px)] rounded-2xl border border-border bg-canvas shadow-[0_8px_32px_-8px_rgba(15,23,42,0.22)] z-50 overflow-hidden animate-[modal-in_0.15s_cubic-bezier(0.2,0.8,0.2,1)]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-[15px] font-semibold text-fg">
              {t("a11y.notifications")}
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center rounded-full bg-danger/10 px-2 py-0.5 text-[11px] font-semibold text-danger">
                  {unreadCount}
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex items-center gap-1 text-[12px] text-fg-muted hover:text-fg transition-colors"
              >
                <CheckCheck size={13} />
                {t("notif.markAllRead")}
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-[13px] text-fg-subtle">
                {t("notif.empty")}
              </div>
            ) : (
              notifications.map((n) => (
                <NotifRow
                  key={n.id}
                  notif={n}
                  onRead={() => {
                    if (!n.isRead) markRead(n.id);
                  }}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotifRow({
  notif,
  onRead,
}: {
  notif: NotificationItem;
  onRead: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onRead}
      onKeyDown={(e) => { if (e.key === "Enter") onRead(); }}
      className={cn(
        "flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-surface-2/60",
        !notif.isRead && "bg-accent/[0.04]",
      )}
    >
      <div className="shrink-0 mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface-2">
        <NotifIcon type={notif.type} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[13px] font-semibold text-fg leading-snug">
            {t(`notif.type.${notif.type}` as Parameters<typeof t>[0]) || notif.title}
          </span>
          {!notif.isRead && (
            <span className="mt-1 shrink-0 h-2 w-2 rounded-full bg-accent" />
          )}
        </div>
        <p className="text-[12.5px] text-fg-muted leading-snug mt-0.5 line-clamp-2">
          {notif.message}
        </p>
        <span className="text-[11px] text-fg-subtle mt-1 block">
          {timeAgo(notif.createdAt, t)}
        </span>
      </div>
    </div>
  );
}

function NotifIcon({ type }: { type: NotificationType }) {
  const cls = "text-fg-muted";
  switch (type) {
    case "credential_issued":
    case "credential_reissued":
      return <Award size={14} className={cls} />;
    case "credential_revoked":
      return <Award size={14} className="text-danger" />;
    case "application_received":
    case "application_status_changed":
      return <UserCheck size={14} className={cls} />;
    case "job_recommendation":
      return <Briefcase size={14} className={cls} />;
    case "institution_approved":
      return <Building2 size={14} className="text-success" />;
    case "institution_rejected":
      return <Building2 size={14} className="text-danger" />;
    case "system_announcement":
      return <Megaphone size={14} className={cls} />;
    default:
      return <Info size={14} className={cls} />;
  }
}

type TimeKey =
  | "notif.justNow"
  | "common.minutesAgo"
  | "common.hoursAgo"
  | "common.daysAgo";

function timeAgo(iso: string, t: (key: TimeKey) => string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return t("notif.justNow");
  if (sec < 3600) return `${Math.floor(sec / 60)} ${t("common.minutesAgo")}`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} ${t("common.hoursAgo")}`;
  return `${Math.floor(sec / 86400)} ${t("common.daysAgo")}`;
}
