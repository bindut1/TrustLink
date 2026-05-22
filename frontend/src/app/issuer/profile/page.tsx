"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { ApprovalStatusBadge } from "@/components/issuer/StatusBadge";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { ApiError } from "@/lib/api";
import { fetchMyInstitution, updateInstitution } from "@/lib/issuer-api";
import type { Institution } from "@/types/issuer";

type EditableFields =
  | "name"
  | "nameEn"
  | "abbreviation"
  | "institutionType"
  | "taxCode"
  | "website"
  | "address"
  | "city"
  | "country"
  | "description";

const FIELDS: { key: EditableFields; label: string; full?: boolean; placeholder?: string; type?: string }[] = [
  { key: "name", label: "Institution name", full: true, placeholder: "e.g. Đại học Bách Khoa Hà Nội" },
  { key: "nameEn", label: "English name", full: true, placeholder: "e.g. Hanoi University of Science and Technology" },
  { key: "abbreviation", label: "Abbreviation", placeholder: "HUST" },
  { key: "institutionType", label: "Type", placeholder: "university / college / training_center" },
  { key: "taxCode", label: "Tax code" },
  { key: "website", label: "Website", type: "url", placeholder: "https://" },
  { key: "city", label: "City" },
  { key: "country", label: "Country" },
  { key: "address", label: "Address", full: true },
];

export default function IssuerProfilePage() {
  const [inst, setInst] = useState<Institution | null>(null);
  const [draft, setDraft] = useState<Partial<Institution>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchMyInstitution()
      .then((data) => {
        if (cancelled) return;
        setInst(data);
        setDraft(data);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const msg =
          e instanceof ApiError
            ? e.status === 404
              ? "You haven't registered an institution yet."
              : e.message
            : "Failed to load profile";
        setError(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const set =
    <K extends EditableFields>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft((d) => ({ ...d, [key]: e.target.value }));

  async function save() {
    if (!inst) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const patch: Partial<Institution> = {};
      for (const { key } of FIELDS) {
        const value = draft[key];
        if (value !== inst[key]) {
          (patch as Record<string, unknown>)[key] = value;
        }
      }
      const next = await updateInstitution(inst.id, patch);
      setInst(next);
      setDraft(next);
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <PageHeader title="Institution profile" />
        <div className="rounded-2xl border border-border bg-canvas p-10 text-center text-fg-subtle">
          Loading…
        </div>
      </>
    );
  }

  if (!inst) {
    return (
      <>
        <PageHeader title="Institution profile" />
        <Alert variant="error">
          {error ?? "Institution not found."}
        </Alert>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Institution profile"
        description="Keep your institution information up to date. Approval status is managed by an admin."
        actions={<ApprovalStatusBadge status={inst.approvalStatus} />}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
        className="flex flex-col gap-5"
      >
        {error && <Alert variant="error">{error}</Alert>}
        {success && <Alert variant="success">Profile saved.</Alert>}

        {inst.approvalStatus === "rejected" && inst.rejectionReason && (
          <Alert variant="error">
            <div className="font-semibold mb-0.5">Rejected by admin</div>
            <div>{inst.rejectionReason}</div>
          </Alert>
        )}

        {inst.approvalStatus === "approved" && inst.blockchainAddress && (
          <Alert variant="success">
            <div className="font-semibold">On-chain issuer authorized</div>
            <code className="text-[12px] font-mono break-all">
              {inst.blockchainAddress}
            </code>
          </Alert>
        )}

        <div className="rounded-2xl border border-border bg-canvas p-5 sm:p-6">
          <div className="text-[11.5px] uppercase tracking-[0.10em] font-semibold text-fg-subtle mb-5">
            Basic information
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FIELDS.slice(0, FIELDS.length - 1).map((f) => (
              <div
                key={f.key}
                className={f.full ? "sm:col-span-2" : undefined}
              >
                <FormField label={f.label}>
                  <Input
                    type={f.type ?? "text"}
                    value={(draft[f.key] as string | undefined) ?? ""}
                    onChange={set(f.key)}
                    placeholder={f.placeholder}
                  />
                </FormField>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-canvas p-5 sm:p-6">
          <div className="text-[11.5px] uppercase tracking-[0.10em] font-semibold text-fg-subtle mb-5">
            About
          </div>
          <FormField label="Description">
            <textarea
              rows={5}
              value={(draft.description as string | undefined) ?? ""}
              onChange={set("description")}
              className="w-full rounded-lg border border-border bg-surface-1 p-3 text-[15px] text-fg placeholder:text-fg-faint focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-colors resize-y"
              placeholder="Briefly describe your institution and what it issues."
            />
          </FormField>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setDraft(inst)}
          >
            Discard changes
          </Button>
          <Button type="submit" loading={saving}>
            Save profile
          </Button>
        </div>
      </form>
    </>
  );
}
