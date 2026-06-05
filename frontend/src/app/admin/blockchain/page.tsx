"use client";

import { Copy, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { useSetPageMeta } from "@/components/app-shell/page-meta";
import { TxFailureModal } from "@/components/admin/TxFailureModal";
import { TxStatusBadge } from "@/components/admin/TxStatusBadge";
import { SelectMenu } from "@/components/ui/SelectMenu";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/Table";
import { fetchTransactions } from "@/lib/admin-api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";
import type { BlockchainTx, TxStatus, TxType } from "@/types/admin";

const TX_TYPE_KEY: Record<TxType, TranslationKey> = {
  issue_credential: "tx.type.issue_credential",
  revoke_credential: "tx.type.revoke_credential",
  add_issuer: "tx.type.add_issuer",
  remove_issuer: "tx.type.remove_issuer",
};

export default function AdminBlockchainPage() {
  const { t } = useLanguage();
  useSetPageMeta(t("admin.blockchain.title"), t("admin.blockchain.description"));
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

  const statusOptions = [
    { value: "all", label: t("status.tx.all") },
    { value: "queued", label: t("status.tx.queued") },
    { value: "submitted", label: t("status.tx.submitted") },
    { value: "retrying", label: t("status.tx.retrying") },
    { value: "confirmed", label: t("status.tx.confirmed") },
    { value: "failed", label: t("status.tx.failed") },
  ];

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="text-[12.5px] text-fg-subtle">
          {items
            ? t(
                items.length === 1
                  ? "admin.blockchain.summaryOne"
                  : "admin.blockchain.summaryMany",
              ).replace("{n}", String(items.length))
            : ""}
        </div>
        <SelectMenu
          value={status}
          onChange={(v) => setStatus(v as TxStatus | "all")}
          options={statusOptions}
          ariaLabel={t("common.status")}
          className="w-[180px]"
        />
      </div>

      <Table>
        <THead>
          <TR>
            <TH>{t("common.status")}</TH>
            <TH>{t("common.type")}</TH>
            <TH>{t("admin.blockchain.txHash")}</TH>
            <TH>{t("admin.blockchain.block")}</TH>
            <TH>{t("admin.blockchain.initiatedBy")}</TH>
            <TH>{t("admin.blockchain.queuedAt")}</TH>
            <TH>{t("admin.blockchain.retries")}</TH>
          </TR>
        </THead>
        <TBody>
          {!items ? (
            <TR>
              <TD colSpan={7} className="text-center text-fg-subtle py-10">
                {t("admin.blockchain.loading")}
              </TD>
            </TR>
          ) : items.length === 0 ? (
            <TR>
              <TD colSpan={7} className="text-center text-fg-subtle py-10">
                {t("admin.blockchain.empty")}
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
                  title={
                    failed ? t("admin.blockchain.clickFailureReason") : undefined
                  }
                >
                  <TD>
                    <TxStatusBadge status={tx.status} />
                  </TD>
                  <TD className="text-fg">
                    {t(TX_TYPE_KEY[tx.transactionType])}
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
                          title={t("admin.blockchain.viewOnPolygonScan")}
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
  const { t } = useLanguage();
  return (
    <button
      type="button"
      title={t("a11y.copyHash")}
      aria-label={t("a11y.copyHash")}
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
