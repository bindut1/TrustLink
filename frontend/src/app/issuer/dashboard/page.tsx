"use client";

import { PageHeader } from "@/components/app-shell/PageHeader";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export default function IssuerDashboardPage() {
  const { t } = useLanguage();
  return (
    <>
      <PageHeader
        title={t("issuer.dashboard.title")}
        description={t("issuer.dashboard.description")}
      />
      <div className="rounded-2xl border border-dashed border-border bg-canvas p-10 text-center text-fg-subtle">
        {t("issuer.dashboard.roadmap")}
      </div>
    </>
  );
}
