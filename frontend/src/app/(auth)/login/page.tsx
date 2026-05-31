"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthCard, AuthCardFooter } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { ApiError, apiRequest } from "@/lib/api";
import { saveSession } from "@/lib/auth-storage";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { AuthResponse, LoginPayload } from "@/types/auth";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function submit() {
    setError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      const res = await apiRequest<AuthResponse>("/auth/login", {
        method: "POST",
        body: { email, password } satisfies LoginPayload,
      });
      saveSession(res);
      router.push(`/${res.user.role}/dashboard`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.fields) setFieldErrors(err.fields);
      } else {
        setError(t("common.somethingWentWrong"));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard>
      <AuthHeader title={t("login.title")} subtitle={t("login.subtitle")} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        noValidate
        className="mt-7 flex flex-col gap-5"
      >
        {error && <Alert variant="error">{error}</Alert>}

        <FormField label={t("login.email")} required error={fieldErrors.email}>
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

        <div className="flex flex-col gap-2">
          <FormField
            label={t("login.password")}
            required
            error={fieldErrors.password}
          >
            <PasswordInput
              name="password"
              autoComplete="current-password"
              placeholder={t("login.passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </FormField>
          <Link
            href="/forgot-password"
            className="self-end text-[14px] font-medium text-fg-subtle hover:text-accent transition-colors"
          >
            {t("login.forgotPassword")}
          </Link>
        </div>

        <Button type="submit" size="lg" block loading={loading}>
          {loading ? t("login.submitting") : t("login.submit")}
        </Button>
      </form>

      <AuthCardFooter>
        {t("login.newToTrustLink")}{" "}
        <Link
          href="/register"
          className="font-medium text-accent hover:underline"
        >
          {t("login.createAccount")}
        </Link>
      </AuthCardFooter>
    </AuthCard>
  );
}
