"use client";

import { LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LanguageToggle } from "@/components/app-shell/LanguageToggle";
import { Logo } from "@/components/auth/Logo";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { clearSession } from "@/lib/auth-storage";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useCurrentUser } from "@/lib/use-current-user";
import type { AuthUser } from "@/types/auth";
import { PUBLIC_NAV } from "./site-config";

export function Header() {
  const { t } = useLanguage();
  const { user } = useCurrentUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto max-w-[1200px] flex items-center gap-6 px-5 sm:px-6 h-16">
        <Link
          href="/"
          aria-label={t("header.trustlinkHome")}
          className="flex items-center gap-2.5 shrink-0 hover:opacity-90 transition-opacity"
        >
          <Logo size={28} />
          <span className="text-[18px] font-bold tracking-[-0.025em] text-fg">
            TrustLink
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 flex-1">
          {PUBLIC_NAV.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2 shrink-0">
          <LanguageToggle />
          {user ? <UserMenu user={user} /> : <GuestActions />}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden ml-auto inline-flex h-10 w-10 items-center justify-center rounded-md text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
          aria-label={mobileOpen ? t("header.closeMenu") : t("header.openMenu")}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-canvas">
          <nav className="mx-auto max-w-[1200px] flex flex-col px-5 py-4 gap-1">
            {PUBLIC_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 text-[15px] font-medium text-fg-muted hover:text-fg hover:bg-surface-2 rounded-md transition-colors"
              >
                {t(item.labelKey)}
              </Link>
            ))}
            <div className="mt-3 pt-3 border-t border-border flex flex-col gap-2">
              <div className="px-1">
                <LanguageToggle />
              </div>
              {user ? (
                <MobileUserActions user={user} />
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="secondary" size="md" block>
                      {t("header.signIn")}
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)}>
                    <Button size="md" block>
                      {t("header.getStarted")}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "px-3 h-9 inline-flex items-center text-[14px] font-medium",
        "text-fg-muted hover:text-fg rounded-md hover:bg-surface-2 transition-colors",
      )}
    >
      {children}
    </Link>
  );
}

function GuestActions() {
  const { t } = useLanguage();
  return (
    <>
      <Link href="/login">
        <Button variant="ghost" size="md">
          {t("header.signIn")}
        </Button>
      </Link>
      <Link href="/register">
        <Button size="md">{t("header.getStarted")}</Button>
      </Link>
    </>
  );
}

function UserMenu({ user }: { user: AuthUser }) {
  const { t } = useLanguage();
  const router = useRouter();
  const initials = getInitials(user.fullName);
  const roleKey = `role.${user.role}` as const;

  function handleSignOut() {
    clearSession();
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2.5 pl-2 border-l border-border">
      <span
        aria-hidden
        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-accent text-[12.5px] font-semibold"
      >
        {initials}
      </span>
      <div className="hidden lg:flex flex-col leading-tight">
        <span className="text-[13px] font-semibold text-fg">{user.fullName}</span>
        <span className="text-[11.5px] text-fg-subtle">{t(roleKey)}</span>
      </div>
      <button
        type="button"
        onClick={handleSignOut}
        title={t("header.signOut")}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-fg-subtle hover:text-fg hover:bg-surface-2 transition-colors"
      >
        <LogOut size={16} />
      </button>
    </div>
  );
}

function MobileUserActions({ user }: { user: AuthUser }) {
  const { t } = useLanguage();
  const router = useRouter();
  const roleKey = `role.${user.role}` as const;
  return (
    <>
      <div className="flex items-center gap-3 px-3 py-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent text-[13px] font-semibold">
          {getInitials(user.fullName)}
        </span>
        <div className="flex flex-col leading-tight">
          <span className="text-[14px] font-semibold text-fg">{user.fullName}</span>
          <span className="text-[12px] text-fg-subtle">{t(roleKey)}</span>
        </div>
      </div>
      <Button
        variant="secondary"
        size="md"
        block
        leftIcon={<LogOut size={14} />}
        onClick={() => {
          clearSession();
          router.refresh();
        }}
      >
        {t("header.signOut")}
      </Button>
    </>
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
