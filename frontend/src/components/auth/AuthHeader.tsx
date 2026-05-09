import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type AuthHeaderProps = {
  title: string;
  subtitle?: ReactNode;
  /** Visual size — wider cards use `lg`. */
  size?: "md" | "lg";
  className?: string;
};

const TITLE_SIZE = {
  md: "text-[26px] sm:text-[28px] leading-[1.15] tracking-[-0.02em]",
  lg: "text-[28px] sm:text-[32px] leading-[1.12] tracking-[-0.022em]",
};

export function AuthHeader({
  title,
  subtitle,
  size = "md",
  className,
}: AuthHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <h1 className={cn(TITLE_SIZE[size], "font-bold text-fg")}>{title}</h1>
      {subtitle && (
        <p className="text-[15.5px] text-fg-muted leading-[1.55] max-w-[44ch]">
          {subtitle}
        </p>
      )}
    </div>
  );
}
