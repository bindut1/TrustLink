import { cn } from "@/lib/cn";

/**
 * AI match-score visualization, backed by the real `ScoreBreakdown`
 * (keyword / semantic / verified) returned by the matching service.
 *
 * The track is split into a NAVY segment (keyword + semantic contribution) and
 * a TEAL tail (the verified/on-chain bonus) — teal carries the verified
 * semantic, never decoration. Both widths come straight from the data:
 *   verifiedBonus is already expressed in score points, so
 *   teal width = verifiedBonus, navy width = totalScore − verifiedBonus.
 *
 * `compact` renders just the bar (for rows/cards); `detailed` adds the score
 * header and the per-signal breakdown (for the match modal). Per-signal weight
 * labels are shown only when `weights` is supplied — never fabricated.
 */
type ScoreLike = {
  keywordScore: number | string;
  semanticScore: number | string;
  verifiedBonus: number | string;
  totalScore: number | string;
};

type Weights = { keyword: number; semantic: number; verified: number };

type MatchScoreBarProps = {
  breakdown: ScoreLike;
  variant?: "compact" | "detailed";
  /** Optional real weights (0–1) used only to label the breakdown columns. */
  weights?: Weights;
  /** Localized labels so the primitive stays i18n-agnostic. */
  labels?: {
    match?: string;
    keyword?: string;
    semantic?: string;
    verified?: string;
    weight?: string;
  };
  className?: string;
};

function num(v: number | string): number {
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : 0;
}

const clampPct = (n: number) => Math.max(0, Math.min(100, n));

export function MatchScoreBar({
  breakdown,
  variant = "compact",
  weights,
  labels,
  className,
}: MatchScoreBarProps) {
  const total = clampPct(num(breakdown.totalScore));
  const verified = clampPct(num(breakdown.verifiedBonus));
  // Teal tail never exceeds the total fill.
  const tealW = Math.min(verified, total);
  const navyW = Math.max(0, total - tealW);

  const Track = (
    <div
      className="relative h-2 w-full overflow-hidden rounded-full bg-surface-3"
      role="progressbar"
      aria-valuenow={Math.round(total)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={labels?.match ?? "Match score"}
    >
      <div className="absolute inset-y-0 left-0 flex">
        <span
          className="h-full bg-navy transition-[width] duration-200"
          style={{ width: `${navyW}%` }}
        />
        <span
          className="h-full bg-teal transition-[width] duration-200"
          style={{ width: `${tealW}%` }}
        />
      </div>
    </div>
  );

  if (variant === "compact") {
    return <div className={cn("w-full", className)}>{Track}</div>;
  }

  const cols: Array<{ key: keyof Weights; label: string; score: number }> = [
    { key: "keyword", label: labels?.keyword ?? "Keyword", score: num(breakdown.keywordScore) },
    { key: "semantic", label: labels?.semantic ?? "Semantic", score: num(breakdown.semanticScore) },
    { key: "verified", label: labels?.verified ?? "Verified", score: num(breakdown.verifiedBonus) },
  ];

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[28px] font-semibold leading-none text-fg tabular-nums">
          {Math.round(total)}
        </span>
        <span className="text-[13px] text-fg-subtle">
          / 100 {labels?.match ?? "match"}
        </span>
      </div>

      <div className="mt-3">{Track}</div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {cols.map((c) => {
          const isVerified = c.key === "verified";
          return (
            <div key={c.key}>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-subtle">
                <span
                  aria-hidden
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    isVerified ? "bg-teal" : "bg-navy",
                  )}
                />
                {c.label}
              </div>
              <div
                className={cn(
                  "mt-1 font-mono text-[18px] font-semibold leading-none tabular-nums",
                  isVerified ? "text-teal" : "text-fg",
                )}
              >
                {Math.round(c.score)}
                <span className="text-[12px] font-normal text-fg-faint">
                  {" "}
                  /100
                </span>
              </div>
              {weights && (
                <div className="mt-1 text-[11.5px] text-fg-faint">
                  {labels?.weight ?? "weight"}{" "}
                  {Math.round(weights[c.key] * 100)}%
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
