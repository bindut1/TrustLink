import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Surface container — the canonical white card on the gray app canvas.
 * Radius/shadow follow DESIGN_SPEC (`--r-card`, `--shadow-card`).
 *
 * Composition:
 *   <Card>
 *     <CardHeader title="…" action={…} />
 *     <CardBody>…</CardBody>
 *   </Card>
 * Or pass children directly for a plain padded surface.
 */
type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** Remove inner padding (e.g. when the card wraps a Table edge-to-edge). */
  flush?: boolean;
  /** Subtle hover affordance for interactive cards. */
  interactive?: boolean;
};

export function Card({
  className,
  flush,
  interactive,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-border bg-canvas shadow-[var(--shadow-card)]",
        !flush && "p-5",
        interactive &&
          "transition-[transform,border-color,box-shadow] duration-150 hover:border-border-strong hover:-translate-y-0.5",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

type CardHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Right-aligned actions (buttons, links, filters). */
  action?: ReactNode;
  className?: string;
};

export function CardHeader({
  title,
  description,
  action,
  className,
}: CardHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 mb-4",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-[16px] font-semibold tracking-[-0.015em] text-fg leading-tight">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-[13px] text-fg-subtle leading-snug">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  );
}

export function CardBody({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("min-w-0", className)} {...rest} />;
}
