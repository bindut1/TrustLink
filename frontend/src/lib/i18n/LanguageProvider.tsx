"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LANG,
  LANG_COOKIE_KEY,
  LANG_COOKIE_MAX_AGE,
  LANG_STORAGE_KEY,
} from "./config";
import {
  TRANSLATIONS,
  type Language,
  type TranslationKey,
} from "./translations";

type LanguageContextValue = {
  lang: Language;
  setLang: (next: Language) => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function isLanguage(value: string | null | undefined): value is Language {
  return value === "vi" || value === "en";
}

function readCookieLang(): Language | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${LANG_COOKIE_KEY}=([^;]+)`),
  );
  const value = match ? decodeURIComponent(match[1]) : null;
  return isLanguage(value) ? value : null;
}

function writeCookieLang(lang: Language) {
  if (typeof document === "undefined") return;
  document.cookie = `${LANG_COOKIE_KEY}=${lang}; path=/; max-age=${LANG_COOKIE_MAX_AGE}; samesite=lax`;
}

export function LanguageProvider({
  children,
  initialLang,
}: {
  children: ReactNode;
  initialLang?: Language;
}) {
  // Server passes the lang it read from the cookie. Hydration matches because
  // client mounts with the same value — no flash.
  const [lang, setLangState] = useState<Language>(initialLang ?? DEFAULT_LANG);

  // One-time migration for users who only have the legacy localStorage value
  // and no cookie yet. Runs after first paint; will cause a single flash on
  // the very first visit post-migration, then never again.
  useEffect(() => {
    if (readCookieLang()) return;
    const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (isLanguage(stored)) {
      writeCookieLang(stored);
      if (stored !== lang) setLangState(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANG_STORAGE_KEY, next);
    }
    writeCookieLang(next);
  }, []);

  const t = useCallback(
    (key: TranslationKey) => TRANSLATIONS[lang][key] ?? key,
    [lang],
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Fallback if used outside provider — return defaults so components don't crash
    return {
      lang: DEFAULT_LANG,
      setLang: () => {},
      t: (key) => TRANSLATIONS[DEFAULT_LANG][key] ?? key,
    };
  }
  return ctx;
}
