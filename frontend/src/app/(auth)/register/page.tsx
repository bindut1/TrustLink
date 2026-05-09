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
      setError("Please choose an account type.");
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
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.fields) setFieldErrors(err.fields);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard size="lg">
      <AuthHeader
        size="lg"
        title="Create your TrustLink account"
        subtitle="Pick how you'll use TrustLink — your role decides which tools you'll see next."
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
          <Label required>Account type</Label>
          <RoleSelector
            options={REGISTER_ROLES}
            value={role}
            onChange={setRole}
          />
        </fieldset>

        {role && (
          <>
            <AuthSectionLabel>Account details</AuthSectionLabel>

            <FormField
              label={role === "issuer" ? "Contact person" : "Full name"}
              required
              error={fieldErrors.fullName}
            >
              <Input
                name="fullName"
                autoComplete="name"
                placeholder={
                  role === "issuer"
                    ? "Person managing this account"
                    : "Your full name"
                }
                value={form.fullName}
                onChange={set("fullName")}
                required
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Email" required error={fieldErrors.email}>
                <Input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={set("email")}
                  required
                />
              </FormField>
              <FormField
                label="Phone"
                hint="Optional"
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
              label="Password"
              required
              hint="At least 8 characters"
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
                <AuthSectionLabel>Institution</AuthSectionLabel>
                <FormField
                  label="Institution name"
                  required
                  error={fieldErrors.institutionName}
                >
                  <Input
                    name="institutionName"
                    placeholder="e.g. Hanoi University of Science"
                    value={form.institutionName}
                    onChange={set("institutionName")}
                    required
                  />
                </FormField>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="Institution type"
                    required
                    error={fieldErrors.institutionType}
                  >
                    <Select
                      name="institutionType"
                      value={form.institutionType}
                      onChange={set("institutionType")}
                      required
                    >
                      <option value="">Select…</option>
                      {INSTITUTION_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField
                    label="Tax / registration code"
                    hint="Optional"
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
                  label="Website"
                  hint="Optional"
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
                <AuthSectionLabel>Company</AuthSectionLabel>
                <FormField
                  label="Company name"
                  required
                  error={fieldErrors.companyName}
                >
                  <Input
                    name="companyName"
                    placeholder="e.g. Mercurial Labs"
                    value={form.companyName}
                    onChange={set("companyName")}
                    required
                  />
                </FormField>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="Industry"
                    hint="Optional"
                    error={fieldErrors.industry}
                  >
                    <Input
                      name="industry"
                      placeholder="e.g. Fintech"
                      value={form.industry}
                      onChange={set("industry")}
                    />
                  </FormField>
                  <FormField
                    label="Company size"
                    hint="Optional"
                    error={fieldErrors.companySize}
                  >
                    <Select
                      name="companySize"
                      value={form.companySize}
                      onChange={set("companySize")}
                    >
                      <option value="">Select…</option>
                      {COMPANY_SIZES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                </div>
              </>
            )}

            <Button type="submit" size="lg" block loading={loading}>
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </>
        )}
      </form>

      <AuthCardFooter>
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Sign in
        </Link>
      </AuthCardFooter>
    </AuthCard>
  );
}
