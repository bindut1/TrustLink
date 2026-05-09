import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const FIELD_BASE =
  "h-12 w-full rounded-lg bg-surface-1 px-4 text-[16px] text-fg placeholder:text-fg-faint " +
  "border transition-colors outline-none " +
  "hover:border-border-strong " +
  "focus:border-accent focus:ring-4 focus:ring-accent/15 " +
  "disabled:opacity-55 disabled:cursor-not-allowed";

const STATE = {
  default: "border-border",
  error: "border-danger focus:border-danger focus:ring-danger/15",
};

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(FIELD_BASE, invalid ? STATE.error : STATE.default, className)}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
});

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { invalid, className, children, ...rest },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        FIELD_BASE,
        "appearance-none pr-9 bg-no-repeat bg-[right_0.875rem_center] bg-[length:14px]",
        "bg-[image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%237E89AD%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22/></svg>')]",
        invalid ? STATE.error : STATE.default,
        className,
      )}
      aria-invalid={invalid || undefined}
      {...rest}
    >
      {children}
    </select>
  );
});
