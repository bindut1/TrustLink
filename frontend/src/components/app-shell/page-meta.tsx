"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Page meta drives the topbar title/subtitle (DESIGN_SPEC §2: "White topbar:
 * page title + subtitle on the left"). Pages declare their title via
 * `useSetPageMeta()`; the Topbar renders it. This keeps the title in the topbar
 * band — matching the screenshots — instead of repeating a large H1 in content.
 *
 * Pages that have not adopted this yet simply leave the topbar title empty;
 * nothing breaks.
 */
export type PageMeta = {
  title?: string;
  description?: string;
};

type PageMetaContextValue = {
  meta: PageMeta;
  setMeta: (meta: PageMeta) => void;
};

const PageMetaContext = createContext<PageMetaContextValue | null>(null);

export function PageMetaProvider({ children }: { children: ReactNode }) {
  const [meta, setMeta] = useState<PageMeta>({});
  const value = useMemo(() => ({ meta, setMeta }), [meta]);
  return (
    <PageMetaContext.Provider value={value}>
      {children}
    </PageMetaContext.Provider>
  );
}

export function usePageMeta(): PageMeta {
  return useContext(PageMetaContext)?.meta ?? {};
}

/**
 * Declare the current page's topbar title/subtitle. Re-runs when the localized
 * strings change (e.g. on language switch). Clears on unmount.
 */
export function useSetPageMeta(title?: string, description?: string) {
  const ctx = useContext(PageMetaContext);
  useEffect(() => {
    if (!ctx) return;
    ctx.setMeta({ title, description });
    return () => ctx.setMeta({});
    // ctx.setMeta is stable (useState setter wrapped in useMemo value).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description]);
}
