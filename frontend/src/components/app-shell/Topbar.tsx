"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { AuthUser } from "@/types/auth";
import { LanguageToggle } from "./LanguageToggle";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { UserMenu } from "./UserMenu";

type TopbarProps = {
  user: AuthUser;
  title?: string;
  description?: string;
};

export function Topbar({ user, title, description }: TopbarProps) {
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

      <LanguageToggle />
      <NotificationsDropdown enabled={!!user} />
      <UserMenu user={user} />
    </header>
  );
}
