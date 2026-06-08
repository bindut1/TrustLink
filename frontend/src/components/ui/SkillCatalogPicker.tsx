"use client";

import { X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { fetchSkillCatalog } from "@/lib/skills-api";
import type { SkillCatalogItem } from "@/types/issuer";

type SkillCatalogPickerProps = {
  value: string[]; // canonical tokens (skill_catalog.normalized)
  onChange: (next: string[]) => void;
  placeholder?: string;
};

/**
 * Controlled-vocabulary skill picker: only catalog skills (GET /skills) can be
 * added; stores the canonical `normalized` token.
 */
export function SkillCatalogPicker({
  value,
  onChange,
  placeholder,
}: SkillCatalogPickerProps) {
  const [catalog, setCatalog] = useState<SkillCatalogItem[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    fetchSkillCatalog()
      .then((c) => alive && setCatalog(c))
      .catch(() => alive && setCatalog([]));
    return () => {
      alive = false;
    };
  }, []);

  const byToken = useMemo(
    () => new Map(catalog.map((s) => [s.normalized, s])),
    [catalog],
  );

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const selected = new Set(value);
    return catalog
      .filter((s) => !selected.has(s.normalized))
      .filter((s) => {
        if (!q) return true;
        return (
          s.name.toLowerCase().includes(q) ||
          s.normalized.includes(q) ||
          (s.aliases ?? []).some((a) => a.toLowerCase().includes(q))
        );
      })
      .slice(0, 8);
  }, [catalog, query, value]);

  function add(token: string) {
    if (!value.includes(token)) onChange([...value, token]);
    setQuery("");
    setOpen(false);
  }

  function remove(token: string) {
    onChange(value.filter((t) => t !== token));
  }

  return (
    <div className="relative">
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (suggestions[0]) add(suggestions[0].normalized);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder={placeholder}
        autoComplete="off"
      />

      {open && suggestions.length > 0 && (
        <ul
          className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-border bg-surface-1 py-1 shadow-lg"
          onMouseDown={(e) => {
            // keep focus so onBlur doesn't close before click registers
            e.preventDefault();
            if (blurTimer.current) clearTimeout(blurTimer.current);
          }}
        >
          {suggestions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => add(s.normalized)}
                className="flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-[14px] text-fg hover:bg-surface-2"
              >
                <span>{s.name}</span>
                {s.category && (
                  <span className="text-[11px] uppercase tracking-wide text-fg-faint">
                    {s.category}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {value.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {value.map((token) => (
            <button
              type="button"
              key={token}
              onClick={() => remove(token)}
              className={cn(
                "group inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2/60 pl-3 pr-2 py-1 text-[13px] text-fg-muted",
                "hover:border-danger/40 hover:text-danger transition-colors",
              )}
            >
              {byToken.get(token)?.name ?? token}
              <X size={12} className="text-fg-faint group-hover:text-danger" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
