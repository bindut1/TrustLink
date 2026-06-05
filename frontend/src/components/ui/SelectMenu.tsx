"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { cn } from "@/lib/cn";

/**
 * Styled, accessible single-select dropdown (listbox pattern) — a replacement
 * for native `<select>` in filter/control contexts where we want the menu
 * itself styled (native option lists can't be themed).
 *
 * Keyboard: Enter/Space/↓ open; ↑/↓ move; Enter select; Esc/Tab close.
 * Closes on outside click. Menu animates in with `animate-pop-in`
 * (transform/opacity, 150ms) and is never visibility-gated.
 */
export type SelectOption = {
  value: string;
  label: string;
};

type SelectMenuProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** Accessible name for the control (e.g. "Filter by role"). */
  ariaLabel?: string;
  placeholder?: string;
  className?: string;
  /** Width of the popover; defaults to matching the trigger. */
  menuClassName?: string;
};

export function SelectMenu({
  value,
  onChange,
  options,
  ariaLabel,
  placeholder,
  className,
  menuClassName,
}: SelectMenuProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // When opening, focus the active option for keyboard nav.
  useEffect(() => {
    if (open) {
      setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
      // Focus the list so arrow keys work immediately.
      requestAnimationFrame(() => listRef.current?.focus());
    }
  }, [open, selectedIndex]);

  function commit(i: number) {
    const opt = options[i];
    if (opt) onChange(opt.value);
    setOpen(false);
  }

  function onTriggerKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  }

  function onListKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, options.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        commit(activeIndex);
        break;
      case "Escape":
      case "Tab":
        setOpen(false);
        break;
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-ctl border bg-surface-1 px-3.5 text-[14px] text-fg",
          "transition-colors duration-150 outline-none hover:border-border-strong",
          "focus-visible:border-navy focus-visible:ring-4 focus-visible:ring-navy/12",
          open ? "border-navy ring-4 ring-navy/12" : "border-border",
        )}
      >
        <span className={cn("truncate", !selected && "text-fg-faint")}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          size={16}
          className={cn(
            "shrink-0 text-fg-subtle transition-transform duration-150",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          aria-activedescendant={`${listboxId}-${activeIndex}`}
          onKeyDown={onListKeyDown}
          className={cn(
            "animate-pop-in absolute z-30 mt-1.5 max-h-72 w-full overflow-auto rounded-ctl border border-border bg-canvas p-1 shadow-[var(--shadow-card)] outline-none",
            menuClassName,
          )}
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === value;
            const isActive = i === activeIndex;
            return (
              <li
                key={opt.value}
                id={`${listboxId}-${i}`}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => commit(i)}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 text-[14px] leading-tight",
                  isActive ? "bg-surface-2 text-fg" : "text-fg-muted",
                  isSelected && "font-semibold text-fg",
                )}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && (
                  <Check size={15} strokeWidth={2.25} className="shrink-0 text-navy" />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
