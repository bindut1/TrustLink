"use client";

import { Copy, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app-shell/PageHeader";
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
          {items ? `${items.length} ${items.length === 1 ? "transaction" : "transactions"}` : ""}
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
            items.map((tx) => (
              <TR key={tx.id} className={tx.status === "failed" ? "bg-danger/[0.03]" : ""}>
                <TD><TxStatusBadge status={tx.status} /></TD>
                <TD className="text-fg">{TX_TYPE_LABEL[tx.transactionType]}</TD>
                <TD>
                  {tx.txHash ? (
                    <div className="flex items-center gap-1.5">
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
            ))
          )}
        </TBody>
      </Table>

      {items?.some((t) => t.status === "failed" && t.errorMessage) && (
        <div className="mt-5 rounded-2xl border border-danger/25 bg-danger/[0.04] p-5">
          <h3 className="text-[14px] font-semibold text-danger mb-2">
            Recent failures
          </h3>
          <ul className="flex flex-col gap-2 text-[13px] text-fg-muted leading-relaxed">
            {items
              .filter((t) => t.status === "failed" && t.errorMessage)
              .map((t) => (
                <li key={t.id} className="flex gap-2">
                  <code className="font-mono text-fg-subtle shrink-0">
                    {t.txHash ? shortHash(t.txHash) : t.id}
                  </code>
                  <span>{t.errorMessage}</span>
                </li>
              ))}
          </ul>
        </div>
      )}
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
