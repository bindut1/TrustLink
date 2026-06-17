import { cn } from "@/lib/cn";

/**
 * AI match-score visualization. A single solid bar on a 0–100 scale — the
 * per-tier weight breakdown is intentionally hidden from end users (candidate
 * and recruiter); only the overall fit is shown.
 */
type ScoreLike = {
  totalScore: number | string;
};

type MatchScoreBarProps = {
  breakdown: ScoreLike;
  /** Accessible label so the primitive stays i18n-agnostic. */
  label?: string;
  className?: string;
};

function num(v: number | string): number {
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : 0;
}

const clampPct = (n: number) => Math.max(0, Math.min(100, n));

export function MatchScoreBar({ breakdown, label, className }: MatchScoreBarProps) {
  const total = clampPct(num(breakdown.totalScore));

  return (
    <div className={cn("w-full", className)}>
      <div
        className="relative h-2 w-full overflow-hidden rounded-full bg-surface-3"
        role="progressbar"
        aria-valuenow={Math.round(total)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Match score"}
      >
        <span
          className="absolute inset-y-0 left-0 bg-navy transition-[width] duration-200"
          style={{ width: `${total}%` }}
        />
      </div>
    </div>
  );
}
