"use client";

import { Bell, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { clearSession } from "@/lib/auth-storage";
import type { AuthUser } from "@/types/auth";

type TopbarProps = {
  user: AuthUser;
  title?: string;
  description?: string;
};

export function Topbar({ user, title, description }: TopbarProps) {
  const router = useRouter();
  const initials = getInitials(user.fullName);

  function handleSignOut() {
    clearSession();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-20 h-16 px-5 sm:px-7 flex items-center gap-4 border-b border-border bg-canvas/85 backdrop-blur-md">
      <div className="min-w-0 flex-1">
        {title && (
          <div className="text-[16px] font-semibold tracking-[-0.015em] text-fg leading-tight truncate">
            {title}
          </div>
        )}
        {description && (
          <div className="text-[12.5px] text-fg-subtle leading-tight mt-0.5 truncate">
            {description}
          </div>
        )}
      </div>

      <button
        type="button"
        title="Notifications"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
      >
        <Bell size={18} />
      </button>

      <div className="flex items-center gap-2.5 pl-3 border-l border-border">
        <span
          aria-hidden
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent text-[12.5px] font-semibold"
        >
          {initials}
        </span>
        <div className="hidden lg:flex flex-col leading-tight">
          <span className="text-[13px] font-semibold text-fg">
            {user.fullName}
          </span>
          <span className="text-[11.5px] text-fg-subtle capitalize">
            {user.role}
          </span>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          title="Sign out"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-fg-subtle hover:text-fg hover:bg-surface-2 transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
