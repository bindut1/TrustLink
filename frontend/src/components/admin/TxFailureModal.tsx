"use client";

import { AlertTriangle, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { parseBlockchainError } from "@/lib/parse-blockchain-error";
import type { BlockchainTx } from "@/types/admin";

const TX_TYPE_LABEL: Record<BlockchainTx["transactionType"], string> = {
  issue_credential: "Issue credential",
  revoke_credential: "Revoke credential",
  add_issuer: "Add issuer",
  remove_issuer: "Remove issuer",
};

type TxFailureModalProps = {
  tx: BlockchainTx | null;
  onClose: () => void;
};

export function TxFailureModal({ tx, onClose }: TxFailureModalProps) {
  const [showRaw, setShowRaw] = useState(false);

  if (!tx) return null;
  const parsed = parseBlockchainError(tx.errorMessage ?? null);

  return (
    <Modal
      open
      onClose={onClose}
      title="Transaction failed"
      description="The blockchain rejected this transaction after retries. Below is the reason reported by the contract."
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="flex items-start gap-3 rounded-xl border border-danger/25 bg-danger/[0.04] p-4">
        <span className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-danger/15 text-danger">
          <AlertTriangle size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.10em] text-danger/80 mb-1">
            Reason
          </div>
          <div className="text-[15px] font-semibold text-fg leading-snug">
            {parsed.reason}
          </div>
          {parsed.code && (
            <div className="mt-2">
              <Badge variant="danger">{parsed.code}</Badge>
            </div>
          )}
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-[140px_1fr] gap-y-3 text-[13.5px]">
        <dt className="text-fg-subtle">Type</dt>
        <dd className="text-fg">{TX_TYPE_LABEL[tx.transactionType]}</dd>

        <dt className="text-fg-subtle">Initiated by</dt>
        <dd className="text-fg">{tx.initiatedByName}</dd>

        <dt className="text-fg-subtle">Retries</dt>
        <dd className="text-fg font-semibold">
          <span className={tx.retryCount >= 3 ? "text-danger" : ""}>
            {tx.retryCount}/3
          </span>
        </dd>

        <dt className="text-fg-subtle">Contract method</dt>
        <dd className="font-mono text-fg-muted text-[12.5px]">
          {tx.contractMethod}
        </dd>

        {tx.txHash && (
          <>
            <dt className="text-fg-subtle">Tx hash</dt>
            <dd className="font-mono text-fg-muted text-[12px] break-all">
              {tx.txHash}
            </dd>
          </>
        )}

        <dt className="text-fg-subtle">Queued at</dt>
        <dd className="text-fg-muted font-mono text-[12.5px]">
          {new Date(tx.queuedAt).toLocaleString()}
        </dd>
      </dl>

      {tx.errorMessage && tx.errorMessage !== parsed.reason && (
        <div className="mt-5">
          <button
            type="button"
            onClick={() => setShowRaw((v) => !v)}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-fg-subtle hover:text-fg transition-colors"
          >
            <ChevronDown
              size={14}
              className={`transition-transform ${showRaw ? "rotate-180" : ""}`}
            />
            {showRaw ? "Hide" : "Show"} technical details
          </button>
          {showRaw && (
            <pre className="mt-3 rounded-lg border border-border bg-surface-2/60 p-3.5 text-[11.5px] font-mono text-fg-muted leading-relaxed whitespace-pre-wrap break-all max-h-[260px] overflow-y-auto">
              {tx.errorMessage}
            </pre>
          )}
        </div>
      )}
    </Modal>
  );
}
