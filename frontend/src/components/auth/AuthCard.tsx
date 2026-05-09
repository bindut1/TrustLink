import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type AuthCardProps = {
  size?: "md" | "lg";
  className?: string;
  children: ReactNode;
};

const SIZE = {
  md: "max-w-[440px]",
  lg: "max-w-[560px]",
};

/**
 * Card container for auth flows. Other modules can reuse this as a generic
 * "centered surface" container by importing it directly.
 */
export function AuthCard({ size = "md", className, children }: AuthCardProps) {
  return (
    <div
      className={cn(
        "w-full rounded-2xl border border-border bg-surface-1 p-7 sm:p-8",
        "shadow-[var(--shadow-card)]",
        SIZE[size],
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Optional bottom-of-card row used for "New here? Create an account" links. */
export function AuthCardFooter({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mt-7 pt-6 border-t border-border text-[14.5px] text-fg-subtle text-center",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Eyebrow label that opens a section inside a form (e.g. "Account details"). */
export function AuthSectionLabel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 text-[12px] uppercase tracking-[0.10em] font-semibold text-fg-subtle",
        className,
      )}
    >
      <span className="h-px flex-1 bg-border" aria-hidden />
      <span>{children}</span>
      <span className="h-px flex-1 bg-border" aria-hidden />
    </div>
  );
}
