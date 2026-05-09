import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-7",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-[26px] sm:text-[28px] font-bold tracking-[-0.025em] leading-tight text-fg">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-[14.5px] text-fg-muted leading-relaxed max-w-[68ch]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
