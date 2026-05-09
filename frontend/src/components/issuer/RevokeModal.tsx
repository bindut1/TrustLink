"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
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
      setError(e instanceof Error ? e.message : "Revoke failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (!credential) return null;

  return (
    <Modal
      open
      onClose={onClose}
      title={`Revoke "${credential.title}"?`}
      description="The credential will be marked revoked and a revocation transaction will be queued on Polygon. The candidate will see this status change immediately."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleRevoke}
            loading={submitting}
            disabled={!reason.trim()}
          >
            Revoke credential
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
        Reason <span className="text-accent">*</span>
      </label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={4}
        placeholder="e.g. Issued in error — duplicate of CR-2026-0034."
        className="w-full rounded-lg border border-border bg-surface-1 p-3 text-[14px] text-fg placeholder:text-fg-faint focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-colors resize-y"
      />
      <p className="mt-2 text-[12px] text-fg-subtle">
        This reason is stored on the credential and visible to the candidate.
      </p>
    </Modal>
  );
}
