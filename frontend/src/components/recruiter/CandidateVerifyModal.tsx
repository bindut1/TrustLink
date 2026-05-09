"use client";

import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
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
        setError(
          e instanceof Error ? e.message : "Verification failed",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [candidate]);

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
      title="1-click verification"
      description={
        <>
          Checking every credential for{" "}
          <strong className="text-fg">{candidate.fullName}</strong> against
          on-chain hash, VC signature, and authorized issuer.
        </>
      }
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
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
          Running checks…
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
              {stats.valid} valid · {stats.revoked} revoked · {stats.invalid}{" "}
              invalid
            </div>
            <div className="text-[12.5px] text-fg-muted">
              {stats.total === 0
                ? "This candidate has no credentials yet."
                : "Click any row to expand its on-chain check details."}
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
                  <div className="text-[12px] text-fg-subtle font-mono mt-0.5 capitalize">
                    {r.result}
                  </div>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 pl-7">
                <Tick ok={r.onChainVerified} label="On-chain" />
                <Tick ok={r.vcSignatureValid} label="VC signature" />
                <Tick ok={r.issuerAuthorized} label="Issuer authorized" />
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
