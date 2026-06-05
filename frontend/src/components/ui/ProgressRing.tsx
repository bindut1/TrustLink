import type { ReactNode } from "react";

/**
 * Single-value circular progress ring (0–100). For categorical breakdowns use
 * Donut instead. Reaching 100 switches the arc to teal (a "complete/verified"
 * signal); otherwise navy.
 */
type ProgressRingProps = {
  value: number;
  size?: number;
  stroke?: number;
  /** Override the center content (defaults to the percentage). */
  children?: ReactNode;
  className?: string;
};

export function ProgressRing({
  value,
  size = 64,
  stroke = 7,
  children,
  className,
}: ProgressRingProps) {
  const pct = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const done = pct >= 100;
  return (
    <div className={`relative shrink-0 ${className ?? ""}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={done ? "var(--teal-500)" : "var(--navy-900)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct / 100)}
          style={{ transition: "stroke-dashoffset 300ms var(--ease)" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children ?? (
          <span className="font-mono text-[15px] font-semibold text-fg tabular-nums">
            {Math.round(pct)}%
          </span>
        )}
      </div>
    </div>
  );
}
