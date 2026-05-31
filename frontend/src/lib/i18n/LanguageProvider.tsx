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
  TRANSLATIONS,
  type Language,
  type TranslationKey,
} from "./translations";

const STORAGE_KEY = "trustlink.lang";
const DEFAULT_LANG: Language = "vi";

type LanguageContextValue = {
  lang: Language;
  setLang: (next: Language) => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readStoredLang(): Language {
  if (typeof window === "undefined") return DEFAULT_LANG;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "en" || stored === "vi" ? stored : DEFAULT_LANG;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Start with default to avoid hydration mismatch — hydrate from storage in effect.
  const [lang, setLangState] = useState<Language>(DEFAULT_LANG);

  useEffect(() => {
    const stored = readStoredLang();
    if (stored !== DEFAULT_LANG) setLangState(stored);
  }, []);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
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
