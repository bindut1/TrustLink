import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Dashboard stat tile — the unit the role dashboards are built from.
 * Value renders in tabular figures; pass `mono` for machine values
 * (scores / IDs) per DESIGN_SPEC. Icon tone follows the semantic palette
 * (teal reserved for verified / on-chain counts only).
 */
export type StatTone = "neutral" | "verified" | "success" | "warn" | "danger";

const ICON_TONE: Record<StatTone, string> = {
  neutral: "bg-surface-2 text-fg-subtle",
  verified: "bg-teal-050 text-teal",
  success: "bg-success/12 text-success",
  warn: "bg-warn/12 text-warn",
  danger: "bg-danger/10 text-danger",
};

type StatTileProps = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  tone?: StatTone;
  /** Render the value in the mono face (scores, hashes, IDs). */
  mono?: boolean;
  /** Optional period-over-period delta, e.g. +3. Positive = success tint. */
  delta?: number;
  className?: string;
};

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  mono,
  delta,
  className,
}: StatTileProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-border bg-canvas px-5 py-4 shadow-[var(--shadow-card)]",
        "transition-colors duration-150 hover:border-border-strong",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11.5px] uppercase tracking-[0.10em] font-semibold text-fg-subtle leading-none">
          {label}
        </div>
        {Icon && (
          <span
            className={cn(
              "shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg",
              ICON_TONE[tone],
            )}
          >
            <Icon size={16} strokeWidth={1.75} />
          </span>
        )}
      </div>

      <div className="mt-3 flex items-end gap-2">
        <div
          className={cn(
            "text-[28px] font-bold tracking-[-0.02em] leading-none text-fg tabular-nums",
            mono && "font-mono font-semibold",
          )}
        >
          {value}
        </div>
        {typeof delta === "number" && delta !== 0 && (
          <span
            className={cn(
              "mb-0.5 inline-flex items-center gap-0.5 text-[12px] font-semibold tabular-nums",
              delta > 0 ? "text-success" : "text-danger",
            )}
          >
            {delta > 0 ? (
              <ArrowUpRight size={13} strokeWidth={2.25} />
            ) : (
              <ArrowDownRight size={13} strokeWidth={2.25} />
            )}
            {Math.abs(delta)}
          </span>
        )}
      </div>

      {hint && (
        <div className="mt-1.5 text-[12.5px] text-fg-subtle leading-snug">
          {hint}
        </div>
      )}
    </div>
  );
}
