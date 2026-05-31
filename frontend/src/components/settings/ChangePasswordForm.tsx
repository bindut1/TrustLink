"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { apiRequest, ApiError } from "@/lib/api";
import { clearSession, getAccessToken } from "@/lib/auth-storage";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

/**
 * Self-contained password change form. After a successful change the backend
 * revokes all refresh tokens, so we sign out locally and redirect to /login.
 *
 * Reusable across roles — drop it into any settings page.
 */
export function ChangePasswordForm() {
  const { t } = useLanguage();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < 8) {
      setError(t("password.tooShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("password.mismatch"));
      return;
    }

    setSaving(true);
    try {
      await apiRequest("/auth/change-password", {
        method: "POST",
        body: { currentPassword, newPassword },
        token: getAccessToken() ?? undefined,
      });
      setSuccess(true);
      // Backend revoked all refresh tokens — the access token in memory is
      // still valid for a few minutes, but the user must re-login eventually.
      // Give them a beat to see the success message, then redirect.
      setTimeout(() => {
        clearSession();
        router.replace("/login");
      }, 1500);
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : t("password.failed"),
      );
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl rounded-2xl border border-border bg-canvas p-6 sm:p-7"
    >
      <div className="space-y-4">
        <FormField label={t("password.current")} required>
          <PasswordInput
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </FormField>

        <FormField label={t("password.new")} required>
          <PasswordInput
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </FormField>

        <FormField label={t("password.confirm")} required>
          <PasswordInput
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </FormField>

        {error && <Alert variant="error">{error}</Alert>}
        {success && <Alert variant="success">{t("password.success")}</Alert>}
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          type="submit"
          loading={saving}
          disabled={
            saving || !currentPassword || !newPassword || !confirmPassword
          }
        >
          {t("btn.update")}
        </Button>
      </div>
    </form>
  );
}
