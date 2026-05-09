"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/auth/Logo";
import { cn } from "@/lib/cn";
import { NAV_BY_ROLE, ROLE_LABEL } from "./nav-config";
import type { UserRole } from "@/types/auth";

type SidebarProps = { role: UserRole };

export function Sidebar({ role }: SidebarProps) {
  const sections = NAV_BY_ROLE[role];
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-[248px] shrink-0 flex-col border-r border-border bg-canvas">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border">
        <Logo size={26} />
        <div className="leading-tight">
          <div className="text-[15px] font-bold tracking-[-0.02em] text-fg">
            TrustLink
          </div>
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-fg-subtle">
            {ROLE_LABEL[role]}
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-5">
        {sections.map((section, i) => (
          <div key={i} className="flex flex-col gap-0.5">
            {section.label && (
              <div className="px-3 mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.10em] text-fg-faint">
                {section.label}
              </div>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-2.5 h-9 px-3 rounded-md text-[14px] font-medium transition-colors",
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
                    size={16}
                    className={active ? "text-accent" : "text-fg-subtle"}
                    strokeWidth={1.75}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
