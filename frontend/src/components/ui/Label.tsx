import type { LabelHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  required?: boolean;
};

export function Label({
  required,
  className,
  children,
  ...rest
}: LabelProps) {
  return (
    <label
      className={cn(
        "text-[14.5px] font-medium text-fg leading-none",
        className,
      )}
      {...rest}
    >
      {children}
      {required && <span className="text-accent ml-0.5">*</span>}
    </label>
  );
}
