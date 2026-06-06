/**
 * Candidate API adapter — all candidate pages call these. Forwards to NestJS
 * with the current Bearer token.
 */

import { API_BASE_URL, ApiError, apiRequest } from "./api";
import { getAccessToken } from "./auth-storage";
import type {
  ApplicationItem,
  CandidateDashboard,
  CandidateProfile,
  CandidateSkill,
  JobItem,
  PaginatedJobs,
  RankedJob,
  RecruiterPublicProfile,
  UpdateCandidateProfilePayload,
} from "@/types/candidate";
import type { Credential } from "@/types/issuer";

const authOpts = () => ({ token: getAccessToken() ?? undefined });

// ───────────── Profile ─────────────

export function fetchMyProfile(): Promise<CandidateProfile> {
  return apiRequest("/candidate-profiles/me", authOpts());
}

/** Read-only skills for the current candidate (verified-first). */
export function fetchMySkills(): Promise<CandidateSkill[]> {
  return apiRequest("/candidate-profiles/me/skills", authOpts());
}

/** Aggregate counts for the candidate dashboard. */
export function fetchCandidateDashboard(): Promise<CandidateDashboard> {
  return apiRequest("/candidate-profiles/me/dashboard", authOpts());
}

export function updateMyProfile(
  patch: UpdateCandidateProfilePayload,
): Promise<CandidateProfile> {
  return apiRequest("/candidate-profiles/me", {
    method: "PATCH",
    body: patch as Record<string, unknown>,
    ...authOpts(),
  });
}

// ───────────── Credentials ─────────────

export function fetchMyCredentials(): Promise<Credential[]> {
  return apiRequest("/credentials/my", authOpts());
}

export type VerificationResult = {
  result: string;
  onChainVerified: boolean;
  vcSignatureValid: boolean;
  issuerAuthorized: boolean;
  contentIntegrityValid: boolean;
  verifiedAt?: string;
};

export function verifyCredential(id: string): Promise<VerificationResult> {
  return apiRequest(`/credentials/${id}/verify`, authOpts());
}

/** Triggers a browser download of the W3C VC JSON. */
export async function downloadVc(credentialId: string, filename: string) {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE_URL}/credentials/${credentialId}/vc`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new ApiError("", res.status);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ───────────── Jobs ─────────────

export function fetchJobs(params?: {
  search?: string;
  city?: string;
  jobType?: string;
  salaryMin?: number;
  salaryMax?: number;
  isRemote?: boolean;
  page?: number;
  limit?: number;
}): Promise<PaginatedJobs> {
  const entries = Object.entries(params ?? {})
    .filter(([, v]) => v !== undefined && v !== "" && v !== null)
    .map(([k, v]) => [k, String(v)] as [string, string]);
  const qs = new URLSearchParams(entries).toString();
  return apiRequest(`/jobs${qs ? `?${qs}` : ""}`, authOpts());
}

export function fetchJob(id: string): Promise<JobItem> {
  return apiRequest(`/jobs/${id}`, authOpts());
}

/** Public company profile for the recruiter who owns a job (by their user id). */
export function fetchRecruiterByUserId(
  userId: string,
): Promise<RecruiterPublicProfile> {
  return apiRequest(`/recruiter-profiles/by-user/${userId}`, authOpts());
}

export function trackJobView(id: string): Promise<void> {
  return apiRequest(`/jobs/${id}/view`, { method: "POST", ...authOpts() });
}

// ───────────── Matching ─────────────

export function fetchRecommendedJobs(limit = 20): Promise<RankedJob[]> {
  return apiRequest(`/matching/recommend?limit=${limit}`, authOpts());
}

// ───────────── Applications ─────────────

export function fetchMyApplications(): Promise<ApplicationItem[]> {
  return apiRequest("/applications/my", authOpts());
}

export function applyToJob(payload: {
  jobId: string;
  coverLetter?: string;
  resumeUrl?: string;
}): Promise<ApplicationItem> {
  return apiRequest("/applications", {
    method: "POST",
    body: payload as unknown as Record<string, unknown>,
    ...authOpts(),
  });
}
