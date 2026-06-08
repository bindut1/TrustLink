import { MATCH_WEIGHTS } from "@/types/candidate";
import { cn } from "@/lib/cn";

/**
 * AI match-score visualization from the backend `ScoreBreakdown`. The track
 * splits into a NAVY segment (keyword + semantic) and a TEAL tail (verified/
 * on-chain contribution). `detailed` adds the per-tier breakdown; the shown
 * weight is recovered from points/score so it matches the backend's learned
 * weight, with `MATCH_WEIGHTS` as fallback.
 */
type ScoreLike = {
  keywordScore: number | string;
  semanticScore: number | string;
  verifiedBonus: number | string;
  totalScore: number | string;
  explanation?: {
    contributions?: { keyword: number; semantic: number; verified: number };
  };
};

type Weights = { keyword: number; semantic: number; verified: number };

type MatchScoreBarProps = {
  breakdown: ScoreLike;
  variant?: "compact" | "detailed";
  /** Weights (0–1) for the breakdown labels; defaults to the real MATCH_WEIGHTS. */
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
  weights = MATCH_WEIGHTS,
  labels,
  className,
}: MatchScoreBarProps) {
  const total = clampPct(num(breakdown.totalScore));
  // Verified contribution in score points. Prefer the backend's actual value
  // (reflects the learned weight); fall back to raw × default weight.
  const verifiedContrib = clampPct(
    breakdown.explanation?.contributions?.verified ??
      num(breakdown.verifiedBonus) * weights.verified,
  );
  const tealW = Math.min(verifiedContrib, total);
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
      <div className="absolute inset-0 flex">
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

  const contrib = breakdown.explanation?.contributions;
  // Recover the weight from points/score so the label matches the actual
  // (learned) contribution; fall back to the static weight when unavailable.
  const effectiveWeight = (c: { key: keyof Weights; score: number; points?: number }) =>
    typeof c.points === "number" && c.score > 0
      ? c.points / c.score
      : weights[c.key];
  const cols: Array<{
    key: keyof Weights;
    label: string;
    score: number;
    points?: number;
  }> = [
    { key: "keyword", label: labels?.keyword ?? "Keyword", score: num(breakdown.keywordScore), points: contrib?.keyword },
    { key: "semantic", label: labels?.semantic ?? "Semantic", score: num(breakdown.semanticScore), points: contrib?.semantic },
    { key: "verified", label: labels?.verified ?? "Verified", score: num(breakdown.verifiedBonus), points: contrib?.verified },
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
              <div className="mt-1 text-[11.5px] text-fg-faint">
                {labels?.weight ?? "weight"} {Math.round(effectiveWeight(c) * 100)}%
                {typeof c.points === "number" && (
                  <span className="text-fg-subtle"> · +{c.points.toFixed(1)}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
