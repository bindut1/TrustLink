import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type AlertVariant = "error" | "success" | "info";

const VARIANT: Record<AlertVariant, { wrap: string; icon: ReactNode }> = {
  error: {
    wrap: "bg-danger/10 border-danger/30 text-danger",
    icon: <AlertCircle size={18} className="shrink-0 mt-0.5" />,
  },
  success: {
    wrap: "bg-success/10 border-success/30 text-success",
    icon: <CheckCircle2 size={18} className="shrink-0 mt-0.5" />,
  },
  info: {
    wrap: "bg-accent/10 border-accent/30 text-accent",
    icon: <Info size={18} className="shrink-0 mt-0.5" />,
  },
};

export type AlertProps = {
  variant?: AlertVariant;
  className?: string;
  children: ReactNode;
};

export function Alert({ variant = "info", className, children }: AlertProps) {
  const v = VARIANT[variant];
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3.5 text-[14.5px] leading-relaxed",
        v.wrap,
        className,
      )}
    >
      {v.icon}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
