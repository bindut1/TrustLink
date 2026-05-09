import Link from "next/link";
import { Logo } from "@/components/auth/Logo";
import { FOOTER_COLUMNS, SOCIAL_LINKS } from "./site-config";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-border bg-surface-2">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-6 py-14 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10 mb-12">
          <div className="col-span-2">
            <Link
              href="/"
              aria-label="TrustLink home"
              className="inline-flex items-center gap-2.5 mb-4"
            >
              <Logo size={28} />
              <span className="text-[18px] font-bold tracking-[-0.025em] text-fg">
                TrustLink
              </span>
            </Link>
            <p className="text-[14px] text-fg-muted leading-relaxed max-w-[34ch]">
              Verifiable credentials and AI-powered hiring for the modern
              workforce. Anchor truth on-chain.
            </p>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-[12px] uppercase tracking-[0.10em] font-semibold text-fg-subtle mb-4">
                {col.title}
              </h3>
              <ul className="flex flex-col gap-3">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-[14px] text-fg-muted hover:text-fg transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-8 border-t border-border">
          <p className="text-[13px] text-fg-subtle">
            © {year} TrustLink. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-[13px]">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-fg-subtle hover:text-fg transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
