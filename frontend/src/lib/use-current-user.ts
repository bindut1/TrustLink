"use client";

import { useEffect, useState } from "react";
import { USER_CHANGED_EVENT, getCurrentUser } from "./auth-storage";
import type { AuthUser } from "@/types/auth";

/**
 * Reads the current user from localStorage. Returns `null` until the client
 * has mounted to avoid SSR/CSR hydration mismatch — components should render
 * the unauthenticated branch as the safe default for the initial render.
 *
 * Re-reads on `USER_CHANGED_EVENT` (same-tab writes) and the native `storage`
 * event (other tabs), so the shell stays in sync after profile mutations.
 */
export function useCurrentUser() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setUser(getCurrentUser());
    sync();
    setReady(true);
    window.addEventListener(USER_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(USER_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { user, ready };
}
