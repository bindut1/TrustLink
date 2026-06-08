/**
 * Issuer API adapter — every issuer page calls these. Forwards to NestJS
 * with the current Bearer token.
 */

import { apiRequest } from "./api";
import { getAccessToken } from "./auth-storage";
import type { BatchTypedData, CredentialTypedData } from "./eip712";
import type {
  CandidateLookupResult,
  Credential,
  CredentialType,
  Institution,
  IssuerDashboard,
  IssueCredentialPayload,
} from "@/types/issuer";

const authOpts = () => ({ token: getAccessToken() ?? undefined });

// ───────────── Institution ─────────────

export function fetchMyInstitution(): Promise<Institution> {
  return apiRequest("/institutions/me", authOpts());
}

/** Aggregate counts + issuance trend for the issuer dashboard. */
export function fetchIssuerDashboard(): Promise<IssuerDashboard> {
  return apiRequest("/institutions/me/dashboard", authOpts());
}

export async function updateInstitution(
  id: string,
  patch: Partial<Institution>,
): Promise<Institution> {
  return apiRequest(`/institutions/${id}`, {
    method: "PATCH",
    body: patch as Record<string, unknown>,
    ...authOpts(),
  });
}

// ───────────── Credential types ─────────────

export function fetchCredentialTypes(): Promise<CredentialType[]> {
  return apiRequest("/credential-types", authOpts());
}

// ───────────── Issue + revoke ─────────────

export function lookupCandidate(email: string): Promise<CandidateLookupResult> {
  return apiRequest(
    `/users/lookup?email=${encodeURIComponent(email)}`,
    authOpts(),
  );
}

export function searchCandidates(
  q: string,
): Promise<CandidateLookupResult[]> {
  return apiRequest(
    `/users/candidates/search?q=${encodeURIComponent(q)}`,
    authOpts(),
  );
}

// ───────────── Non-custodial batch issuance (MetaMask) ─────────────

export function registerIssuerWallet(
  signingAddress: string,
): Promise<{ signingAddress: string; authorized: boolean }> {
  return apiRequest("/credentials/issuer/wallet", {
    method: "POST",
    body: { signingAddress },
    ...authOpts(),
  });
}

export function disconnectIssuerWallet(): Promise<{ disconnected: boolean }> {
  return apiRequest("/credentials/issuer/wallet", {
    method: "DELETE",
    ...authOpts(),
  });
}

export interface PreparedBatch {
  merkleRoot: string;
  items: { credentialId: string; typedData: CredentialTypedData }[];
  batchTypedData: BatchTypedData;
}

export function prepareBatch(
  items: IssueCredentialPayload[],
): Promise<PreparedBatch> {
  return apiRequest("/credentials/batch/prepare", {
    method: "POST",
    body: { items } as unknown as Record<string, unknown>,
    ...authOpts(),
  });
}

export function anchorBatch(payload: {
  merkleRoot: string;
  txHash: string;
  signatures: { credentialId: string; signature: string }[];
}): Promise<{ anchored: number }> {
  return apiRequest("/credentials/batch/anchor", {
    method: "POST",
    body: payload as unknown as Record<string, unknown>,
    ...authOpts(),
  });
}

/** Bulk anchor: one signature over the Merkle root for the whole batch. */
export function anchorBatchBulk(payload: {
  merkleRoot: string;
  txHash: string;
  batchSignature: string;
  issuedAt: string;
}): Promise<{ anchored: number }> {
  return apiRequest("/credentials/batch/anchor-bulk", {
    method: "POST",
    body: payload as unknown as Record<string, unknown>,
    ...authOpts(),
  });
}

export function fetchCredentials(filter?: {
  institutionId?: string;
  candidateId?: string;
  status?: string;
  credentialTypeId?: string;
}): Promise<Credential[]> {
  const entries = Object.entries(filter ?? {}).filter(
    ([, v]) => v && v !== "all",
  ) as [string, string][];
  const qs = new URLSearchParams(entries).toString();
  return apiRequest(`/credentials${qs ? `?${qs}` : ""}`, authOpts());
}

export async function revokeCredential(
  id: string,
  reason: string,
): Promise<void> {
  await apiRequest(`/credentials/${id}/revoke`, {
    method: "POST",
    body: { reason },
    ...authOpts(),
  });
}

