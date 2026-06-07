"use client";

import {
  AlertCircle,
  CheckCircle2,
  Download,
  ExternalLink,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  VerifyChecks,
  verifyKind,
  type VerifyKind,
} from "@/components/verify/VerificationResult";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  type CandidateVerificationItem,
  verifyAllCredentialsForCandidate,
} from "@/lib/recruiter-api";
import { downloadPublicVc } from "@/lib/vc-download";

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
    const valid = results.filter((r) => verifyKind(r) === "valid").length;
    const revoked = results.filter((r) => verifyKind(r) === "revoked").length;
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
            <CredentialRow key={r.credentialId} item={r} />
          ))}
        </ul>
      )}
    </Modal>
  );
}

const STATUS_ICON: Record<VerifyKind, React.ReactNode> = {
  valid: <CheckCircle2 size={18} className="text-teal shrink-0" />,
  revoked: <AlertCircle size={18} className="text-warn shrink-0" />,
  invalid: <XCircle size={18} className="text-danger shrink-0" />,
  not_found: <AlertCircle size={18} className="text-fg-muted shrink-0" />,
  error: <AlertCircle size={18} className="text-fg-muted shrink-0" />,
};

function CredentialRow({ item }: { item: CandidateVerificationItem }) {
  const { t } = useLanguage();
  const [downloading, setDownloading] = useState(false);
  const kind = verifyKind(item);

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadPublicVc(item.credentialId, item.title || item.credentialId);
    } catch {
      /* silent — verification is the primary action here */
    } finally {
      setDownloading(false);
    }
  }

  return (
    <li className="px-4 py-3.5">
      <div className="flex items-center gap-3">
        {STATUS_ICON[kind]}
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold text-fg truncate">
            {item.title}
          </div>
          <div className="text-[12px] text-fg-subtle font-mono mt-0.5">
            {resultLabel(kind, t)}
          </div>
        </div>
      </div>

      {kind !== "error" && (
        <div className="mt-2.5 pl-7">
          <VerifyChecks outcome={item} />
        </div>
      )}

      <div className="mt-2.5 flex items-center gap-2 pl-7">
        <a
          href={`/verify/${item.credentialId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-[12px] font-medium text-navy transition-colors hover:bg-surface-2"
        >
          <ExternalLink size={13} />
          {t("verify.openPage")}
        </a>
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-[12px] font-medium text-fg transition-colors hover:bg-surface-2 disabled:opacity-60"
        >
          <Download size={13} />
          {t("verify.downloadVc")}
        </button>
      </div>
    </li>
  );
}

function resultLabel(
  kind: VerifyKind,
  t: (
    key:
      | "verify.statusValid"
      | "verify.statusRevoked"
      | "verify.statusInvalid"
      | "verify.statusNotFound"
      | "verify.statusError",
  ) => string,
): string {
  switch (kind) {
    case "valid":
      return t("verify.statusValid");
    case "revoked":
      return t("verify.statusRevoked");
    case "not_found":
      return t("verify.statusNotFound");
    case "error":
      return t("verify.statusError");
    default:
      return t("verify.statusInvalid");
  }
}
