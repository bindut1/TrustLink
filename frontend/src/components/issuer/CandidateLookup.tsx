"use client";

import { CheckCircle2, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { FormField } from "@/components/ui/FormField";
import { cn } from "@/lib/cn";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { searchCandidates } from "@/lib/issuer-api";
import type { CandidateLookupResult } from "@/types/issuer";

type Props = {
  value: CandidateLookupResult | null;
  onChange: (next: CandidateLookupResult | null) => void;
};

export function CandidateLookup({ value, onChange }: Props) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CandidateLookupResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  // Debounced search
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (query.trim().length < 1) {
      setResults([]);
      setOpen(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchCandidates(query.trim());
        setResults(data);
        setOpen(data.length > 0);
        setActiveIdx(-1);
      } catch {
        setResults([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  function select(candidate: CandidateLookupResult) {
    onChange(candidate);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  function clear() {
    onChange(null);
    setQuery("");
    setResults([]);
    setOpen(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx >= 0) select(results[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  // Already selected
  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/[0.06] px-4 py-3">
        <CheckCircle2 size={18} className="shrink-0 text-success" />
        <Avatar name={value.fullName} src={value.avatarUrl} size={36} />
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold text-fg leading-snug">
            {value.fullName}
          </div>
          <div className="text-[12px] text-fg-subtle font-mono truncate">
            {value.email}
          </div>
        </div>
        <button
          type="button"
          onClick={clear}
          title={t("candLookup.change")}
          className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-md text-fg-subtle hover:text-fg hover:bg-surface-2 transition-colors"
        >
          <X size={15} />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <FormField
        label={t("candLookup.label")}
        required
      >
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle">
            {loading ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Search size={15} />
            )}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder={t("candLookup.placeholder")}
            autoComplete="off"
            className="h-11 w-full rounded-lg border border-border bg-surface-1 pl-9 pr-4 text-[15px] text-fg placeholder:text-fg-faint focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-colors"
          />
        </div>
      </FormField>

      {open && results.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-border bg-canvas shadow-[0_12px_32px_-8px_rgba(15,23,42,0.22)]"
        >
          {results.map((r, i) => (
            <li key={r.id} role="option" aria-selected={i === activeIdx}>
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault(); // prevent input blur before click registers
                  select(r);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                  i === activeIdx
                    ? "bg-accent/10"
                    : "hover:bg-surface-2",
                )}
              >
                <Avatar name={r.fullName} src={r.avatarUrl} size={34} />
                <div className="min-w-0">
                  <div className="text-[14px] font-medium text-fg truncate">
                    {r.fullName}
                  </div>
                  <div className="text-[12px] text-fg-subtle font-mono truncate">
                    {r.email}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!open && query.trim().length >= 1 && !loading && results.length === 0 && (
        <p className="mt-2 text-[13px] text-fg-subtle">
          {t("candLookup.notFound")}
        </p>
      )}
    </div>
  );
}
