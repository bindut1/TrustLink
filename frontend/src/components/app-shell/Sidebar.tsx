"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/auth/Logo";
import { cn } from "@/lib/cn";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  NAV_BY_ROLE,
  WORKSPACE_KEY,
  isNavGroup,
  type NavGroup,
  type NavLeaf,
} from "./nav-config";
import type { UserRole } from "@/types/auth";

type SidebarProps = { role: UserRole };

export function Sidebar({ role }: SidebarProps) {
  const sections = NAV_BY_ROLE[role];
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <aside className="hidden md:flex w-[248px] shrink-0 flex-col border-r border-border bg-canvas">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border">
        <Logo size={26} />
        <div className="leading-tight">
          <div className="text-[15px] font-bold tracking-[-0.02em] text-fg">
            TrustLink
          </div>
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-fg-subtle">
            {t(WORKSPACE_KEY[role])}
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-5">
        {sections.map((section, i) => (
          <div key={i} className="flex flex-col gap-0.5">
            {section.labelKey && (
              <div className="px-3 mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.10em] text-fg-faint">
                {t(section.labelKey)}
              </div>
            )}
            {section.items.map((item) =>
              isNavGroup(item) ? (
                <CollapsibleGroup
                  key={item.labelKey}
                  group={item}
                  pathname={pathname}
                />
              ) : (
                <LeafLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                />
              ),
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}

function LeafLink({
  item,
  pathname,
  indent = false,
}: {
  item: NavLeaf;
  pathname: string;
  indent?: boolean;
}) {
  const { t } = useLanguage();
  const Icon = item.icon;
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  return (
    <Link
      href={item.href}
      className={cn(
        "relative flex items-center gap-2.5 h-9 rounded-md text-[14px] font-medium transition-colors",
        indent ? "pl-9 pr-3" : "px-3",
        active
          ? "bg-accent/10 text-fg"
          : "text-fg-muted hover:text-fg hover:bg-surface-2",
      )}
    >
      {active && (
        <span
          aria-hidden
          className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-accent"
        />
      )}
      <Icon
        size={indent ? 14 : 16}
        className={active ? "text-accent" : "text-fg-subtle"}
        strokeWidth={1.75}
      />
      <span>{t(item.labelKey)}</span>
    </Link>
  );
}

function CollapsibleGroup({
  group,
  pathname,
}: {
  group: NavGroup;
  pathname: string;
}) {
  const { t } = useLanguage();
  const Icon = group.icon;
  const containsActive = group.children.some(
    (c) => pathname === c.href || pathname.startsWith(`${c.href}/`),
  );
  const [open, setOpen] = useState(containsActive);

  // Auto-open whenever the route moves into the group.
  useEffect(() => {
    if (containsActive) setOpen(true);
  }, [containsActive]);

  return (
    <div className="flex flex-col gap-0.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          "flex items-center gap-2.5 h-9 px-3 rounded-md text-[14px] font-medium transition-colors w-full",
          containsActive
            ? "text-fg"
            : "text-fg-muted hover:text-fg hover:bg-surface-2",
        )}
      >
        <Icon
          size={16}
          className={containsActive ? "text-accent" : "text-fg-subtle"}
          strokeWidth={1.75}
        />
        <span className="flex-1 text-left">{t(group.labelKey)}</span>
        <ChevronDown
          size={14}
          className={cn(
            "text-fg-subtle transition-transform",
            open ? "rotate-0" : "-rotate-90",
          )}
        />
      </button>
      {open && (
        <div className="flex flex-col gap-0.5">
          {group.children.map((child) => (
            <LeafLink
              key={child.href}
              item={child}
              pathname={pathname}
              indent
            />
          ))}
        </div>
      )}
    </div>
  );
}
