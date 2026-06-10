"use client";

import { MailOpen, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { useSetPageMeta } from "@/components/app-shell/page-meta";
import { ApplyModal } from "@/components/candidate/ApplyModal";
import { DeclineOfferModal } from "@/components/candidate/DeclineOfferModal";
import { OfferDetailModal } from "@/components/candidate/OfferDetailModal";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { fetchMyInvitations } from "@/lib/candidate-api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { JobInvitationItem, JobItem } from "@/types/candidate";

export default function CandidateOffersPage() {
  const { t } = useLanguage();
  useSetPageMeta(t("candidate.offers.title"), t("candidate.offers.description"));

  const [items, setItems] = useState<JobInvitationItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<JobInvitationItem | null>(null);
  const [applyJob, setApplyJob] = useState<JobItem | null>(null);
  const [declineTarget, setDeclineTarget] = useState<JobInvitationItem | null>(
    null,
  );

  function load() {
    fetchMyInvitations()
      .then(setItems)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : t("candidate.offers.failed")),
      );
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleDecline(inv: JobInvitationItem) {
    setDetail(null);
    setDeclineTarget(inv);
  }

  function handleApply(inv: JobInvitationItem) {
    setDetail(null);
    setApplyJob(inv.job);
  }

  return (
    <>
      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {!items ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={120} className="rounded-card" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={MailOpen}
          title={t("candidate.offers.emptyTitle")}
          description={t("candidate.offers.emptyDesc")}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((inv) => (
            <OfferCard key={inv.id} inv={inv} onOpen={() => setDetail(inv)} />
          ))}
        </div>
      )}

      <OfferDetailModal
        invitation={detail}
        onClose={() => setDetail(null)}
        onApply={handleApply}
        onDecline={handleDecline}
      />
      <ApplyModal
        job={applyJob}
        onClose={() => setApplyJob(null)}
        onApplied={load}
      />
      <DeclineOfferModal
        invitation={declineTarget}
        onClose={() => setDeclineTarget(null)}
        onDeclined={load}
      />
    </>
  );
}

function OfferCard({
  inv,
  onOpen,
}: {
  inv: JobInvitationItem;
  onOpen: () => void;
}) {
  const { t } = useLanguage();
  const job = inv.job;

  const badge = inv.hasApplied
    ? { label: t("candidate.offers.statusApplied"), cls: "bg-success/12 text-success" }
    : inv.status === "declined"
      ? { label: t("candidate.offers.statusDeclined"), cls: "bg-surface-2 text-fg-muted" }
      : { label: t("candidate.offers.statusNew"), cls: "bg-navy/8 text-navy" };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="rounded-card border border-border bg-canvas p-5 sm:p-6 shadow-[var(--shadow-card)] cursor-pointer tl-card-interactive"
    >
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium",
            badge.cls,
          )}
        >
          {badge.label}
        </span>
        <span className="text-[12px] text-fg-subtle font-mono">
          {timeAgo(inv.createdAt, t)}
        </span>
      </div>

      <h3 className="text-[17px] font-semibold tracking-[-0.015em] text-fg leading-snug mb-1">
        {job.title}
      </h3>
      <p className="text-[13px] text-fg-muted mb-2">
        {t("candidate.offers.fromCompany").replace("{name}", inv.recruiterName)}
      </p>

      {(job.city || job.isRemote) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-fg-muted mb-2">
          {job.city && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={13} className="text-fg-subtle" />
              {job.city}
            </span>
          )}
          {job.isRemote && <span>{t("common.remote")}</span>}
        </div>
      )}

      {inv.message && (
        <p className="text-[13px] text-fg-muted leading-relaxed border-l-2 border-border pl-3 line-clamp-2">
          {inv.message}
        </p>
      )}
    </article>
  );
}

function timeAgo(
  iso: string,
  t: (
    key:
      | "common.justNow"
      | "common.minutesAgo"
      | "common.hoursAgo"
      | "common.daysAgo",
  ) => string,
): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return t("common.justNow");
  if (sec < 3600) return `${Math.floor(sec / 60)} ${t("common.minutesAgo")}`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} ${t("common.hoursAgo")}`;
  return `${Math.floor(sec / 86400)} ${t("common.daysAgo")}`;
}
