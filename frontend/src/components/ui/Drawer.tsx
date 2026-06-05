"use client";

import { X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

/**
 * Right-side sheet for detail views (credential detail, candidate profile…).
 * Portaled to <body> so an ancestor transform can never re-anchor it, ESC +
 * backdrop click to close, body-scroll locked while open. Slide-in is
 * transform/opacity only and never gates content visibility.
 */
export type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  /** Sticky footer actions. */
  footer?: ReactNode;
  width?: number;
  children: ReactNode;
};

export function Drawer({
  open,
  onClose,
  title,
  description,
  footer,
  width = 480,
  children,
}: DrawerProps) {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "drawer-title" : undefined}
      className="fixed inset-0 z-50 flex justify-end"
    >
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(11,27,58,0.45)] backdrop-blur-sm animate-[fade-in_0.16s_ease-out]"
      />
      <div
        className="relative flex h-full w-full max-w-full flex-col bg-canvas shadow-[-12px_0_48px_-12px_rgba(11,27,58,0.30)] animate-[drawer-in_0.22s_cubic-bezier(0.2,0.7,0.2,1)]"
        style={{ width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-border">
          <div className="min-w-0 flex-1">
            {title && (
              <h2
                id="drawer-title"
                className="text-[18px] font-bold tracking-[-0.02em] text-fg leading-tight"
              >
                {title}
              </h2>
            )}
            {description && (
              <div className="mt-1 text-[13px] text-fg-subtle leading-snug">
                {description}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("a11y.close")}
            className={cn(
              "shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-md text-fg-subtle",
              "hover:text-fg hover:bg-surface-2 transition-colors",
            )}
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div className="flex items-center gap-2 px-6 py-4 border-t border-border bg-surface-2/50">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
