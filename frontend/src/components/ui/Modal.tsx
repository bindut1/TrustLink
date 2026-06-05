"use client";

import { X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: ReactNode;
  size?: "md" | "lg";
  children: ReactNode;
  footer?: ReactNode;
};

const SIZE = {
  md: "max-w-[480px]",
  lg: "max-w-[640px]",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
  footer,
}: ModalProps) {
  const { t } = useLanguage();
  // Portal target is only available on the client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // ESC to close + lock body scroll while open
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
      aria-labelledby={title ? "modal-title" : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(15,23,42,0.45)] backdrop-blur-sm animate-[fade-in_0.16s_ease-out]"
      />
      <div
        className={cn(
          "relative w-full rounded-2xl border border-border bg-canvas shadow-[0_24px_48px_-12px_rgba(15,23,42,0.30)] animate-[modal-in_0.2s_cubic-bezier(0.2,0.8,0.2,1)] flex flex-col max-h-[90vh]",
          SIZE[size],
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-border">
            <div className="min-w-0 flex-1">
              {title && (
                <h2
                  id="modal-title"
                  className="text-[19px] font-bold tracking-[-0.02em] text-fg leading-tight"
                >
                  {title}
                </h2>
              )}
              {description && (
                <div className="mt-1.5 text-[14px] text-fg-muted leading-relaxed">
                  {description}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("a11y.close")}
              className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-md text-fg-subtle hover:text-fg hover:bg-surface-2 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-surface-2/50">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
