"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { declineInvitation } from "@/lib/candidate-api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { JobInvitationItem } from "@/types/candidate";

type Props = {
  invitation: JobInvitationItem | null;
  onClose: () => void;
  onDeclined: () => void;
};

/**
 * Candidate declines an invitation, optionally leaving a reason the recruiter
 * will see. Mirrors the recruiter's reject-with-reason dialogs.
 */
export function DeclineOfferModal({ invitation, onClose, onDeclined }: Props) {
  const { t } = useLanguage();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!invitation) return;
    setSubmitting(true);
    setError(null);
    try {
      await declineInvitation(invitation.id, reason);
      onDeclined();
      setReason("");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("declineModal.failed"));
    } finally {
      setSubmitting(false);
    }
  }

  if (!invitation) return null;

  return (
    <Modal
      open
      onClose={onClose}
      title={t("declineModal.title")}
      description={t("declineModal.description").replace(
        "{title}",
        invitation.job.title,
      )}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" onClick={submit} loading={submitting}>
            {submitting ? t("declineModal.submitting") : t("declineModal.submit")}
          </Button>
        </>
      }
    >
      {error && (
        <Alert variant="error" className="mb-3">
          {error}
        </Alert>
      )}
      <label className="text-[14px] font-medium text-fg mb-2 block">
        {t("declineModal.reason")}{" "}
        <span className="text-fg-faint font-normal">
          · {t("common.optional")}
        </span>
      </label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={4}
        placeholder={t("declineModal.reasonPlaceholder")}
        className="w-full rounded-lg border border-border bg-surface-1 p-3 text-[14px] text-fg placeholder:text-fg-faint focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-colors resize-y"
      />
    </Modal>
  );
}
