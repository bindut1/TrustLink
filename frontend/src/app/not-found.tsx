"use client";

import { ArrowLeft, Home, LogIn, Sparkles, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/auth/Logo";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { ReactNode } from "react";

export default function NotFound() {
  const { t } = useLanguage();
  const router = useRouter();

  return (
    <div className="landing-bg relative flex min-h-screen flex-col">
      <header className="border-b border-border bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center px-5 sm:px-6">
          <Link
            href="/"
            aria-label={t("header.trustlinkHome")}
            className="flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <Logo size={28} />
            <span className="text-[18px] font-bold tracking-[-0.025em] text-fg">
              TrustLink
            </span>
          </Link>
        </div>
      </header>

      <main className="relative flex flex-1 items-center justify-center px-5 py-16 sm:px-6">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div
            aria-hidden
            className="absolute left-1/2 top-[12%] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-accent/12 blur-[120px]"
          />
        </div>

        <div className="mx-auto flex w-full max-w-[640px] flex-col items-center text-center">
          <h1
            aria-hidden
            className="select-none bg-gradient-to-b from-fg via-fg to-fg-subtle/40 bg-clip-text text-[120px] font-extrabold leading-none tracking-[-0.06em] text-transparent sm:text-[160px]"
          >
            404
          </h1>

          <h2 className="mt-4 text-[26px] font-bold tracking-[-0.02em] text-fg sm:text-[32px]">
            {t("notFound.title")}
          </h2>

          <p className="mt-3 max-w-[520px] text-[15px] leading-relaxed text-fg-muted sm:text-[16px]">
            {t("notFound.description")}
          </p>

          <div className="mt-8 flex w-full flex-col items-center gap-2.5 sm:w-auto sm:flex-row sm:gap-3">
            <Link
              href="/"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 text-[16px] font-semibold text-[#0A0E1A] shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_4px_16px_rgba(37,201,208,0.28)] transition-[filter] hover:brightness-110 active:brightness-95 sm:w-auto"
            >
              <Home size={16} />
              <span>{t("notFound.goHome")}</span>
            </Link>
            <Button
              size="lg"
              variant="secondary"
              leftIcon={<ArrowLeft size={16} />}
              onClick={() => router.back()}
              className="w-full sm:w-auto"
            >
              {t("notFound.goBack")}
            </Button>
          </div>

          <div className="mt-12 w-full border-t border-border pt-8">
            <p className="text-[12.5px] font-semibold uppercase tracking-[0.1em] text-fg-subtle">
              {t("notFound.helpfulLinksTitle")}
            </p>
            <div className="mt-4 grid w-full gap-2 sm:grid-cols-3">
              <HelpLink
                href="/login"
                icon={<LogIn size={15} />}
                label={t("notFound.helpfulLinks.login")}
              />
              <HelpLink
                href="/register"
                icon={<UserPlus size={15} />}
                label={t("notFound.helpfulLinks.register")}
              />
              <HelpLink
                href="/"
                icon={<Sparkles size={15} />}
                label={t("notFound.helpfulLinks.product")}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function HelpLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center justify-center gap-2 rounded-md border border-border bg-surface-1/60 px-3.5 py-2.5 text-[13.5px] font-medium text-fg-muted transition-colors hover:border-accent/40 hover:bg-surface-2 hover:text-fg"
    >
      <span className="text-accent transition-transform group-hover:scale-110">
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
}
