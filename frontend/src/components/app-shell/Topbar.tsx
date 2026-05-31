"use client";

import { Bell } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { AuthUser } from "@/types/auth";
import { LanguageToggle } from "./LanguageToggle";
import { UserMenu } from "./UserMenu";

type TopbarProps = {
  user: AuthUser;
  title?: string;
  description?: string;
};

export function Topbar({ user, title, description }: TopbarProps) {
  const { t } = useLanguage();
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

      <button
        type="button"
        title={t("a11y.notifications")}
        aria-label={t("a11y.notifications")}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
      >
        <Bell size={18} />
      </button>

      <UserMenu user={user} />
    </header>
  );
}
