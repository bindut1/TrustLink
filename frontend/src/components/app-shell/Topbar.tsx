"use client";

import type { AuthUser } from "@/types/auth";
import { LanguageToggle } from "./LanguageToggle";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { usePageMeta } from "./page-meta";
import { UserMenu } from "./UserMenu";

type TopbarProps = {
  user: AuthUser;
};

export function Topbar({ user }: TopbarProps) {
  const { title, description } = usePageMeta();
  return (
    <header className="sticky top-0 z-20 h-16 px-5 sm:px-7 flex items-center gap-4 border-b border-border bg-canvas/85 backdrop-blur-md">
      <div className="min-w-0 flex-1">
        {title && (
          <h1 className="text-[18px] font-bold tracking-[-0.02em] text-fg leading-tight truncate">
            {title}
          </h1>
        )}
        {description && (
          <div className="text-[12.5px] text-fg-subtle leading-tight mt-0.5 truncate">
            {description}
          </div>
        )}
      </div>

      <LanguageToggle />
      <NotificationsDropdown enabled={!!user} />
      <UserMenu user={user} />
    </header>
  );
}
