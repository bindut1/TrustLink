"use client";

import { Copy, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { TxFailureModal } from "@/components/admin/TxFailureModal";
import { TxStatusBadge } from "@/components/admin/TxStatusBadge";
import { Select } from "@/components/ui/Input";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/Table";
import { fetchTransactions } from "@/lib/admin-api";
import type { BlockchainTx, TxStatus, TxType } from "@/types/admin";

const TX_TYPE_LABEL: Record<TxType, string> = {
  issue_credential: "Issue credential",
  revoke_credential: "Revoke credential",
  add_issuer: "Add issuer",
  remove_issuer: "Remove issuer",
};

export default function AdminBlockchainPage() {
  const [status, setStatus] = useState<TxStatus | "all">("all");
  const [items, setItems] = useState<BlockchainTx[] | null>(null);
  const [failureTarget, setFailureTarget] = useState<BlockchainTx | null>(null);

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    fetchTransactions({ status }).then((r) => {
      if (!cancelled) setItems(r);
    });
    return () => {
      cancelled = true;
    };
  }, [status]);

  return (
    <>
      <PageHeader
        title="Blockchain transactions"
        description="Monitor every Polygon transaction the system has queued, submitted, confirmed or failed."
      />

      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="text-[12.5px] text-fg-subtle">
          {items
            ? `${items.length} ${items.length === 1 ? "transaction" : "transactions"}`
            : ""}
        </div>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value as TxStatus | "all")}
          className="h-10 w-[180px]"
        >
          <option value="all">All statuses</option>
          <option value="queued">Queued</option>
          <option value="submitted">Submitted</option>
          <option value="retrying">Retrying</option>
          <option value="confirmed">Confirmed</option>
          <option value="failed">Failed</option>
        </Select>
      </div>

      <Table>
        <THead>
          <TR>
            <TH>Status</TH>
            <TH>Type</TH>
            <TH>Tx hash</TH>
            <TH>Block</TH>
            <TH>Initiated by</TH>
            <TH>Queued at</TH>
            <TH>Retries</TH>
          </TR>
        </THead>
        <TBody>
          {!items ? (
            <TR>
              <TD colSpan={7} className="text-center text-fg-subtle py-10">
                Loading transactions…
              </TD>
            </TR>
          ) : items.length === 0 ? (
            <TR>
              <TD colSpan={7} className="text-center text-fg-subtle py-10">
                No transactions match this filter.
              </TD>
            </TR>
          ) : (
            items.map((tx) => {
              const failed = tx.status === "failed";
              return (
                <TR
                  key={tx.id}
                  onClick={failed ? () => setFailureTarget(tx) : undefined}
                  className={
                    failed
                      ? "bg-danger/[0.03] cursor-pointer hover:bg-danger/[0.08]"
                      : ""
                  }
                  title={failed ? "Click to see failure reason" : undefined}
                >
                  <TD>
                    <TxStatusBadge status={tx.status} />
                  </TD>
                  <TD className="text-fg">
                    {TX_TYPE_LABEL[tx.transactionType]}
                  </TD>
                  <TD>
                    {tx.txHash ? (
                      <div
                        className="flex items-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <code className="text-[12px] font-mono text-fg-muted">
                          {shortHash(tx.txHash)}
                        </code>
                        <CopyBtn value={tx.txHash} />
                        <a
                          href={`https://amoy.polygonscan.com/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View on PolygonScan"
                          className="inline-flex h-6 w-6 items-center justify-center rounded text-fg-subtle hover:text-fg hover:bg-surface-2 transition-colors"
                        >
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    ) : (
                      <span className="text-fg-faint">—</span>
                    )}
                  </TD>
                  <TD className="font-mono text-[12.5px] text-fg-muted">
                    {tx.blockNumber ? `#${tx.blockNumber.toLocaleString()}` : "—"}
                  </TD>
                  <TD className="text-fg-muted">{tx.initiatedByName}</TD>
                  <TD className="font-mono text-[12px] text-fg-subtle">
                    {new Date(tx.queuedAt).toLocaleString()}
                  </TD>
                  <TD>
                    <span
                      className={
                        tx.retryCount > 0
                          ? "text-warn font-semibold"
                          : "text-fg-subtle"
                      }
                    >
                      {tx.retryCount}/3
                    </span>
                  </TD>
                </TR>
              );
            })
          )}
        </TBody>
      </Table>

      <TxFailureModal
        tx={failureTarget}
        onClose={() => setFailureTarget(null)}
      />
    </>
  );
}

function CopyBtn({ value }: { value: string }) {
  return (
    <button
      type="button"
      title="Copy hash"
      onClick={() => navigator.clipboard.writeText(value)}
      className="inline-flex h-6 w-6 items-center justify-center rounded text-fg-subtle hover:text-fg hover:bg-surface-2 transition-colors"
    >
      <Copy size={11} />
    </button>
  );
}

function shortHash(hash: string): string {
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}
