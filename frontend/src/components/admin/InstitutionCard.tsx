"use client";

import { Building2, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { approveInstitution, rejectInstitution } from "@/lib/admin-api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";
import type { AdminInstitution, ApprovalStatus } from "@/types/admin";

const STATUS_VARIANT: Record<ApprovalStatus, BadgeVariant> = {
  pending: "warn",
  approved: "success",
  rejected: "danger",
};

const STATUS_KEY: Record<ApprovalStatus, TranslationKey> = {
  pending: "status.approval.pending",
  approved: "status.approval.approved",
  rejected: "status.approval.rejected",
};

type InstitutionCardProps = {
  institution: AdminInstitution;
  onChange: (next: AdminInstitution) => void;
};

export function InstitutionCard({ institution, onChange }: InstitutionCardProps) {
  const { t } = useLanguage();
  const [approving, setApproving] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  async function handleApprove() {
    setApproving(true);
    try {
      await approveInstitution(institution.id);
      onChange({
        ...institution,
        approvalStatus: "approved",
        blockchainAddress: `0x${"a".repeat(40)}`,
      });
    } finally {
      setApproving(false);
    }
  }

  async function handleReject() {
    if (!reason.trim()) return;
    setRejecting(true);
    try {
      await rejectInstitution(institution.id, reason.trim());
      onChange({
        ...institution,
        approvalStatus: "rejected",
        rejectionReason: reason.trim(),
      });
      setRejectOpen(false);
      setReason("");
    } finally {
      setRejecting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-canvas p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <span className="shrink-0 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent/12 text-accent">
          <Building2 size={20} strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h3 className="text-[16.5px] font-semibold tracking-[-0.015em] text-fg">
              {institution.name}
            </h3>
            <Badge variant={STATUS_VARIANT[institution.approvalStatus]}>
              {t(STATUS_KEY[institution.approvalStatus])}
            </Badge>
          </div>
          <div className="text-[13px] text-fg-muted leading-relaxed">
            <span className="capitalize">
              {institution.institutionType.replace(/_/g, " ")}
            </span>
            {institution.city && <> · {institution.city}</>}
            {institution.taxCode && (
              <> · Tax code <code className="font-mono">{institution.taxCode}</code></>
            )}
          </div>
          <div className="mt-1 text-[12.5px] text-fg-subtle">
            {t("instCard.contact")} {institution.contactName} ·{" "}
            {institution.contactEmail}
            {institution.website && (
              <>
                {" "}·{" "}
                <a
                  href={institution.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-accent hover:underline"
                >
                  Website
                  <ExternalLink size={11} />
                </a>
              </>
            )}
          </div>

          {institution.approvalStatus === "approved" &&
            institution.blockchainAddress && (
              <div className="mt-3 inline-flex items-center gap-2 text-[12px] font-mono text-fg-subtle">
                <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
                {t("instCard.onChainIssuer")}
                <code className="text-fg-muted">
                  {shortAddress(institution.blockchainAddress)}
                </code>
              </div>
            )}

          {institution.approvalStatus === "rejected" &&
            institution.rejectionReason && (
              <div className="mt-3 rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-[12.5px] text-danger leading-relaxed">
                <strong className="font-semibold">
                  {t("instCard.rejectionReason")}
                </strong>{" "}
                {institution.rejectionReason}
              </div>
            )}
        </div>

        {institution.approvalStatus === "pending" && (
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setRejectOpen(true)}
            >
              {t("instCard.reject")}
            </Button>
            <Button size="md" onClick={handleApprove} loading={approving}>
              {t("instCard.approve")}
            </Button>
          </div>
        )}
      </div>

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title={t("instCard.rejectTitle").replace("{name}", institution.name)}
        description={t("instCard.rejectDescription")}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="primary"
              onClick={handleReject}
              loading={rejecting}
              disabled={!reason.trim()}
            >
              {t("instCard.rejectButton")}
            </Button>
          </>
        }
      >
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder={t("instCard.rejectPlaceholder")}
          className="w-full rounded-lg border border-border bg-surface-1 p-3 text-[14px] text-fg placeholder:text-fg-faint focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-colors resize-y"
        />
      </Modal>
    </div>
  );
}

function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
