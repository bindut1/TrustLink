import { CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Status pill for credential / on-chain state.
 *
 * Tone semantics are fixed by DESIGN_SPEC:
 *   on-chain / verified → TEAL (the only place teal is allowed besides links)
 *   pending / minting   → WARN (amber)
 *   revoked / failed    → DANGER (red)
 *   neutral             → slate
 *
 * The visible label is passed as children so it can be localized by the caller.
 */
export type StatusTone =
  | "on-chain"
  | "verified"
  | "pending"
  | "revoked"
  | "neutral";

const TONE: Record<StatusTone, string> = {
  "on-chain": "bg-teal-050 text-teal border border-teal/25",
  verified: "bg-teal-050 text-teal border border-teal/25",
  pending: "bg-warn/12 text-warn border border-warn/30",
  revoked: "bg-danger/10 text-danger border border-danger/30",
  neutral: "bg-surface-2 text-fg-muted border border-border",
};

const DOT: Record<StatusTone, string> = {
  "on-chain": "bg-teal",
  verified: "bg-teal",
  pending: "bg-warn",
  revoked: "bg-danger",
  neutral: "bg-fg-faint",
};

type StatusPillProps = {
  tone: StatusTone;
  children: ReactNode;
  /** Show a check icon instead of a dot (defaults on for verified/on-chain). */
  icon?: boolean;
  className?: string;
};

export function StatusPill({
  tone,
  children,
  icon,
  className,
}: StatusPillProps) {
  const showCheck = icon ?? (tone === "on-chain" || tone === "verified");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-medium leading-tight whitespace-nowrap",
        TONE[tone],
        className,
      )}
    >
      {showCheck ? (
        <CheckCircle2 size={12} strokeWidth={2.25} aria-hidden />
      ) : (
        <span
          aria-hidden
          className={cn("h-1.5 w-1.5 rounded-full", DOT[tone])}
        />
      )}
      {children}
    </span>
  );
}
