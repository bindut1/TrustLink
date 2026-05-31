"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AuthCard,
  AuthCardFooter,
  AuthSectionLabel,
} from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { RoleSelector } from "@/components/auth/RoleSelector";
import {
  COMPANY_SIZES,
  INSTITUTION_TYPES,
  REGISTER_ROLES,
  type RegisterRole,
} from "@/components/auth/auth-config";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input, Select } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { ApiError, apiRequest } from "@/lib/api";
import { saveSession } from "@/lib/auth-storage";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { AuthResponse, RegisterPayload } from "@/types/auth";

type FormState = {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  institutionName: string;
  institutionType: string;
  taxCode: string;
  website: string;
  companyName: string;
  industry: string;
  companySize: string;
};

const INITIAL: FormState = {
  email: "",
  password: "",
  fullName: "",
  phone: "",
  institutionName: "",
  institutionType: "",
  taxCode: "",
  website: "",
  companyName: "",
  industry: "",
  companySize: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [role, setRole] = useState<RegisterRole | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const set =
    <K extends keyof FormState>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((s) => ({ ...s, [key]: e.target.value }));

  async function submit() {
    if (!role) {
      setError(t("register.pickAccountType"));
      return;
    }
    setError(null);
    setFieldErrors({});
    setLoading(true);

    const payload: RegisterPayload = {
      email: form.email,
      password: form.password,
      fullName: form.fullName,
      role,
      phone: form.phone || undefined,
      ...(role === "issuer" && {
        institutionName: form.institutionName,
        institutionType: form.institutionType,
        taxCode: form.taxCode || undefined,
        website: form.website || undefined,
      }),
      ...(role === "recruiter" && {
        companyName: form.companyName,
        industry: form.industry || undefined,
        companySize: form.companySize || undefined,
      }),
    };

    try {
      const res = await apiRequest<AuthResponse>("/auth/register", {
        method: "POST",
        body: payload,
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
    <AuthCard size="lg">
      <AuthHeader
        size="lg"
        title={t("register.title")}
        subtitle={t("register.subtitle")}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        noValidate
        className="mt-8 flex flex-col gap-6"
      >
        {error && <Alert variant="error">{error}</Alert>}

        <fieldset className="flex flex-col gap-3">
          <Label required>{t("register.accountType")}</Label>
          <RoleSelector
            options={REGISTER_ROLES}
            value={role}
            onChange={setRole}
          />
        </fieldset>

        {role && (
          <>
            <AuthSectionLabel>{t("register.accountDetails")}</AuthSectionLabel>

            <FormField
              label={
                role === "issuer"
                  ? t("register.contactPerson")
                  : t("register.fullName")
              }
              required
              error={fieldErrors.fullName}
            >
              <Input
                name="fullName"
                autoComplete="name"
                placeholder={t("register.fullNamePlaceholder")}
                value={form.fullName}
                onChange={set("fullName")}
                required
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={t("register.email")} required error={fieldErrors.email}>
                <Input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder={t("login.emailPlaceholder")}
                  value={form.email}
                  onChange={set("email")}
                  required
                />
              </FormField>
              <FormField
                label={t("register.phone")}
                hint={t("common.optional")}
                error={fieldErrors.phone}
              >
                <Input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={set("phone")}
                />
              </FormField>
            </div>

            <FormField
              label={t("register.password")}
              required
              hint={t("register.passwordHint")}
              error={fieldErrors.password}
            >
              <PasswordInput
                name="password"
                autoComplete="new-password"
                value={form.password}
                onChange={set("password")}
                required
              />
            </FormField>

            {role === "issuer" && (
              <>
                <AuthSectionLabel>
                  {t("register.institutionSection")}
                </AuthSectionLabel>
                <FormField
                  label={t("register.institutionName")}
                  required
                  error={fieldErrors.institutionName}
                >
                  <Input
                    name="institutionName"
                    placeholder={t("register.institutionNamePlaceholder")}
                    value={form.institutionName}
                    onChange={set("institutionName")}
                    required
                  />
                </FormField>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label={t("register.institutionType")}
                    required
                    error={fieldErrors.institutionType}
                  >
                    <Select
                      name="institutionType"
                      value={form.institutionType}
                      onChange={set("institutionType")}
                      required
                    >
                      <option value="">{t("register.selectPlaceholder")}</option>
                      {INSTITUTION_TYPES.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {t(opt.labelKey)}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField
                    label={t("register.taxCode")}
                    hint={t("common.optional")}
                    error={fieldErrors.taxCode}
                  >
                    <Input
                      name="taxCode"
                      value={form.taxCode}
                      onChange={set("taxCode")}
                    />
                  </FormField>
                </div>
                <FormField
                  label={t("register.website")}
                  hint={t("common.optional")}
                  error={fieldErrors.website}
                >
                  <Input
                    name="website"
                    type="url"
                    placeholder="https://"
                    value={form.website}
                    onChange={set("website")}
                  />
                </FormField>
              </>
            )}

            {role === "recruiter" && (
              <>
                <AuthSectionLabel>
                  {t("register.companySection")}
                </AuthSectionLabel>
                <FormField
                  label={t("register.companyName")}
                  required
                  error={fieldErrors.companyName}
                >
                  <Input
                    name="companyName"
                    placeholder={t("register.companyNamePlaceholder")}
                    value={form.companyName}
                    onChange={set("companyName")}
                    required
                  />
                </FormField>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label={t("register.industry")}
                    hint={t("common.optional")}
                    error={fieldErrors.industry}
                  >
                    <Input
                      name="industry"
                      placeholder={t("jobForm.industryPlaceholder")}
                      value={form.industry}
                      onChange={set("industry")}
                    />
                  </FormField>
                  <FormField
                    label={t("register.companySize")}
                    hint={t("common.optional")}
                    error={fieldErrors.companySize}
                  >
                    <Select
                      name="companySize"
                      value={form.companySize}
                      onChange={set("companySize")}
                    >
                      <option value="">{t("register.selectPlaceholder")}</option>
                      {COMPANY_SIZES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {t(s.labelKey)}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                </div>
              </>
            )}

            <Button type="submit" size="lg" block loading={loading}>
              {loading ? t("register.submitting") : t("register.submit")}
            </Button>
          </>
        )}
      </form>

      <AuthCardFooter>
        {t("register.alreadyHaveAccount")}{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          {t("register.signIn")}
        </Link>
      </AuthCardFooter>
    </AuthCard>
  );
}
