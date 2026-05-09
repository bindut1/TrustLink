/**
 * Issuer API adapter — every issuer page calls these. Forwards to NestJS
 * with the current Bearer token.
 */

import { API_BASE_URL, apiRequest } from "./api";
import { getAccessToken } from "./auth-storage";
import type {
  BatchImport,
  CandidateLookupResult,
  Credential,
  CredentialType,
  Institution,
  IssueCredentialPayload,
} from "@/types/issuer";

const authOpts = () => ({ token: getAccessToken() ?? undefined });

// ───────────── Institution ─────────────

export function fetchMyInstitution(): Promise<Institution> {
  return apiRequest("/institutions/me", authOpts());
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

export async function issueCredential(
  payload: IssueCredentialPayload,
): Promise<Credential> {
  return apiRequest("/credentials", {
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

// ───────────── Batch import ─────────────

export function fetchMyBatches(): Promise<BatchImport[]> {
  return apiRequest("/batch-imports", authOpts());
}

export function fetchBatch(id: string): Promise<BatchImport> {
  return apiRequest(`/batch-imports/${id}`, authOpts());
}

/**
 * Multipart upload — `apiRequest` is JSON-only so we hit fetch directly here.
 */
export async function uploadBatchExcel(
  credentialTypeId: string,
  file: File,
): Promise<BatchImport> {
  const form = new FormData();
  form.append("credentialTypeId", credentialTypeId);
  form.append("file", file);

  const token = getAccessToken();
  const res = await fetch(`${API_BASE_URL}/credentials/batch`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as {
      message?: unknown;
    };
    const raw = data.message;
    const msg = Array.isArray(raw)
      ? raw.join(", ")
      : typeof raw === "string"
        ? raw
        : `Upload failed (${res.status})`;
    throw new Error(msg);
  }
  return (await res.json()) as BatchImport;
}
