"use client";

import { CheckCircle2, Search, XCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { ApiError } from "@/lib/api";
import { lookupCandidate } from "@/lib/issuer-api";
import type { CandidateLookupResult } from "@/types/issuer";

type CandidateLookupProps = {
  value: CandidateLookupResult | null;
  onChange: (next: CandidateLookupResult | null) => void;
};

export function CandidateLookup({ value, onChange }: CandidateLookupProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookup() {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await lookupCandidate(email.trim());
      onChange(result);
      setEmail("");
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.status === 404
            ? "No candidate found with that email."
            : e.message
          : "Lookup failed.";
      setError(msg);
      onChange(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <FormField
        label="Candidate email"
        required
        error={error ?? undefined}
        hint={!value && !error ? "Enter the candidate's email and click Find." : undefined}
      >
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="candidate@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void lookup();
              }
            }}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={lookup}
            loading={loading}
            leftIcon={<Search size={14} />}
          >
            Find
          </Button>
        </div>
      </FormField>

      {value && (
        <div className="flex items-start gap-3 rounded-lg border border-success/25 bg-success/[0.06] px-3.5 py-3">
          <CheckCircle2 size={18} className="text-success shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold text-fg">
              {value.fullName}
            </div>
            <div className="text-[12.5px] text-fg-subtle font-mono">
              {value.email}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            title="Remove"
            className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-md text-fg-subtle hover:text-fg hover:bg-surface-2 transition-colors"
          >
            <XCircle size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
