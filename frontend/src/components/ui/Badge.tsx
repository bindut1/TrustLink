import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeVariant =
  | "neutral"
  | "info"
  | "success"
  | "warn"
  | "danger"
  | "accent";

const VARIANT: Record<BadgeVariant, string> = {
  neutral: "bg-surface-2 text-fg-muted border-border",
  info: "bg-accent/10 text-accent border-accent/25",
  success: "bg-success/10 text-success border-success/30",
  warn: "bg-warn/15 text-warn border-warn/30",
  danger: "bg-danger/10 text-danger border-danger/30",
  accent: "bg-accent/10 text-accent border-accent/25",
};

type BadgeProps = {
  variant?: BadgeVariant;
  className?: string;
  children: ReactNode;
};

export function Badge({ variant = "neutral", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[12px] font-medium leading-tight",
        VARIANT[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
