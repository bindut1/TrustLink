import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

type StatsCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  /** Optional accent color for the icon chip */
  tone?: "neutral" | "accent" | "success" | "warn" | "danger";
};

const TONE: Record<NonNullable<StatsCardProps["tone"]>, string> = {
  neutral: "bg-surface-2 text-fg-muted",
  accent: "bg-accent/15 text-accent",
  success: "bg-success/15 text-success",
  warn: "bg-warn/15 text-warn",
  danger: "bg-danger/15 text-danger",
};

export function StatsCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
}: StatsCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-canvas px-6 py-5 transition-colors hover:border-border-strong">
      <div className="flex items-start gap-4">
        {Icon && (
          <span
            className={cn(
              "shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-xl",
              TONE[tone],
            )}
          >
            <Icon size={18} strokeWidth={1.75} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-[12px] uppercase tracking-[0.10em] font-semibold text-fg-subtle leading-none">
            {label}
          </div>
          <div className="mt-2 text-[30px] font-bold tracking-[-0.025em] leading-none text-fg">
            {value}
          </div>
          {hint && (
            <div className="mt-2 text-[12.5px] text-fg-subtle leading-snug">
              {hint}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
