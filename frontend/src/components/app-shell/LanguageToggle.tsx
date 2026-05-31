"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";

/**
 * Compact pill button in the dashboard topbar that flips between Vietnamese
 * (default) and English. Clicking toggles immediately and the choice persists
 * via LanguageProvider → localStorage.
 */
export function LanguageToggle() {
  const { lang, setLang, t } = useLanguage();
  const next = lang === "vi" ? "en" : "vi";
  const flag = lang === "vi" ? "🇻🇳" : "🇬🇧";
  const code = lang.toUpperCase();

  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      title={t("a11y.toggleLanguage")}
      aria-label={t("a11y.toggleLanguage")}
      className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-[12.5px] font-semibold text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
    >
      <span aria-hidden className="text-[15px] leading-none">
        {flag}
      </span>
      <span>{code}</span>
    </button>
  );
}
