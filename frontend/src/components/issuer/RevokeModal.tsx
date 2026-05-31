"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { revokeCredential } from "@/lib/issuer-api";
import type { Credential } from "@/types/issuer";

type RevokeModalProps = {
  credential: Credential | null;
  onClose: () => void;
  onRevoked: (id: string) => void;
};

export function RevokeModal({
  credential,
  onClose,
  onRevoked,
}: RevokeModalProps) {
  const { t } = useLanguage();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRevoke() {
    if (!credential || !reason.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await revokeCredential(credential.id, reason.trim());
      onRevoked(credential.id);
      setReason("");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("revoke.failed"));
    } finally {
      setSubmitting(false);
    }
  }

  if (!credential) return null;

  return (
    <Modal
      open
      onClose={onClose}
      title={t("revoke.title").replace("{title}", credential.title)}
      description={t("revoke.description")}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={handleRevoke}
            loading={submitting}
            disabled={!reason.trim()}
          >
            {t("revoke.submit")}
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
        {t("revoke.reason")} <span className="text-accent">*</span>
      </label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={4}
        placeholder={t("revoke.reasonPlaceholder")}
        className="w-full rounded-lg border border-border bg-surface-1 p-3 text-[14px] text-fg placeholder:text-fg-faint focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-colors resize-y"
      />
      <p className="mt-2 text-[12px] text-fg-subtle">{t("revoke.reasonHint")}</p>
    </Modal>
  );
}
