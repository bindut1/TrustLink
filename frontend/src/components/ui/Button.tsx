import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-1 " +
  "disabled:opacity-55 disabled:cursor-not-allowed";

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-[#0A0E1A] font-semibold shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_4px_16px_rgba(37,201,208,0.28)] hover:brightness-110 active:brightness-95",
  secondary:
    "bg-surface-1 text-fg border border-border hover:border-border-strong hover:bg-surface-2",
  ghost:
    "bg-transparent text-fg-muted hover:bg-surface-2 hover:text-fg",
};

const SIZE: Record<ButtonSize, string> = {
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
