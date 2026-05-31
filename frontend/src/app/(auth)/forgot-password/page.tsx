"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthCard, AuthCardFooter } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { ApiError, apiRequest } from "@/lib/api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { ForgotPasswordPayload } from "@/types/auth";

export default function ForgotPasswordPage() {
  const { t, lang } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      await apiRequest<{ message: string }>("/auth/forgot-password", {
        method: "POST",
        body: { email } satisfies ForgotPasswordPayload,
      });
      setSubmitted(true);
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

  if (submitted) {
    // Render the localized subtitle by splitting around {email} and injecting the value as a styled span.
    const subtitleTemplate = t("forgot.successSubtitle");
    const parts = subtitleTemplate.split("{email}");
    return (
      <AuthCard>
        <AuthHeader
          title={t("forgot.successTitle")}
          subtitle={
            <>
              {parts[0]}
              <strong className="text-fg">{email}</strong>
              {parts[1] ?? ""}
            </>
          }
        />
        <div className="mt-7">
          <Alert variant="success">{t("forgot.alertNote")}</Alert>
        </div>
        <AuthCardFooter>
          <Link
            href="/login"
            className="font-medium text-accent hover:underline"
          >
            {t("forgot.backToSignIn")}
          </Link>
        </AuthCardFooter>
      </AuthCard>
    );
  }

  return (
    <AuthCard key={lang}>
      <AuthHeader title={t("forgot.title")} subtitle={t("forgot.subtitle")} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        noValidate
        className="mt-7 flex flex-col gap-5"
      >
        {error && <Alert variant="error">{error}</Alert>}

        <FormField label={t("login.email")} required>
          <Input
            name="email"
            type="email"
            autoComplete="email"
            placeholder={t("login.emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </FormField>

        <Button type="submit" size="lg" block loading={loading}>
          {loading ? t("forgot.submitting") : t("forgot.submit")}
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
