"use client";

import Link from "next/link";
import { Logo } from "@/components/auth/Logo";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useLanguage();
  return (
    <div className="auth-shell-bg min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <Link
        href="/"
        aria-label={t("header.trustlinkHome")}
        className="mb-9"
      >
        <Logo variant="full" size={80} />
      </Link>
      {children}
    </div>
  );
}
