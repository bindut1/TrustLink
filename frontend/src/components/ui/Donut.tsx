"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Lightweight SVG donut for categorical aggregates (e.g. users by role).
 * Pure presentation of real counts — no synthetic data. Colors are supplied
 * by the caller so semantic colors (teal = on-chain/verified) stay correct.
 *
 * Hovering a slice or its legend row highlights that slice and swaps the
 * center readout to that segment's label / value / share. Motion is
 * opacity-only (150ms); the chart is fully visible at rest.
 */
export type DonutDatum = {
  label: string;
  value: number;
  /** Any CSS color — pass a token var, e.g. "var(--navy-900)". */
  color: string;
};

type DonutProps = {
  data: DonutDatum[];
  size?: number;
  thickness?: number;
  /** Large number shown in the center (defaults to the summed total). */
  centerValue?: string | number;
  centerLabel?: string;
  className?: string;
};

export function Donut({
  data,
  size = 132,
  thickness = 16,
  centerValue,
  centerLabel,
  className,
}: DonutProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let offset = 0;
  const segments = data.map((d) => {
    const fraction = total > 0 ? d.value / total : 0;
    const dash = fraction * circumference;
    const seg = {
      ...d,
      dasharray: `${dash} ${circumference - dash}`,
      dashoffset: -offset,
    };
    offset += dash;
    return seg;
  });

  const active = hovered != null ? data[hovered] : null;
  const pct = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0);

  return (
    <div className={cn("flex items-center gap-5", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth={thickness}
          />
          {total > 0 &&
            segments.map((s, i) => (
              <circle
                key={i}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth={thickness}
                strokeDasharray={s.dasharray}
                strokeDashoffset={s.dashoffset}
                strokeLinecap="butt"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  cursor: "pointer",
                  opacity: hovered == null || hovered === i ? 1 : 0.3,
                  transition: "opacity 150ms var(--ease)",
                }}
              />
            ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-2 text-center">
          <span className="font-mono text-[24px] font-semibold leading-none text-fg tabular-nums">
            {active ? active.value.toLocaleString() : centerValue ?? total.toLocaleString()}
          </span>
          <span className="mt-1 max-w-full truncate text-[11px] uppercase tracking-[0.08em] text-fg-subtle">
            {active ? `${active.label} · ${pct(active.value)}%` : centerLabel}
          </span>
        </div>
      </div>

      <ul className="min-w-0 flex-1 flex flex-col gap-2">
        {data.map((d, i) => (
          <li
            key={d.label}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-1.5 py-0.5 -mx-1.5 text-[13px] cursor-default transition-colors duration-150",
              hovered === i && "bg-surface-2",
            )}
          >
            <span
              aria-hidden
              className="h-2.5 w-2.5 shrink-0 rounded-sm transition-opacity duration-150"
              style={{
                background: d.color,
                opacity: hovered == null || hovered === i ? 1 : 0.3,
              }}
            />
            <span className="min-w-0 flex-1 truncate text-fg-muted">
              {d.label}
            </span>
            <span className="font-mono font-semibold text-fg tabular-nums">
              {d.value.toLocaleString()}
            </span>
            <span className="w-9 text-right font-mono text-[12px] text-fg-faint tabular-nums">
              {pct(d.value)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
