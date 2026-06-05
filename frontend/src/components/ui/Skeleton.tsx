import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

/**
 * Loading placeholder block. Animates opacity only (`animate-pulse`), so it
 * never gates real content visibility (DESIGN_SPEC hard rule: content must
 * never start hidden behind an entrance animation — this is a standalone
 * placeholder, not a wrapper around content).
 */
type SkeletonProps = {
  className?: string;
  /** Convenience for inline width/height without a utility class. */
  width?: number | string;
  height?: number | string;
  /** Render as a circle (avatars). */
  circle?: boolean;
  style?: CSSProperties;
};

export function Skeleton({
  className,
  width,
  height,
  circle,
  style,
}: SkeletonProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "block animate-pulse bg-surface-3",
        circle ? "rounded-full" : "rounded-md",
        className,
      )}
      style={{ width, height, ...style }}
    />
  );
}

/**
 * A vertically stacked group of text-line skeletons.
 */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <span className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={12}
          className={i === lines - 1 ? "w-2/3" : "w-full"}
        />
      ))}
    </span>
  );
}
