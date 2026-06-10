"use client";

import { AlertTriangle, Download } from "lucide-react";
import { use, useEffect, useState } from "react";
import {
  VerificationResult,
  VerifyBadge,
  type VerifyOutcome,
} from "@/components/verify/VerificationResult";
import { ShareCredential } from "@/components/verify/ShareCredential";
import { VcOfflineVerifyNote } from "@/components/verify/VcOfflineVerifyNote";
import { ApiError, apiRequest } from "@/lib/api";
import { downloadPublicVc } from "@/lib/vc-download";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type PublicVerifyResponse = {
  credential: {
    id: string;
    title: string;
    credentialNumber: string;
    issuedDate: string;
    expiryDate: string | null;
    status: string;
    revokedAt: string | null;
    institution: {
      name: string;
      logoUrl: string | null;
      blockchainAddress: string | null;
    } | null;
    candidate: { fullName: string } | null;
    credentialType: { name: string; category: string } | null;
    blockchainTxHash: string | null;
    blockchainBlockNumber: number | null;
    issuerDid: string | null;
  };
  verification: VerifyOutcome & { cached: boolean };
};

export default function PublicVerifyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { t } = useLanguage();
  const { id } = use(params);
  const [data, setData] = useState<PublicVerifyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiRequest<PublicVerifyResponse>(`/public/credentials/${id}/verify`)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : t("publicVerify.unableToVerify"),
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, t]);

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadPublicVc(id, data?.credential.credentialNumber || id);
    } catch {
      /* download failed silently — page still shows verification */
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 text-center text-fg-muted">
        {t("publicVerify.verifying")}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-xl border border-danger/30 bg-danger/[0.06] p-6 text-center">
          <h1 className="text-2xl font-bold text-danger">
            {t("publicVerify.notFoundTitle")}
          </h1>
          <p className="mt-2 text-sm text-fg-muted">
            {error ?? t("publicVerify.notFoundDesc")}
          </p>
        </div>
      </div>
    );
  }

  const { credential, verification } = data;
  const canDownload =
    credential.status === "issued" || credential.status === "reissued";

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-xl border border-border bg-surface-1 p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-fg-subtle">
              {credential.credentialType?.name ?? "—"}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-fg">
              {credential.title}
            </h1>
            <p className="mt-1 text-sm text-fg-muted">
              {t("publicVerify.issuedTo")}{" "}
              <span className="font-medium text-fg">
                {credential.candidate?.fullName ?? "—"}
              </span>{" "}
              {t("publicVerify.by")}{" "}
              <span className="font-medium text-fg">
                {credential.institution?.name ?? "—"}
              </span>
            </p>
          </div>
          <VerifyBadge outcome={verification} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label={t("publicVerify.fldCredNumber")}
            value={credential.credentialNumber}
          />
          <Field
            label={t("publicVerify.fldIssuedDate")}
            value={credential.issuedDate}
          />
          <Field
            label={t("publicVerify.fldExpiryDate")}
            value={credential.expiryDate ?? "—"}
          />
          <Field label={t("publicVerify.fldStatus")} value={credential.status} />
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <h2 className="mb-3 text-lg font-semibold text-fg">
            {t("publicVerify.verificationDetails")}
          </h2>
          <VerificationResult outcome={verification} />
        </div>

        {credential.blockchainTxHash && (
          <div className="mt-6 border-t border-border pt-6">
            <h2 className="text-sm font-semibold text-fg">
              {t("publicVerify.blockchainProof")}
            </h2>
            {!verification.onChainVerified && verification.result !== "error" && (
              <p className="mt-2 flex items-start gap-2 rounded-ctl border border-warn/30 bg-warn/[0.06] px-3 py-2 text-[12px] leading-snug text-warn">
                <AlertTriangle size={14} className="mt-px shrink-0" />
                {t("verify.txNotRecognized")}
              </p>
            )}
            <p className="mt-2 break-all font-mono text-xs text-fg-muted">
              Tx:{" "}
              <a
                href={`https://amoy.polygonscan.com/tx/${credential.blockchainTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-navy hover:underline"
              >
                {credential.blockchainTxHash}
              </a>
            </p>
            {credential.blockchainBlockNumber && (
              <p className="mt-1 font-mono text-xs text-fg-muted">
                {t("publicVerify.block")}: {credential.blockchainBlockNumber}
              </p>
            )}
          </div>
        )}

        {canDownload && (
          <div className="mt-6 border-t border-border pt-6">
            <ShareCredential credentialId={credential.id} />
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="mt-3 inline-flex items-center gap-2 rounded-md border border-border px-3.5 py-2 text-[13px] font-medium text-fg transition-colors hover:bg-surface-2 disabled:opacity-60"
            >
              <Download size={14} />
              {t("verify.downloadVc")}
            </button>
            <div className="mt-4">
              <VcOfflineVerifyNote />
            </div>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-fg-subtle">
          {t("publicVerify.footer")}
        </p>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-fg-subtle">{label}</p>
      <p className="mt-1 text-sm font-medium text-fg">{value}</p>
    </div>
  );
}
