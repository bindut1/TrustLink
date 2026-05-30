"use client";

import { use, useEffect, useState } from "react";
import { apiRequest, ApiError } from "@/lib/api";

type VerificationOutcome = {
  result: string;
  on_chain_verified: boolean;
  vc_signature_valid: boolean;
  issuer_authorized: boolean;
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
  const allGood =
    outcome.on_chain_verified &&
    outcome.vc_signature_valid &&
    outcome.issuer_authorized &&
    outcome.result === "valid";
  const color = allGood
    ? "bg-green-100 text-green-800 border-green-300"
    : outcome.result === "revoked"
      ? "bg-orange-100 text-orange-800 border-orange-300"
      : "bg-red-100 text-red-800 border-red-300";
  const label = allGood
    ? "VERIFIED"
    : outcome.result === "revoked"
      ? "REVOKED"
      : "INVALID";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-1 text-sm font-semibold ${color}`}
    >
      <span className="text-lg">
        {allGood ? "✓" : outcome.result === "revoked" ? "⊘" : "✗"}
      </span>
      {label}
    </span>
  );
}

function CheckRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-2 text-sm">
      <span className="text-gray-700">{label}</span>
      <span className={ok ? "text-green-600" : "text-red-600"}>
        {ok ? "✓ Passed" : "✗ Failed"}
      </span>
    </div>
  );
}

export default function PublicVerifyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
          err instanceof ApiError ? err.message : "Unable to verify credential",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 text-center text-gray-500">
        Verifying credential on blockchain...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <h1 className="text-2xl font-bold text-red-800">
            Credential not found
          </h1>
          <p className="mt-2 text-sm text-red-700">
            {error ?? "This credential does not exist or has been deleted."}
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
              {credential.credentialType?.name ?? "Credential"}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">
              {credential.title}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Issued to{" "}
              <span className="font-medium">
                {credential.candidate?.fullName ?? "—"}
              </span>{" "}
              by{" "}
              <span className="font-medium">
                {credential.institution?.name ?? "—"}
              </span>
            </p>
          </div>
          <StatusBadge outcome={verification} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Credential Number" value={credential.credentialNumber} />
          <Field label="Issued Date" value={credential.issuedDate} />
          <Field label="Expiry Date" value={credential.expiryDate ?? "—"} />
          <Field label="Status" value={credential.status} />
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Verification details
          </h2>
          <div className="mt-3">
            <CheckRow
              label="Hash exists on blockchain"
              ok={verification.on_chain_verified}
            />
            <CheckRow
              label="W3C VC signature valid"
              ok={verification.vc_signature_valid}
            />
            <CheckRow
              label="Issuer is authorized"
              ok={verification.issuer_authorized}
            />
          </div>
        </div>

        {credential.blockchainTxHash && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <h2 className="text-sm font-semibold text-gray-700">
              Blockchain proof
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
                Block: {credential.blockchainBlockNumber}
              </p>
            )}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-gray-400">
          Verified by TrustLink • Powered by Polygon blockchain
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
