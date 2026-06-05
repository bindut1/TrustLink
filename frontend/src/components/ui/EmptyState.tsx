import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Empty / zero-data state. Used wherever a real data source returns nothing
 * (no credentials yet, no applications, no search results) instead of leaving
 * a blank region. Pair with an action to give the user a next step.
 */
type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  /** Primary call-to-action (e.g. a Button). */
  action?: ReactNode;
  /** Compact variant for inside cards / table bodies. */
  compact?: boolean;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-10 px-6" : "py-16 px-8",
        className,
      )}
    >
      {Icon && (
        <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-fg-faint">
          <Icon size={22} strokeWidth={1.75} />
        </span>
      )}
      <p className="text-[15px] font-semibold text-fg">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-[42ch] text-[13.5px] text-fg-subtle leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
