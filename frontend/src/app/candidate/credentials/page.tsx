"use client";

import {
  Award,
  CheckCircle2,
  Download,
  ExternalLink,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { CredentialStatusBadge } from "@/components/issuer/StatusBadge";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import {
  downloadVc,
  fetchMyCredentials,
  verifyCredential,
  type VerificationResult,
} from "@/lib/candidate-api";
import type { Credential } from "@/types/issuer";

export default function CandidateCredentialsPage() {
  const [items, setItems] = useState<Credential[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, VerificationResult>>({});

  useEffect(() => {
    let cancelled = false;
    fetchMyCredentials()
      .then((r) => {
        if (!cancelled) setItems(r);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(
          e instanceof ApiError
            ? e.message
            : "Failed to load credentials",
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleVerify(c: Credential) {
    setVerifying(c.id);
    setError(null);
    try {
      const r = await verifyCredential(c.id);
      setResults((p) => ({ ...p, [c.id]: r }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setVerifying(null);
    }
  }

  async function handleDownload(c: Credential) {
    setDownloading(c.id);
    setError(null);
    try {
      await downloadVc(
        c.id,
        `${c.credentialNumber || c.id}.vc.json`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <>
      <PageHeader
        title="My credentials"
        description="Every credential issued to you. Download as a W3C Verifiable Credential JSON, or verify on-chain at any time."
      />

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {!items ? (
        <div className="rounded-2xl border border-border bg-canvas p-10 text-center text-fg-subtle">
          Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-canvas p-12 text-center">
          <Award size={32} className="mx-auto text-fg-subtle mb-4" />
          <h3 className="text-[16px] font-semibold text-fg mb-1.5">
            No credentials yet
          </h3>
          <p className="text-[13.5px] text-fg-muted max-w-[40ch] mx-auto">
            When an issuing institution publishes a credential to your account,
            it will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {items.map((c) => (
            <CredentialCard
              key={c.id}
              credential={c}
              verification={results[c.id]}
              onVerify={() => handleVerify(c)}
              verifying={verifying === c.id}
              onDownload={() => handleDownload(c)}
              downloading={downloading === c.id}
            />
          ))}
        </div>
      )}
    </>
  );
}

function CredentialCard({
  credential,
  verification,
  onVerify,
  verifying,
  onDownload,
  downloading,
}: {
  credential: Credential;
  verification?: VerificationResult;
  onVerify: () => void;
  verifying: boolean;
  onDownload: () => void;
  downloading: boolean;
}) {
  const tx = credential.blockchainTxHash;
  const isFinal = credential.status === "issued";
  return (
    <article className="flex flex-col rounded-2xl border border-border bg-canvas p-5 sm:p-6">
      <div className="flex items-start gap-3 mb-3">
        <span className="shrink-0 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent/12 text-accent">
          <Award size={20} strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[16px] font-semibold text-fg leading-snug truncate">
            {credential.title}
          </h3>
          <div className="text-[12.5px] font-mono text-fg-subtle mt-0.5">
            {credential.credentialNumber}
          </div>
        </div>
        <CredentialStatusBadge status={credential.status} />
      </div>

      <dl className="grid grid-cols-2 gap-y-2 gap-x-4 text-[13px] mb-4">
        <dt className="text-fg-subtle">Issued</dt>
        <dd className="text-fg-muted">
          {new Date(credential.issuedDate).toLocaleDateString()}
        </dd>
        {credential.expiryDate && (
          <>
            <dt className="text-fg-subtle">Expires</dt>
            <dd className="text-fg-muted">
              {new Date(credential.expiryDate).toLocaleDateString()}
            </dd>
          </>
        )}
        {tx && (
          <>
            <dt className="text-fg-subtle">Tx</dt>
            <dd>
              <a
                href={`https://amoy.polygonscan.com/tx/${tx}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[12px] font-mono text-accent hover:underline"
              >
                {`${tx.slice(0, 8)}…${tx.slice(-6)}`}
                <ExternalLink size={11} />
              </a>
            </dd>
          </>
        )}
      </dl>

      {verification && (
        <div
          className={`mb-4 rounded-lg border px-3.5 py-3 text-[13px] ${
            verification.result === "valid"
              ? "border-success/30 bg-success/[0.06] text-success"
              : "border-danger/30 bg-danger/[0.06] text-danger"
          }`}
        >
          <div className="flex items-center gap-2 font-semibold mb-2">
            {verification.result === "valid" ? (
              <CheckCircle2 size={16} />
            ) : (
              <XCircle size={16} />
            )}
            {verification.result === "valid"
              ? "Authentic & unrevoked"
              : `Verification result: ${verification.result}`}
          </div>
          <ul className="text-[12.5px] text-fg-muted leading-relaxed grid grid-cols-3 gap-2">
            <Check
              ok={verification.onChainVerified}
              label="On-chain"
            />
            <Check
              ok={verification.vcSignatureValid}
              label="VC signature"
            />
            <Check
              ok={verification.issuerAuthorized}
              label="Issuer authorized"
            />
          </ul>
        </div>
      )}

      <div className="mt-auto flex items-center gap-2">
        <Button
          variant="secondary"
          onClick={onVerify}
          loading={verifying}
          leftIcon={<ShieldCheck size={14} />}
          disabled={!isFinal}
        >
          Verify
        </Button>
        <Button
          onClick={onDownload}
          loading={downloading}
          leftIcon={<Download size={14} />}
          disabled={!isFinal}
        >
          Download VC
        </Button>
      </div>
    </article>
  );
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-1.5">
      {ok ? (
        <CheckCircle2 size={12} className="text-success shrink-0" />
      ) : (
        <XCircle size={12} className="text-danger shrink-0" />
      )}
      <span className="truncate text-fg-muted">{label}</span>
    </li>
  );
}
