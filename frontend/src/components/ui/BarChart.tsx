"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Minimal vertical bar chart for a real time-series (e.g. credentials issued per
 * month). Bars are width-capped and centered so a lone bar never blows up; a
 * month with no data renders just a faint baseline tick (the slot/label stays).
 * Value shown on hover. All-zero series renders flat.
 */
export type BarDatum = {
  /** Short axis label, e.g. "06". */
  label: string;
  value: number;
  /** Optional fuller label for the tooltip, e.g. "2026-06". */
  fullLabel?: string;
};

type BarChartProps = {
  data: BarDatum[];
  /** Bars area height in px (excludes labels). */
  height?: number;
  /** Bar fill color (CSS). Defaults to navy. */
  color?: string;
  className?: string;
};

export function BarChart({
  data,
  height = 120,
  color = "var(--navy-900)",
  className,
}: BarChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-end justify-between gap-1.5" style={{ height }}>
        {data.map((d, i) => {
          const h = (d.value / max) * 100;
          const active = hovered === i;
          return (
            <div
              key={i}
              className="group relative flex h-full flex-1 flex-col items-center justify-end"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {active && d.value > 0 && (
                <div className="animate-pop-in pointer-events-none absolute left-1/2 bottom-full z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-canvas px-2 py-1 text-[11.5px] shadow-[var(--shadow-card)]">
                  <span className="font-mono font-semibold text-fg tabular-nums">
                    {d.value}
                  </span>
                  {(d.fullLabel || d.label) && (
                    <span className="text-fg-faint"> · {d.fullLabel ?? d.label}</span>
                  )}
                </div>
              )}
              {d.value > 0 ? (
                <div
                  className="w-full max-w-[26px] rounded-t-[5px] transition-[height,opacity] duration-200"
                  style={{
                    height: `${Math.max(h, 6)}%`,
                    background: color,
                    opacity: hovered == null || active ? 1 : 0.35,
                  }}
                />
              ) : (
                <div className="w-full max-w-[26px] h-[2px] rounded-full bg-border" />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between gap-1.5">
        {data.map((d, i) => (
          <div
            key={i}
            className="flex-1 text-center text-[10.5px] font-mono text-fg-faint tabular-nums"
          >
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}
