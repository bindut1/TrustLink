"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useCurrentUser } from "./use-current-user";
import type { UserRole } from "@/types/auth";

/**
 * Client-side guard. Redirects to /login when no session, or to the right
 * dashboard when the user has the wrong role for the current segment.
 */
export function useRequireRole(role: UserRole) {
  const router = useRouter();
  const { user, ready } = useCurrentUser();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== role) {
      router.replace(`/${user.role}/dashboard`);
    }
  }, [ready, user, role, router]);

  return { user, ready, allowed: Boolean(user && user.role === role) };
}
