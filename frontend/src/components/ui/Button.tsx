import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";

export type ButtonVariant =
  | "primary"
  | "verified"
  | "secondary"
  | "outline"
  | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-ctl font-semibold whitespace-nowrap transition-[background-color,border-color,color,box-shadow] duration-150 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/45 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-1 " +
  "disabled:opacity-55 disabled:cursor-not-allowed";

const VARIANT: Record<ButtonVariant, string> = {
  // Institutional navy — the default primary CTA (DESIGN_SPEC).
  primary:
    "bg-navy text-on-navy shadow-[0_1px_2px_rgba(11,27,58,0.18)] hover:bg-navy-700 active:bg-navy",
  // Teal — reserved for verified / on-chain actions only (Verify, Apply with
  // verified profile). Deeper teal-600 fill keeps white text AA-legible.
  verified:
    "bg-teal-600 text-white shadow-[0_1px_2px_rgba(12,151,164,0.25)] hover:brightness-110 active:brightness-95 focus-visible:ring-teal/50",
  secondary:
    "bg-surface-1 text-fg border border-border hover:border-border-strong hover:bg-surface-2",
  outline:
    "bg-transparent text-fg border border-border-strong hover:border-navy hover:text-navy",
  ghost:
    "bg-transparent text-fg-muted hover:bg-surface-2 hover:text-fg",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-[13.5px]",
  md: "h-11 px-5 text-[15px]",
  lg: "h-12 px-6 text-[16px]",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  block?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading,
      block,
      leftIcon,
      rightIcon,
      disabled,
      className,
      children,
      type = "button",
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(BASE, VARIANT[variant], SIZE[size], block && "w-full", className)}
        {...rest}
      >
        {loading ? <Spinner size={14} /> : leftIcon}
        <span>{children}</span>
        {!loading && rightIcon}
      </button>
    );
  },
);
