"use client";

import { PageHeader } from "@/components/app-shell/PageHeader";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export default function RecruiterDashboardPage() {
  const { t } = useLanguage();
  return (
    <>
      <PageHeader
        title={t("recruiter.dashboard.title")}
        description={t("recruiter.dashboard.description")}
      />
      <div className="rounded-2xl border border-dashed border-border bg-canvas p-10 text-center text-fg-subtle">
        {t("recruiter.dashboard.roadmap")}
      </div>
    </>
  );
}
