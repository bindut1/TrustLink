"use client";

import { useEffect, useState } from "react";
import { BatchStatusBadge } from "@/components/issuer/StatusBadge";
import { fetchBatch } from "@/lib/issuer-api";
import { cn } from "@/lib/cn";
import type { BatchImport } from "@/types/issuer";

const TERMINAL = new Set(["completed", "failed", "partially_completed"]);

type BatchProgressProps = {
  batchId: string;
  /** Polled batch (null while still loading first response). */
  onUpdate?: (batch: BatchImport) => void;
};

/**
 * Polls `/batch-imports/:id` every 2s until the batch reaches a terminal state.
 * Renders a progress bar + counts + (when there are errors) the error report.
 */
export function BatchProgress({ batchId, onUpdate }: BatchProgressProps) {
  const [batch, setBatch] = useState<BatchImport | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    async function tick() {
      try {
        const next = await fetchBatch(batchId);
        if (cancelled) return;
        setBatch(next);
        onUpdate?.(next);
        if (!TERMINAL.has(next.status)) {
          timeoutId = setTimeout(tick, 2000);
        }
      } catch {
        if (!cancelled) timeoutId = setTimeout(tick, 4000);
      }
    }
    void tick();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [batchId, onUpdate]);

  if (!batch) {
    return (
      <div className="rounded-2xl border border-border bg-canvas p-6 text-fg-subtle text-[14px]">
        Loading batch progress…
      </div>
    );
  }

  const total = batch.totalRows || 0;
  const processed = batch.processedRows || 0;
  const pct = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;
  const isTerminal = TERMINAL.has(batch.status);

  return (
    <div className="rounded-2xl border border-border bg-canvas p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="text-[15px] font-semibold text-fg truncate">
            {batch.originalFilename}
          </div>
          <div className="text-[12.5px] text-fg-subtle font-mono mt-0.5">
            {new Date(batch.createdAt).toLocaleString()}
          </div>
        </div>
        <BatchStatusBadge status={batch.status} />
      </div>

      <div className="flex items-baseline justify-between gap-4 mb-2 text-[12.5px]">
        <span className="text-fg-subtle">
          {processed.toLocaleString()} / {total.toLocaleString()} rows
        </span>
        <span className="font-semibold text-fg">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-surface-3 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500 ease-out",
            isTerminal && batch.status === "failed"
              ? "bg-danger"
              : isTerminal && batch.status === "partially_completed"
                ? "bg-warn"
                : "bg-accent",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        <Tile label="Total" value={batch.totalRows} />
        <Tile label="Success" value={batch.successCount} tone="success" />
        <Tile label="Errors" value={batch.errorCount} tone={batch.errorCount > 0 ? "danger" : "neutral"} />
      </div>

      {batch.errorReport && batch.errorReport.length > 0 && (
        <div className="mt-6">
          <div className="text-[11.5px] uppercase tracking-[0.10em] font-semibold text-fg-subtle mb-3">
            Error report ({batch.errorReport.length})
          </div>
          <div className="rounded-lg border border-border max-h-[300px] overflow-y-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-surface-2/60 sticky top-0">
                <tr className="border-b border-border">
                  <th className="text-left px-3 py-2 font-semibold text-fg-subtle text-[11.5px] uppercase tracking-wide w-16">
                    Row
                  </th>
                  <th className="text-left px-3 py-2 font-semibold text-fg-subtle text-[11.5px] uppercase tracking-wide w-32">
                    Field
                  </th>
                  <th className="text-left px-3 py-2 font-semibold text-fg-subtle text-[11.5px] uppercase tracking-wide">
                    Error
                  </th>
                </tr>
              </thead>
              <tbody>
                {batch.errorReport.map((err, i) => (
                  <tr
                    key={i}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="px-3 py-2 font-mono text-fg-subtle">
                      {err.row}
                    </td>
                    <td className="px-3 py-2 font-mono text-fg-muted">
                      {err.field ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-danger">{err.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Tile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "success" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "danger"
        ? "text-danger"
        : "text-fg";
  return (
    <div className="rounded-lg border border-border bg-surface-2/40 px-3 py-3">
      <div className={cn("text-[20px] font-bold tracking-tight", toneClass)}>
        {value.toLocaleString()}
      </div>
      <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-fg-subtle mt-1">
        {label}
      </div>
    </div>
  );
}
