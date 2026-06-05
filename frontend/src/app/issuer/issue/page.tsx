"use client";

import { ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useSetPageMeta } from "@/components/app-shell/page-meta";
import { CandidateLookup } from "@/components/issuer/CandidateLookup";
import { DynamicForm } from "@/components/issuer/DynamicForm";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { SelectMenu } from "@/components/ui/SelectMenu";
import { ApiError } from "@/lib/api";
import {
  fetchCredentialTypes,
  issueCredential,
} from "@/lib/issuer-api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type {
  CandidateLookupResult,
  CredentialType,
  IssueCredentialPayload,
} from "@/types/issuer";

type FieldValue = string | number | undefined;

export default function IssueCredentialPage() {
  const { t } = useLanguage();
  useSetPageMeta(t("issuer.issue.title"), t("issuer.issue.description"));
  const [types, setTypes] = useState<CredentialType[] | null>(null);
  const [typeId, setTypeId] = useState("");
  const [credentialNumber, setCredentialNumber] = useState("");
  const [title, setTitle] = useState("");
  const [issuedDate, setIssuedDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [expiryDate, setExpiryDate] = useState("");
  const [candidate, setCandidate] = useState<CandidateLookupResult | null>(
    null,
  );
  const [metadata, setMetadata] = useState<Record<string, FieldValue>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [issuedId, setIssuedId] = useState<string | null>(null);

  useEffect(() => {
    fetchCredentialTypes().then(setTypes);
  }, []);

  // Reset metadata when type changes — fields differ.
  useEffect(() => {
    setMetadata({});
  }, [typeId]);

  const selectedType = types?.find((t) => t.id === typeId) ?? null;

  async function submit() {
    if (!candidate) {
      setError(t("issuer.issue.errLookupFirst"));
      return;
    }
    if (!selectedType) {
      setError(t("issuer.issue.errPickType"));
      return;
    }
    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    setIssuedId(null);

    const payload: IssueCredentialPayload = {
      credentialNumber: credentialNumber.trim(),
      credentialTypeId: selectedType.id,
      candidateId: candidate.id,
      title: title.trim(),
      issuedDate,
      expiryDate: expiryDate || undefined,
      metadata: metadata as Record<string, unknown>,
    };

    try {
      const result = await issueCredential(payload);
      setIssuedId(result.id);
      // reset form for next issuance
      setCredentialNumber("");
      setTitle("");
      setExpiryDate("");
      setMetadata({});
      setCandidate(null);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
        if (e.fields) setFieldErrors(e.fields);
      } else {
        setError(t("issuer.issue.errSubmit"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  const typeOptions = [
    { value: "", label: t("issuer.issue.selectTypePlaceholder") },
    ...(types ?? [])
      .filter((ct) => ct.isActive)
      .map((ct) => ({
        value: ct.id,
        label: ct.nameEn ? `${ct.name} · ${ct.nameEn}` : ct.name,
      })),
  ];

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="flex flex-col gap-5"
      >
        {issuedId && (
          <Alert variant="success">
            {t("issuer.issue.queued")}{" "}
            <a
              href="/issuer/credentials"
              className="font-semibold underline-offset-2 hover:underline"
            >
              {t("issuer.issue.viewInList")}
            </a>
          </Alert>
        )}
        {error && <Alert variant="error">{error}</Alert>}

        {/* Steps 1 & 2 side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
          <Section
            step="01"
            title={t("issuer.issue.stepType")}
            subtitle={t("issuer.issue.stepTypeDesc")}
          >
            {!types ? (
              <div className="text-fg-subtle text-[14px]">
                {t("issuer.batch.loadingTypes")}
              </div>
            ) : (
              <FormField label={t("issuer.issue.fldType")} required>
                <SelectMenu
                  value={typeId}
                  onChange={setTypeId}
                  options={typeOptions}
                  ariaLabel={t("issuer.issue.fldType")}
                />
              </FormField>
            )}
          </Section>

          <Section
            step="02"
            title={t("issuer.issue.stepRecipient")}
            subtitle={t("issuer.issue.stepRecipientDesc")}
          >
            <CandidateLookup value={candidate} onChange={setCandidate} />
          </Section>
        </div>

        {/* Step 3: Credential basics + dynamic fields */}
        {selectedType && (
          <Section
            step="03"
            title={t("issuer.issue.stepDetails")}
            subtitle={t("issuer.issue.stepDetailsDesc")}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <FormField
                label={t("issuer.issue.fldCredNumber")}
                required
                error={fieldErrors.credentialNumber}
              >
                <Input
                  value={credentialNumber}
                  onChange={(e) => setCredentialNumber(e.target.value)}
                  placeholder={t("issuer.issue.credNumberPlaceholder")}
                  required
                />
              </FormField>
              <FormField
                label={t("issuer.issue.fldTitle")}
                required
                error={fieldErrors.title}
              >
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("issuer.issue.titlePlaceholder")}
                  required
                />
              </FormField>
              <FormField
                label={t("issuer.issue.fldIssuedDate")}
                required
                error={fieldErrors.issuedDate}
              >
                <Input
                  type="date"
                  value={issuedDate}
                  onChange={(e) => setIssuedDate(e.target.value)}
                  required
                />
              </FormField>
              <FormField
                label={t("issuer.issue.fldExpiryDate")}
                hint={t("issuer.issue.fldExpiryHint")}
                error={fieldErrors.expiryDate}
              >
                <Input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </FormField>
            </div>

            {selectedType.fieldSchema?.fields?.length > 0 && (
              <>
                <div className="text-[11.5px] uppercase tracking-[0.10em] font-semibold text-fg-subtle mb-3">
                  {t("issuer.issue.dynFieldsLabel").replace(
                    "{type}",
                    selectedType.name,
                  )}
                </div>
                <DynamicForm
                  schema={selectedType.fieldSchema}
                  value={metadata}
                  onChange={setMetadata}
                  errors={fieldErrors}
                />
              </>
            )}
          </Section>
        )}

        <div className="flex items-center justify-end gap-3">
          <Button
            type="submit"
            variant="verified"
            size="lg"
            loading={submitting}
            disabled={!candidate || !selectedType}
            leftIcon={<ShieldCheck size={16} />}
          >
            {t("issuer.issue.submit")}
          </Button>
        </div>
      </form>
    </>
  );
}

function Section({
  step,
  title,
  subtitle,
  children,
}: {
  step: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card border border-border bg-canvas p-5 sm:p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-baseline gap-3 mb-5">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.10em] text-navy">
          {step}
        </span>
        <div>
          <h2 className="text-[16px] font-semibold tracking-[-0.015em] text-fg leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[12.5px] text-fg-subtle mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}
