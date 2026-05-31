"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthCard, AuthCardFooter } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { ApiError, apiRequest } from "@/lib/api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { ResetPasswordPayload } from "@/types/auth";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}

function ResetPasswordInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { t } = useLanguage();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    setError(null);

    if (password.length < 8) {
      setError(t("reset.tooShort"));
      return;
    }
    if (password !== confirm) {
      setError(t("reset.mismatch"));
      return;
    }

    setLoading(true);
    try {
      await apiRequest<{ message: string }>("/auth/reset-password", {
        method: "POST",
        body: { token, newPassword: password } satisfies ResetPasswordPayload,
      });
      setDone(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(t("common.somethingWentWrong"));
      }
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthCard>
        <AuthHeader
          title={t("reset.invalidTitle")}
          subtitle={t("reset.invalidSubtitle")}
        />
        <div className="mt-7">
          <Alert variant="error">{t("reset.invalidAlert")}</Alert>
        </div>
        <AuthCardFooter>
          <Link
            href="/forgot-password"
            className="font-medium text-accent hover:underline"
          >
            {t("reset.requestNew")}
          </Link>
        </AuthCardFooter>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard>
        <AuthHeader
          title={t("reset.successTitle")}
          subtitle={t("reset.successSubtitle")}
        />
        <div className="mt-7">
          <Alert variant="success">{t("reset.successAlert")}</Alert>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <AuthHeader title={t("reset.title")} subtitle={t("reset.subtitle")} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        noValidate
        className="mt-7 flex flex-col gap-5"
      >
        {error && <Alert variant="error">{error}</Alert>}

        <FormField
          label={t("reset.newPassword")}
          required
          hint={t("reset.passwordHint")}
        >
          <PasswordInput
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </FormField>

        <FormField label={t("reset.confirmPassword")} required>
          <PasswordInput
            name="confirm"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </FormField>

        <Button type="submit" size="lg" block loading={loading}>
          {loading ? t("reset.submitting") : t("reset.submit")}
        </Button>
      </form>

      <AuthCardFooter>
        <Link href="/login" className="font-medium text-accent hover:underline">
          {t("forgot.backToSignIn")}
        </Link>
      </AuthCardFooter>
    </AuthCard>
  );
}
