"use client";

import { PageHeader } from "@/components/app-shell/PageHeader";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { ChangePasswordForm } from "./ChangePasswordForm";

/**
 * Full-page "Change password" view. Composed of the standard page header and
 * the reusable form. Each role mounts this from its own `settings/password`
 * route so role-specific layouts (AppShell) wrap it correctly.
 */
export function SettingsPasswordPage() {
  const { t } = useLanguage();
  return (
    <>
      <PageHeader
        title={t("settings.password")}
        description={t("settings.passwordDescription")}
      />
      <ChangePasswordForm />
    </>
  );
}
