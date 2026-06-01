"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { clearSession } from "@/lib/auth-storage";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { AuthUser } from "@/types/auth";

type Props = {
  user: AuthUser;
};

/**
 * Avatar dropdown in the top-right of the app shell. Shows user identity and
 * sign-out only — settings (password, language) live in the sidebar.
 */
export function UserMenu({ user }: Props) {
  const router = useRouter();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const roleKey = `role.${user.role}` as const;

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function handleSignOut() {
    clearSession();
    router.replace("/login");
  }

  return (
    <div
      ref={menuRef}
      className="relative flex items-center gap-2.5 pl-3 border-l border-border"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2.5 rounded-md hover:bg-surface-2 transition-colors px-1.5 py-1 -ml-1.5"
      >
        <Avatar name={user.fullName} src={user.avatarUrl} size={36} />
        <div className="hidden lg:flex flex-col leading-tight items-start">
          <span className="text-[13px] font-semibold text-fg">
            {user.fullName}
          </span>
          <span className="text-[11.5px] text-fg-subtle">{t(roleKey)}</span>
        </div>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-border bg-canvas shadow-[0_18px_36px_-8px_rgba(15,23,42,0.20)] overflow-hidden z-30"
        >
          <div className="px-4 py-3 border-b border-border bg-surface-2/40">
            <div className="text-[11px] uppercase tracking-[0.08em] text-fg-subtle font-semibold">
              {t("menu.signedInAs")}
            </div>
            <div className="mt-1 text-[14px] font-semibold text-fg truncate">
              {user.fullName}
            </div>
            <div className="text-[12.5px] text-fg-subtle truncate">
              {user.email}
            </div>
            <div className="mt-1 inline-block text-[11px] text-accent bg-accent/10 px-2 py-0.5 rounded-full">
              {t(roleKey)}
            </div>
          </div>

          <div className="px-2 py-2">
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[14px] text-danger hover:bg-danger/10 transition-colors"
            >
              <LogOut size={15} />
              {t("menu.signOut")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
