"use client";

import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  type CandidateVerificationItem,
  verifyAllCredentialsForCandidate,
} from "@/lib/recruiter-api";

type CandidateVerifyModalProps = {
  candidate: { id: string; fullName: string } | null;
  onClose: () => void;
};

export function CandidateVerifyModal({
  candidate,
  onClose,
}: CandidateVerifyModalProps) {
  const { t } = useLanguage();
  const [results, setResults] = useState<CandidateVerificationItem[] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!candidate) return;
    let cancelled = false;
    setLoading(true);
    setResults(null);
    setError(null);
    verifyAllCredentialsForCandidate(candidate.id)
      .then((r) => {
        if (!cancelled) setResults(r);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : t("candVerify.failed"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [candidate, t]);

  const stats = useMemo(() => {
    if (!results) return null;
    const total = results.length;
    const valid = results.filter((r) => r.result === "valid").length;
    const revoked = results.filter((r) => r.result === "revoked").length;
    const invalid = total - valid - revoked;
    return { total, valid, revoked, invalid };
  }, [results]);

  if (!candidate) return null;

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={t("candVerify.title")}
      description={
        <>
          {t("candVerify.descBefore")}
          <strong className="text-fg">{candidate.fullName}</strong>
          {t("candVerify.descAfter")}
        </>
      }
      footer={
        <Button variant="secondary" onClick={onClose}>
          {t("common.close")}
        </Button>
      }
    >
      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {loading && (
        <div className="rounded-xl border border-border bg-surface-2/40 p-6 text-center text-fg-subtle text-[13.5px]">
          {t("candVerify.running")}
        </div>
      )}

      {stats && (
        <div
          className={`mb-5 flex items-center gap-3 rounded-xl border px-4 py-3.5 ${
            stats.invalid + stats.revoked === 0
              ? "border-success/30 bg-success/[0.06]"
              : "border-warn/30 bg-warn/[0.06]"
          }`}
        >
          <ShieldCheck
            size={22}
            className={
              stats.invalid + stats.revoked === 0 ? "text-success" : "text-warn"
            }
          />
          <div className="leading-tight">
            <div className="text-[15px] font-semibold text-fg">
              {t("candVerify.summary")
                .replace("{valid}", String(stats.valid))
                .replace("{revoked}", String(stats.revoked))
                .replace("{invalid}", String(stats.invalid))}
            </div>
            <div className="text-[12.5px] text-fg-muted">
              {stats.total === 0
                ? t("candVerify.noCredentials")
                : t("candVerify.clickToExpand")}
            </div>
          </div>
        </div>
      )}

      {results && results.length > 0 && (
        <ul className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
          {results.map((r) => (
            <li key={r.credentialId} className="px-4 py-3.5">
              <div className="flex items-center gap-3">
                {r.result === "valid" ? (
                  <CheckCircle2 size={18} className="text-success shrink-0" />
                ) : (
                  <XCircle size={18} className="text-danger shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-fg truncate">
                    {r.title}
                  </div>
                  <div className="text-[12px] text-fg-subtle font-mono mt-0.5">
                    {resultLabel(r.result, t)}
                  </div>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 pl-7">
                <Tick
                  ok={r.onChainVerified}
                  label={t("candidate.credentials.onChain")}
                />
                <Tick
                  ok={r.vcSignatureValid}
                  label={t("candidate.credentials.vcSignature")}
                />
                <Tick
                  ok={r.issuerAuthorized}
                  label={t("candidate.credentials.issuerAuthorized")}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

function Tick({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[12px]">
      {ok ? (
        <CheckCircle2 size={12} className="text-success shrink-0" />
      ) : (
        <XCircle size={12} className="text-danger shrink-0" />
      )}
      <span className="text-fg-muted truncate">{label}</span>
    </div>
  );
}

function resultLabel(
  result: string,
  t: (
    key: "status.cred.issued" | "status.cred.revoked" | "status.cred.pending",
  ) => string,
): string {
  switch (result) {
    case "valid":
      return t("status.cred.issued");
    case "revoked":
      return t("status.cred.revoked");
    default:
      return result;
  }
}
