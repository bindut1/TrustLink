"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Horizontal proportion bar with legend — for status breakdowns where the
 * segments sum to a meaningful whole (credential issued/revoked, tx
 * confirmed/queued/failed). Real counts only; caller supplies semantic colors.
 *
 * Hovering a segment (or its legend item) highlights it and shows a tooltip
 * with the label, value and share. Motion is opacity-only (150ms).
 */
export type StackSegment = {
  label: string;
  value: number;
  color: string;
};

type StackBarProps = {
  title?: string;
  segments: StackSegment[];
  className?: string;
};

export function StackBar({ title, segments, className }: StackBarProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const total = segments.reduce((s, d) => s + d.value, 0);
  const pct = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0);

  // Midpoint (in %) of each segment, for positioning the tooltip.
  let acc = 0;
  const mid = segments.map((s) => {
    const start = total > 0 ? (acc / total) * 100 : 0;
    const width = total > 0 ? (s.value / total) * 100 : 0;
    acc += s.value;
    return start + width / 2;
  });

  return (
    <div className={cn("min-w-0", className)}>
      {title && (
        <div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-fg-subtle">
          {title}
        </div>
      )}

      <div className="relative">
        {/* Tooltip */}
        {hovered != null && segments[hovered].value > 0 && (
          <div
            className="animate-pop-in pointer-events-none absolute bottom-full z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-canvas px-2.5 py-1.5 text-[12px] shadow-[var(--shadow-card)]"
            style={{ left: `${mid[hovered]}%` }}
          >
            <span className="font-medium text-fg-muted">
              {segments[hovered].label}
            </span>{" "}
            <span className="font-mono font-semibold text-fg tabular-nums">
              {segments[hovered].value.toLocaleString()}
            </span>{" "}
            <span className="text-fg-faint">· {pct(segments[hovered].value)}%</span>
          </div>
        )}

        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-3">
          {total > 0 &&
            segments.map((s, i) =>
              s.value > 0 ? (
                <span
                  key={s.label}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  className="h-full cursor-pointer first:rounded-l-full last:rounded-r-full"
                  style={{
                    width: `${(s.value / total) * 100}%`,
                    background: s.color,
                    opacity: hovered == null || hovered === i ? 1 : 0.35,
                    transition: "opacity 150ms var(--ease)",
                  }}
                />
              ) : null,
            )}
        </div>
      </div>

      <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
        {segments.map((s, i) => (
          <li
            key={s.label}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            className={cn(
              "flex items-center gap-1.5 rounded px-1 -mx-1 text-[12.5px] cursor-default transition-colors duration-150",
              hovered === i && "bg-surface-2",
            )}
          >
            <span
              aria-hidden
              className="h-2 w-2 shrink-0 rounded-sm transition-opacity duration-150"
              style={{
                background: s.color,
                opacity: hovered == null || hovered === i ? 1 : 0.35,
              }}
            />
            <span className="text-fg-muted">{s.label}</span>
            <span className="font-mono font-semibold text-fg tabular-nums">
              {s.value.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
