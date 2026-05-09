"use client";

import type { ReactNode } from "react";
import { useRequireRole } from "@/lib/use-require-role";
import type { UserRole } from "@/types/auth";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

type AppShellProps = {
  role: UserRole;
  /** Optional page-level chrome rendered in the topbar */
  pageTitle?: string;
  pageDescription?: string;
  children: ReactNode;
};

export function AppShell({
  role,
  pageTitle,
  pageDescription,
  children,
}: AppShellProps) {
  const { user, ready, allowed } = useRequireRole(role);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-2">
        <span className="inline-block h-6 w-6 rounded-full border-2 border-accent border-r-transparent animate-spin" />
      </div>
    );
  }

  if (!allowed || !user) return null; // redirect already in flight

  return (
    <div className="min-h-screen flex bg-surface-2/40">
      <Sidebar role={role} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar user={user} title={pageTitle} description={pageDescription} />
        <main className="flex-1 px-5 sm:px-7 py-7 sm:py-9">{children}</main>
      </div>
    </div>
  );
}
