"use client";

import { use, useEffect, useState } from "react";
import { apiRequest, ApiError } from "@/lib/api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";

type VerificationOutcome = {
  result: string;
  onChainVerified: boolean;
  vcSignatureValid: boolean;
  issuerAuthorized: boolean;
  contentIntegrityValid: boolean;
  cached: boolean;
};

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
  verification: VerificationOutcome;
};

function StatusBadge({ outcome }: { outcome: VerificationOutcome }) {
  const { t } = useLanguage();
  const isError = outcome.result === "error";
  const allGood =
    outcome.onChainVerified &&
    outcome.vcSignatureValid &&
    outcome.issuerAuthorized &&
    outcome.contentIntegrityValid &&
    outcome.result === "valid";
  const color = isError
    ? "bg-gray-100 text-gray-700 border-gray-300"
    : allGood
      ? "bg-green-100 text-green-800 border-green-300"
      : outcome.result === "revoked"
        ? "bg-orange-100 text-orange-800 border-orange-300"
        : "bg-red-100 text-red-800 border-red-300";
  const labelKey: TranslationKey = isError
    ? "publicVerify.statusError"
    : allGood
      ? "publicVerify.statusVerified"
      : outcome.result === "revoked"
        ? "publicVerify.statusRevoked"
        : "publicVerify.statusInvalid";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-1 text-sm font-semibold ${color}`}
    >
      <span className="text-lg">
        {isError ? "!" : allGood ? "✓" : outcome.result === "revoked" ? "⊘" : "✗"}
      </span>
      {t(labelKey)}
    </span>
  );
}

function CheckRow({ label, ok }: { label: string; ok: boolean }) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-2 text-sm">
      <span className="text-gray-700">{label}</span>
      <span className={ok ? "text-green-600" : "text-red-600"}>
        {ok ? t("publicVerify.passed") : t("publicVerify.failedCheck")}
      </span>
    </div>
  );
}

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

  if (loading) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 text-center text-gray-500">
        {t("publicVerify.verifying")}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <h1 className="text-2xl font-bold text-red-800">
            {t("publicVerify.notFoundTitle")}
          </h1>
          <p className="mt-2 text-sm text-red-700">
            {error ?? t("publicVerify.notFoundDesc")}
          </p>
        </div>
      </div>
    );
  }

  const { credential, verification } = data;
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-gray-500">
              {credential.credentialType?.name ?? "—"}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">
              {credential.title}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {t("publicVerify.issuedTo")}{" "}
              <span className="font-medium">
                {credential.candidate?.fullName ?? "—"}
              </span>{" "}
              {t("publicVerify.by")}{" "}
              <span className="font-medium">
                {credential.institution?.name ?? "—"}
              </span>
            </p>
          </div>
          <StatusBadge outcome={verification} />
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
          <Field
            label={t("publicVerify.fldStatus")}
            value={credential.status}
          />
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("publicVerify.verificationDetails")}
          </h2>
          {verification.result === "error" ? (
            <p className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
              {t("publicVerify.cannotVerifyNow")}
            </p>
          ) : (
            <div className="mt-3">
              <CheckRow
                label={t("publicVerify.checkOnChain")}
                ok={verification.onChainVerified}
              />
              <CheckRow
                label={t("publicVerify.checkContentIntegrity")}
                ok={verification.contentIntegrityValid}
              />
              <CheckRow
                label={t("publicVerify.checkSignature")}
                ok={verification.vcSignatureValid}
              />
              <CheckRow
                label={t("publicVerify.checkIssuer")}
                ok={verification.issuerAuthorized}
              />
            </div>
          )}
        </div>

        {credential.blockchainTxHash && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <h2 className="text-sm font-semibold text-gray-700">
              {t("publicVerify.blockchainProof")}
            </h2>
            <p className="mt-2 break-all font-mono text-xs text-gray-600">
              Tx:{" "}
              <a
                href={`https://amoy.polygonscan.com/tx/${credential.blockchainTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {credential.blockchainTxHash}
              </a>
            </p>
            {credential.blockchainBlockNumber && (
              <p className="mt-1 font-mono text-xs text-gray-600">
                {t("publicVerify.block")}: {credential.blockchainBlockNumber}
              </p>
            )}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-gray-400">
          {t("publicVerify.footer")}
        </p>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}
