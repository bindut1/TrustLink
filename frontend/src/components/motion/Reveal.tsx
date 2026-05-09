"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type RevealProps = {
  children: ReactNode;
  /** Delay in ms before the reveal transition starts (used for stagger). */
  delay?: number;
  /** Direction the element travels in from. */
  from?: "bottom" | "left" | "right" | "fade";
  /** Custom className applied to the wrapper. */
  className?: string;
  /** Render as inline element (default `<div>`). */
  as?: "div" | "span" | "section" | "li";
};

const FROM_OFFSCREEN: Record<NonNullable<RevealProps["from"]>, string> = {
  bottom: "translate-y-8",
  left: "-translate-x-8",
  right: "translate-x-8",
  fade: "",
};

/**
 * Fades + translates children into view when they enter the viewport.
 * Uses a single IntersectionObserver per instance and disconnects after the
 * first reveal so it never re-animates on scroll-back. Lightweight, no deps.
 */
export function Reveal({
  children,
  delay = 0,
  from = "bottom",
  className,
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect prefers-reduced-motion → reveal immediately.
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) {
      setVisible(true);
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "transition-all duration-700 ease-out will-change-[opacity,transform]",
        visible ? "opacity-100 translate-y-0 translate-x-0" : `opacity-0 ${FROM_OFFSCREEN[from]}`,
        className,
      )}
    >
      {children}
    </Tag>
  );
}
