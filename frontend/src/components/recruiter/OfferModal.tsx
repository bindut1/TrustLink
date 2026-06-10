"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { inviteCandidateToJob } from "@/lib/recruiter-api";

type OfferTarget = { jobId: string; candidateId: string; fullName: string };

type Props = {
  target: OfferTarget | null;
  onClose: () => void;
  onSent: (candidateId: string) => void;
};

/**
 * Recruiter composes an invitation ("offer") to a recommended candidate —
 * mirrors the candidate's ApplyModal: a short personal message, then send.
 */
export function OfferModal({ target, onClose, onSent }: Props) {
  const { t } = useLanguage();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!target) return;
    setSubmitting(true);
    setError(null);
    try {
      await inviteCandidateToJob(target.jobId, target.candidateId, message);
      onSent(target.candidateId);
      setMessage("");
      onClose();
    } catch (e) {
      // 409 = already invited / already applied → treat as settled.
      if (e instanceof ApiError && e.status === 409) {
        onSent(target.candidateId);
        setMessage("");
        onClose();
        return;
      }
      setError(
        e instanceof Error ? e.message : t("recruiter.jobDetail.inviteFailed"),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!target) return null;

  return (
    <Modal
      open
      onClose={onClose}
      title={t("offerModal.title")}
      description={t("offerModal.description").replace("{name}", target.fullName)}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} loading={submitting}>
            {submitting ? t("offerModal.submitting") : t("offerModal.submit")}
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
        {t("offerModal.message")}{" "}
        <span className="text-fg-faint font-normal">
          · {t("common.optional")}
        </span>
      </label>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={6}
        placeholder={t("offerModal.messagePlaceholder")}
        className="w-full rounded-lg border border-border bg-surface-1 p-3 text-[14px] text-fg placeholder:text-fg-faint focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-colors resize-y"
      />
      <p className="mt-2 text-[12px] text-fg-subtle">{t("offerModal.hint")}</p>
    </Modal>
  );
}
