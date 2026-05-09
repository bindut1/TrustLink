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
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
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
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthCard>
        <AuthHeader
          title="Invalid reset link"
          subtitle="The reset link is missing or malformed."
        />
        <div className="mt-7">
          <Alert variant="error">
            Open the link from the email we sent, or request a new one.
          </Alert>
        </div>
        <AuthCardFooter>
          <Link
            href="/forgot-password"
            className="font-medium text-accent hover:underline"
          >
            Request a new link
          </Link>
        </AuthCardFooter>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard>
        <AuthHeader
          title="Password updated"
          subtitle="You can now sign in with your new password."
        />
        <div className="mt-7">
          <Alert variant="success">Redirecting you to the sign-in page…</Alert>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <AuthHeader
        title="Set a new password"
        subtitle="Choose a strong password you haven't used before."
      />

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
          label="New password"
          required
          hint="At least 8 characters"
        >
          <PasswordInput
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </FormField>

        <FormField label="Confirm new password" required>
          <PasswordInput
            name="confirm"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </FormField>

        <Button type="submit" size="lg" block loading={loading}>
          {loading ? "Updating…" : "Update password"}
        </Button>
      </form>

      <AuthCardFooter>
        <Link href="/login" className="font-medium text-accent hover:underline">
          Back to sign in
        </Link>
      </AuthCardFooter>
    </AuthCard>
  );
}
