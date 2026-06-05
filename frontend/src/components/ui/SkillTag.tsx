import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * A skill chip. The `verified` variant (teal + check) marks a skill that is
 * backed by an on-chain credential — teal here carries the verified semantic,
 * never decoration. Plain skills render neutral slate.
 */
type SkillTagProps = {
  children: ReactNode;
  /** Skill is backed by a verified / on-chain credential. */
  verified?: boolean;
  size?: "sm" | "md";
  className?: string;
};

export function SkillTag({
  children,
  verified,
  size = "md",
  className,
}: SkillTagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md font-medium leading-tight whitespace-nowrap",
        size === "sm" ? "px-1.5 py-0.5 text-[11.5px]" : "px-2 py-1 text-[12.5px]",
        verified
          ? "bg-teal-050 text-teal border border-teal/20"
          : "bg-surface-2 text-fg-muted border border-border",
        className,
      )}
    >
      {verified && <Check size={12} strokeWidth={2.5} aria-hidden />}
      {children}
    </span>
  );
}
