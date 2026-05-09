import { cn } from "@/lib/cn";

type ScoreBreakdownProps = {
  keywordScore: number;
  semanticScore: number;
  verifiedBonus: number;
  totalScore: number;
  /** "compact" for inline use, "full" for a dedicated panel */
  variant?: "compact" | "full";
  className?: string;
};

const TIER_COLOR = {
  keyword: "bg-accent",
  semantic: "bg-[#B084FF]",
  verified: "bg-success",
};

/**
 * Renders the 3-tier match score breakdown — total in big number plus a
 * stacked bar showing keyword (40%) / semantic (50%) / verified (10%) tiers.
 */
export function ScoreBreakdown({
  keywordScore,
  semanticScore,
  verifiedBonus,
  totalScore,
  variant = "compact",
  className,
}: ScoreBreakdownProps) {
  const k = Math.round(toNum(keywordScore));
  const s = Math.round(toNum(semanticScore));
  const v = Math.round(toNum(verifiedBonus));
  const total = Math.round(toNum(totalScore));

  // Bar segments mirror tier weights * tier scores → contributions to total.
  const kContrib = (k * 0.4) / 100;
  const sContrib = (s * 0.5) / 100;
  const vContrib = (v * 0.1) / 100;

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            "font-bold tracking-[-0.025em] leading-none text-fg",
            variant === "full" ? "text-[36px]" : "text-[24px]",
          )}
        >
          {total}
        </span>
        <span className="text-[12.5px] text-fg-subtle">/ 100 match</span>
      </div>

      <div
        className={cn(
          "mt-2 flex w-full overflow-hidden rounded-full bg-surface-3",
          variant === "full" ? "h-2.5" : "h-1.5",
        )}
      >
        <div
          className={cn("h-full transition-[width]", TIER_COLOR.keyword)}
          style={{ width: `${kContrib * 100}%` }}
        />
        <div
          className={cn("h-full transition-[width]", TIER_COLOR.semantic)}
          style={{ width: `${sContrib * 100}%` }}
        />
        <div
          className={cn("h-full transition-[width]", TIER_COLOR.verified)}
          style={{ width: `${vContrib * 100}%` }}
        />
      </div>

      {variant === "full" && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <TierTile label="Keyword" weight="40%" value={k} colorClass={TIER_COLOR.keyword} />
          <TierTile label="Semantic" weight="50%" value={s} colorClass={TIER_COLOR.semantic} />
          <TierTile label="Verified" weight="10%" value={v} colorClass={TIER_COLOR.verified} />
        </div>
      )}
    </div>
  );
}

function TierTile({
  label,
  weight,
  value,
  colorClass,
}: {
  label: string;
  weight: string;
  value: number;
  colorClass: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-2/40 px-3 py-2.5">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={cn("h-2 w-2 rounded-full", colorClass)} />
        <span className="text-[11px] uppercase tracking-[0.08em] font-semibold text-fg-subtle">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-[18px] font-bold tracking-tight text-fg leading-none">
          {value}
        </span>
        <span className="text-[11px] text-fg-subtle">/ 100</span>
      </div>
      <div className="text-[11px] text-fg-subtle font-mono mt-0.5">
        weight {weight}
      </div>
    </div>
  );
}

function toNum(v: number | string | null | undefined): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}
