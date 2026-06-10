"use client";

import { BadgeCheck, Quote } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { SentInvitationItem } from "@/types/recruiter-app";

type Props = {
  invitation: SentInvitationItem | null;
  onClose: () => void;
};

/**
 * Recruiter-facing detail for an invitation they sent: the message, current
 * status, and the candidate's decline reason if they declined. Intentionally
 * does NOT show the full candidate profile — that's the candidates tab's job.
 */
export function SentOfferDetailModal({ invitation, onClose }: Props) {
  const { t } = useLanguage();
  if (!invitation) return null;

  const badge = invitation.hasApplied
    ? {
        label: t("recruiter.jobDetail.invStatusApplied"),
        cls: "bg-success/12 text-success",
      }
    : invitation.status === "declined"
      ? {
          label: t("recruiter.jobDetail.invStatusDeclined"),
          cls: "bg-danger/10 text-danger",
        }
      : {
          label: t("recruiter.jobDetail.invStatusPending"),
          cls: "bg-navy/8 text-navy",
        };

  return (
    <Modal
      open
      onClose={onClose}
      title={t("sentOffer.title")}
      footer={
        <Button variant="secondary" onClick={onClose}>
          {t("common.close")}
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Candidate (minimal) + status */}
        <div className="flex items-center gap-3">
          <Avatar
            name={invitation.candidate.fullName}
            src={invitation.candidate.avatarUrl}
            size={44}
          />
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold text-fg leading-tight">
              {invitation.candidate.fullName}
            </div>
            <div className="text-[12.5px] text-fg-subtle font-mono truncate">
              {invitation.candidate.email}
            </div>
          </div>
          <span
            className={cn(
              "shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium",
              badge.cls,
            )}
          >
            {badge.label}
          </span>
        </div>

        {/* Sent date */}
        <div className="text-[12.5px] text-fg-subtle">
          {t("sentOffer.sentAt")}: {new Date(invitation.createdAt).toLocaleString()}
        </div>

        {/* Message the recruiter sent */}
        <section>
          <div className="mb-2 flex items-center gap-1.5 text-[11.5px] uppercase tracking-[0.10em] font-semibold text-fg-subtle">
            <Quote size={13} />
            {t("sentOffer.messageTitle")}
          </div>
          {invitation.message ? (
            <p className="whitespace-pre-line rounded-xl border border-border bg-surface-1 p-4 text-[14px] leading-relaxed text-fg">
              {invitation.message}
            </p>
          ) : (
            <p className="text-[13px] text-fg-subtle">
              {t("sentOffer.noMessage")}
            </p>
          )}
        </section>

        {/* Candidate's decline reason */}
        {invitation.status === "declined" && (
          <section>
            <div className="mb-2 text-[11.5px] uppercase tracking-[0.10em] font-semibold text-danger">
              {t("recruiter.jobDetail.invDeclineReason")}
            </div>
            <p className="whitespace-pre-line rounded-xl border border-danger/25 bg-danger/[0.05] p-4 text-[14px] leading-relaxed text-fg">
              {invitation.declineReason || t("sentOffer.noReason")}
            </p>
          </section>
        )}

        {/* Applied note */}
        {invitation.hasApplied && (
          <div className="flex items-center gap-2 rounded-xl border border-success/25 bg-success/[0.06] px-4 py-3 text-[13px] text-success">
            <BadgeCheck size={16} className="shrink-0" />
            {t("sentOffer.appliedNote")}
          </div>
        )}
      </div>
    </Modal>
  );
}
