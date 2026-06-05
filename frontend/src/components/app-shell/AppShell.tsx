"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useRequireRole } from "@/lib/use-require-role";
import type { UserRole } from "@/types/auth";
import { PageMetaProvider } from "./page-meta";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

type AppShellProps = {
  role: UserRole;
  children: ReactNode;
};

export function AppShell({ role, children }: AppShellProps) {
  const { user, ready, allowed } = useRequireRole(role);
  const pathname = usePathname();

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <span className="inline-block h-6 w-6 rounded-full border-2 border-navy border-r-transparent animate-spin" />
      </div>
    );
  }

  if (!allowed || !user) return null; // redirect already in flight

  return (
    <PageMetaProvider>
      <div className="min-h-screen flex bg-page">
        <Sidebar role={role} />
        <div className="flex-1 min-w-0 flex flex-col">
          <Topbar user={user} />
          <main className="flex-1 px-5 sm:px-7 py-7 sm:py-9 max-w-[1320px] w-full mx-auto">
            {/* Keyed by route so the entrance animation replays on navigation.
                Base opacity stays visible — animation only adds the rise-in. */}
            <div key={pathname} className="page-enter">
              {children}
            </div>
          </main>
        </div>
      </div>
    </PageMetaProvider>
  );
}
