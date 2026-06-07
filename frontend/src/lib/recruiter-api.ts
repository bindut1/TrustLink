/**
 * Recruiter API adapter — every recruiter page calls these. Forwards to
 * NestJS with the current Bearer token.
 */

import { apiRequest } from "./api";
import { getAccessToken } from "./auth-storage";
import type {
  ApplicationItem,
  ApplicationStatus,
  JobItem,
  PaginatedJobs,
} from "@/types/candidate";
import type {
  ApplicationWithCandidate,
  CreateJobPayload,
  JobStatus,
  RankedCandidate,
  RecruiterDashboard,
  RecruiterProfile,
  UpdateRecruiterProfilePayload,
} from "@/types/recruiter-app";
import type { VerificationResult } from "./candidate-api";

const authOpts = () => ({ token: getAccessToken() ?? undefined });

// ───────────── Profile ─────────────

export function fetchMyRecruiterProfile(): Promise<RecruiterProfile> {
  return apiRequest("/recruiter-profiles/me", authOpts());
}

/** Aggregate counts + applications trend for the recruiter dashboard. */
export function fetchRecruiterDashboard(): Promise<RecruiterDashboard> {
  return apiRequest("/recruiter-profiles/me/dashboard", authOpts());
}

export function updateMyRecruiterProfile(
  patch: UpdateRecruiterProfilePayload,
): Promise<RecruiterProfile> {
  return apiRequest("/recruiter-profiles/me", {
    method: "PATCH",
    body: patch as Record<string, unknown>,
    ...authOpts(),
  });
}

// ───────────── Jobs ─────────────

export function fetchJobs(params?: {
  search?: string;
  city?: string;
  status?: JobStatus | "all";
  recruiterId?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedJobs> {
  const entries = Object.entries(params ?? {})
    .filter(([, v]) => v !== undefined && v !== "" && v !== "all")
    .map(([k, v]) => [k, String(v)] as [string, string]);
  const qs = new URLSearchParams(entries).toString();
  return apiRequest(`/jobs${qs ? `?${qs}` : ""}`, authOpts());
}

export function fetchJob(id: string): Promise<JobItem> {
  return apiRequest(`/jobs/${id}`, authOpts());
}

export function createJob(payload: CreateJobPayload): Promise<JobItem> {
  return apiRequest("/jobs", {
    method: "POST",
    body: payload as unknown as Record<string, unknown>,
    ...authOpts(),
  });
}

export function updateJob(
  id: string,
  patch: Partial<CreateJobPayload> & { status?: JobStatus },
): Promise<JobItem> {
  return apiRequest(`/jobs/${id}`, {
    method: "PATCH",
    body: patch as unknown as Record<string, unknown>,
    ...authOpts(),
  });
}

// ───────────── Matching ─────────────

export function fetchRecommendedCandidates(
  jobId: string,
  limit = 20,
): Promise<RankedCandidate[]> {
  return apiRequest(
    `/jobs/${jobId}/recommended-candidates?limit=${limit}`,
    authOpts(),
  );
}

// ───────────── Applications ─────────────

export function fetchJobApplications(
  jobId: string,
): Promise<ApplicationWithCandidate[]> {
  return apiRequest(`/jobs/${jobId}/applications`, authOpts());
}

export function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
  recruiterNotes?: string,
): Promise<ApplicationItem> {
  return apiRequest(`/applications/${applicationId}`, {
    method: "PATCH",
    body: {
      status,
      ...(recruiterNotes !== undefined ? { recruiterNotes } : {}),
    },
    ...authOpts(),
  });
}

// ───────────── Verify candidate ─────────────

export type CandidateVerificationItem = {
  credentialId: string;
  title: string;
  result: VerificationResult["result"];
  onChainVerified: boolean;
  vcSignatureValid: boolean;
  issuerAuthorized: boolean;
  contentIntegrityValid: boolean;
};

/**
 * Verify all credentials for a candidate by iterating their credential ids.
 * Backend has no `/candidates/:id/verify-all` shortcut, so we do it client-side
 * via the existing per-credential cache endpoint.
 */
export async function verifyAllCredentialsForCandidate(
  candidateId: string,
): Promise<CandidateVerificationItem[]> {
  // Recruiter has `credential.view` action and can list credentials by candidate id.
  const list = await apiRequest<
    { id: string; title: string }[]
  >(`/credentials?candidateId=${candidateId}`, authOpts());

  if (list.length === 0) return [];

  const verified = await Promise.all(
    list.map(async (c) => {
      try {
        const r = await apiRequest<VerificationResult>(
          `/credentials/${c.id}/verify`,
          authOpts(),
        );
        return {
          credentialId: c.id,
          title: c.title,
          result: r.result,
          onChainVerified: r.onChainVerified,
          vcSignatureValid: r.vcSignatureValid,
          issuerAuthorized: r.issuerAuthorized,
          contentIntegrityValid: r.contentIntegrityValid,
        };
      } catch {
        return {
          credentialId: c.id,
          title: c.title,
          result: "error" as const,
          onChainVerified: false,
          vcSignatureValid: false,
          issuerAuthorized: false,
          contentIntegrityValid: false,
        };
      }
    }),
  );

  return verified;
}
