import { cn } from "@/lib/cn";

type SpinnerProps = {
  size?: number;
  className?: string;
};

export function Spinner({ size = 16, className }: SpinnerProps) {
  return (
    <span
      className={cn(
        "inline-block animate-spin rounded-full border-2 border-current border-r-transparent",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}
