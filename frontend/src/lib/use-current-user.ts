"use client";

import { useEffect, useState } from "react";
import { getCurrentUser } from "./auth-storage";
import type { AuthUser } from "@/types/auth";

/**
 * Reads the current user from localStorage. Returns `null` until the client
 * has mounted to avoid SSR/CSR hydration mismatch — components should render
 * the unauthenticated branch as the safe default for the initial render.
 */
export function useCurrentUser() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(getCurrentUser());
    setReady(true);
  }, []);

  return { user, ready };
}
