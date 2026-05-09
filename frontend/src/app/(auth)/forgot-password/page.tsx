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
import type { ForgotPasswordPayload } from "@/types/auth";

export default function ForgotPasswordPage() {
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
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <AuthCard>
        <AuthHeader
          title="Check your email"
          subtitle={
            <>
              If an account exists for <strong className="text-fg">{email}</strong>, we
              just sent a reset link.
            </>
          }
        />
        <div className="mt-7">
          <Alert variant="success">
            The link expires in 1 hour. Don&apos;t see it? Check your spam
            folder, then try again.
          </Alert>
        </div>
        <AuthCardFooter>
          <Link
            href="/login"
            className="font-medium text-accent hover:underline"
          >
            Back to sign in
          </Link>
        </AuthCardFooter>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <AuthHeader
        title="Reset your password"
        subtitle="Enter the email tied to your account and we'll send you a reset link."
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

        <FormField label="Email" required>
          <Input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </FormField>

        <Button type="submit" size="lg" block loading={loading}>
          {loading ? "Sending…" : "Send reset link"}
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
