/**
 * Admin API adapter. Currently returns mock data because the
 * `/admin/*` endpoints aren't implemented on the backend yet. Swap each
 * function to call `apiRequest()` once those endpoints exist — pages don't
 * need to change.
 */

import { apiRequest } from "./api";
import { getAccessToken } from "./auth-storage";
import type {
  AdminAction,
  AdminDashboardStats,
  AdminInstitution,
  AdminUser,
  BlockchainTx,
  UserActionOverride,
} from "@/types/admin";

const USE_MOCK = true;

// ─────────────────────────── MOCK DATA ───────────────────────────

const MOCK_USERS: AdminUser[] = [
  { id: "u1", email: "admin@trustlink.io", fullName: "Linh Nguyen", role: "admin", status: "active", emailVerified: true, lastLoginAt: "2026-05-07T08:14:00Z", createdAt: "2026-01-04T10:00:00Z" },
  { id: "u2", email: "registrar@hust.edu.vn", fullName: "Hanoi University of Science and Technology", role: "issuer", status: "active", emailVerified: true, lastLoginAt: "2026-05-06T03:20:00Z", createdAt: "2026-02-12T10:00:00Z" },
  { id: "u3", email: "tuyendung@fpt.com.vn", fullName: "FPT Software Recruiting", role: "recruiter", status: "active", emailVerified: true, lastLoginAt: "2026-05-07T01:42:00Z", createdAt: "2026-02-20T10:00:00Z" },
  { id: "u4", email: "amara.okafor@example.com", fullName: "Amara Okafor", role: "candidate", status: "active", emailVerified: true, lastLoginAt: "2026-05-07T05:11:00Z", createdAt: "2026-03-01T10:00:00Z" },
  { id: "u5", email: "marcus.webb@example.com", fullName: "Marcus Webb", role: "candidate", status: "suspended", emailVerified: true, lastLoginAt: "2026-04-22T02:00:00Z", createdAt: "2026-03-04T10:00:00Z" },
  { id: "u6", email: "registrar@uet.vnu.edu.vn", fullName: "VNU University of Engineering and Technology", role: "issuer", status: "pending_verification", emailVerified: false, lastLoginAt: null, createdAt: "2026-05-05T10:00:00Z" },
  { id: "u7", email: "hr@viettel.com.vn", fullName: "Viettel Group HR", role: "recruiter", status: "active", emailVerified: true, lastLoginAt: "2026-05-06T09:00:00Z", createdAt: "2026-03-15T10:00:00Z" },
  { id: "u8", email: "priya.raman@example.com", fullName: "Priya Raman", role: "candidate", status: "active", emailVerified: true, lastLoginAt: "2026-05-07T03:55:00Z", createdAt: "2026-03-22T10:00:00Z" },
];

const MOCK_INSTITUTIONS: AdminInstitution[] = [
  { id: "i1", userId: "u2", name: "Hanoi University of Science and Technology", institutionType: "university", taxCode: "0100100100", website: "https://hust.edu.vn", city: "Hanoi", approvalStatus: "approved", blockchainAddress: "0x4a8f9c2d3e1b5a7f9c2d3e1b5a7f4a8f9c2db21c", contactEmail: "registrar@hust.edu.vn", contactName: "Linh Tran", createdAt: "2026-02-12T10:00:00Z" },
  { id: "i2", userId: "u6", name: "VNU University of Engineering and Technology", institutionType: "university", taxCode: "0100200200", website: "https://uet.vnu.edu.vn", city: "Hanoi", approvalStatus: "pending", blockchainAddress: null, contactEmail: "registrar@uet.vnu.edu.vn", contactName: "Hieu Vu", createdAt: "2026-05-05T10:00:00Z" },
  { id: "i3", userId: "u9", name: "FUNiX Online Bootcamp", institutionType: "training_provider", taxCode: "0102345678", website: "https://funix.edu.vn", city: "Hanoi", approvalStatus: "pending", blockchainAddress: null, contactEmail: "credentials@funix.edu.vn", contactName: "Trang Le", createdAt: "2026-05-06T14:00:00Z" },
  { id: "i4", userId: "u10", name: "TopCV Skill Academy", institutionType: "training_provider", taxCode: "0103456789", website: "https://topcv.vn", city: "Ho Chi Minh City", approvalStatus: "pending", blockchainAddress: null, contactEmail: "academy@topcv.vn", contactName: "Khanh Pham", createdAt: "2026-05-07T03:00:00Z" },
  { id: "i5", userId: "u11", name: "RMIT University Vietnam", institutionType: "university", taxCode: "0100333444", website: "https://rmit.edu.vn", city: "Ho Chi Minh City", approvalStatus: "rejected", blockchainAddress: null, rejectionReason: "Documentation incomplete — please resubmit tax registration certificate.", contactEmail: "registrar@rmit.edu.vn", contactName: "Anh Dao", createdAt: "2026-04-28T10:00:00Z" },
];

const MOCK_TX: BlockchainTx[] = [
  { id: "tx1", transactionType: "issue_credential", status: "confirmed", txHash: "0x4a8f9c2d3e1b5a7f9c2d3e1b5a7f9c2d3e1b5a7f9c2d3e1b5a7fb21c", blockNumber: 53445102, contractMethod: "issueCredential", initiatedByName: "HUST · Linh Tran", retryCount: 0, errorMessage: null, queuedAt: "2026-05-07T07:14:22Z", confirmedAt: "2026-05-07T07:14:48Z" },
  { id: "tx2", transactionType: "issue_credential", status: "submitted", txHash: "0x7c2d3e1b5a7f9c2d3e1b5a7f9c2d3e1b5a7f9c2d3e1b5a7f9c2df481", blockNumber: null, contractMethod: "issueCredential", initiatedByName: "HUST · Linh Tran", retryCount: 0, errorMessage: null, queuedAt: "2026-05-07T07:30:10Z", confirmedAt: null },
  { id: "tx3", transactionType: "revoke_credential", status: "confirmed", txHash: "0x9e1a4b7f9c2d3e1b5a7f9c2d3e1b5a7f9c2d3e1b5a7f9c2d3e1b3b7f", blockNumber: 53444008, contractMethod: "revokeCredential", initiatedByName: "HUST · Linh Tran", retryCount: 0, errorMessage: null, queuedAt: "2026-05-06T22:01:00Z", confirmedAt: "2026-05-06T22:01:33Z" },
  { id: "tx4", transactionType: "add_issuer", status: "confirmed", txHash: "0x2b6c8d92f4e21a8b8d3f6e2a1c9b4f73", blockNumber: 53430011, contractMethod: "addIssuer", initiatedByName: "Admin · Linh Nguyen", retryCount: 0, errorMessage: null, queuedAt: "2026-05-04T09:00:00Z", confirmedAt: "2026-05-04T09:00:28Z" },
  { id: "tx5", transactionType: "issue_credential", status: "queued", txHash: null, blockNumber: null, contractMethod: "issueCredential", initiatedByName: "HUST · Linh Tran", retryCount: 0, errorMessage: null, queuedAt: "2026-05-07T08:02:11Z", confirmedAt: null },
  { id: "tx6", transactionType: "issue_credential", status: "failed", txHash: "0xf4e21a8b8d3f6e2a1c9b4f731c9b4f73", blockNumber: null, contractMethod: "issueCredential", initiatedByName: "HUST · Linh Tran", retryCount: 3, errorMessage: "Insufficient gas — bumped fee on retries but RPC reverted with 'execution reverted'.", queuedAt: "2026-05-06T14:22:00Z", confirmedAt: null },
  { id: "tx7", transactionType: "issue_credential", status: "retrying", txHash: null, blockNumber: null, contractMethod: "issueCredential", initiatedByName: "FUNiX · Trang Le", retryCount: 1, errorMessage: "Nonce too low, retrying with refreshed nonce.", queuedAt: "2026-05-07T07:55:00Z", confirmedAt: null },
];

const MOCK_ACTIONS: AdminAction[] = [
  { id: "a1", code: "credential.issue", name: "Issue credentials", module: "credentials" },
  { id: "a2", code: "credential.revoke", name: "Revoke credentials", module: "credentials" },
  { id: "a3", code: "credential.batch_import", name: "Batch import credentials", module: "credentials" },
  { id: "a4", code: "credential.verify", name: "Verify credentials", module: "credentials" },
  { id: "a5", code: "job.create", name: "Create jobs", module: "jobs" },
  { id: "a6", code: "job.edit", name: "Edit jobs", module: "jobs" },
  { id: "a7", code: "application.create", name: "Submit applications", module: "applications" },
  { id: "a8", code: "application.review", name: "Review applications", module: "applications" },
];

const MOCK_OVERRIDES: Record<string, UserActionOverride[]> = {
  u5: [
    { actionId: "a7", isEnabled: false, reason: "Spam applications detected on 2026-04-21." },
  ],
};

const MOCK_STATS: AdminDashboardStats = {
  users: { total: 1284, byRole: { admin: 3, issuer: 47, candidate: 1102, recruiter: 132 } },
  credentials: { total: 8421, issued: 8190, revoked: 231 },
  institutions: { total: 47, pending: 3, approved: 43 },
  transactions: { queued: 4, failed: 2, confirmed: 8190 },
};

// ─────────────────────────── DELAY HELPER ───────────────────────────

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─────────────────────────── PUBLIC API ───────────────────────────

export async function fetchDashboardStats(): Promise<AdminDashboardStats> {
  if (USE_MOCK) {
    await wait(200);
    return MOCK_STATS;
  }
  return apiRequest("/admin/dashboard", { token: getAccessToken() ?? undefined });
}

export async function fetchUsers(params?: {
  search?: string;
  role?: string;
  status?: string;
}): Promise<AdminUser[]> {
  if (USE_MOCK) {
    await wait(220);
    let list = [...MOCK_USERS];
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          u.fullName.toLowerCase().includes(q),
      );
    }
    if (params?.role && params.role !== "all") {
      list = list.filter((u) => u.role === params.role);
    }
    if (params?.status && params.status !== "all") {
      list = list.filter((u) => u.status === params.status);
    }
    return list;
  }
  const qs = new URLSearchParams(
    Object.entries(params ?? {}).filter(([, v]) => v) as [string, string][],
  ).toString();
  return apiRequest(`/admin/users${qs ? `?${qs}` : ""}`, {
    token: getAccessToken() ?? undefined,
  });
}

export async function updateUserStatus(
  userId: string,
  status: "active" | "suspended",
): Promise<void> {
  if (USE_MOCK) {
    await wait(300);
    const u = MOCK_USERS.find((x) => x.id === userId);
    if (u) u.status = status;
    return;
  }
  await apiRequest(`/admin/users/${userId}`, {
    method: "PATCH",
    body: { status },
    token: getAccessToken() ?? undefined,
  });
}

export async function fetchActions(): Promise<AdminAction[]> {
  if (USE_MOCK) {
    await wait(120);
    return MOCK_ACTIONS;
  }
  return apiRequest("/admin/actions", { token: getAccessToken() ?? undefined });
}

export async function fetchUserOverrides(
  userId: string,
): Promise<UserActionOverride[]> {
  if (USE_MOCK) {
    await wait(120);
    return MOCK_OVERRIDES[userId] ?? [];
  }
  return apiRequest(`/admin/users/${userId}/restrictions`, {
    token: getAccessToken() ?? undefined,
  });
}

export async function setUserOverride(
  userId: string,
  override: UserActionOverride,
): Promise<void> {
  if (USE_MOCK) {
    await wait(250);
    const list = MOCK_OVERRIDES[userId] ?? [];
    const idx = list.findIndex((o) => o.actionId === override.actionId);
    if (idx >= 0) list[idx] = override;
    else list.push(override);
    MOCK_OVERRIDES[userId] = list;
    return;
  }
  await apiRequest(`/admin/users/${userId}/restrictions`, {
    method: "POST",
    body: override as unknown as Record<string, unknown>,
    token: getAccessToken() ?? undefined,
  });
}

export async function removeUserOverride(
  userId: string,
  actionId: string,
): Promise<void> {
  if (USE_MOCK) {
    await wait(200);
    MOCK_OVERRIDES[userId] = (MOCK_OVERRIDES[userId] ?? []).filter(
      (o) => o.actionId !== actionId,
    );
    return;
  }
  await apiRequest(`/admin/users/${userId}/restrictions/${actionId}`, {
    method: "DELETE",
    token: getAccessToken() ?? undefined,
  });
}

export async function fetchInstitutions(filter?: {
  status?: "all" | "pending" | "approved" | "rejected";
}): Promise<AdminInstitution[]> {
  if (USE_MOCK) {
    await wait(220);
    if (!filter || !filter.status || filter.status === "all") {
      return [...MOCK_INSTITUTIONS];
    }
    return MOCK_INSTITUTIONS.filter((i) => i.approvalStatus === filter.status);
  }
  const qs = filter?.status ? `?status=${filter.status}` : "";
  return apiRequest(`/institutions${qs}`, {
    token: getAccessToken() ?? undefined,
  });
}

export async function approveInstitution(id: string): Promise<void> {
  if (USE_MOCK) {
    await wait(400);
    const inst = MOCK_INSTITUTIONS.find((i) => i.id === id);
    if (inst) {
      inst.approvalStatus = "approved";
      inst.blockchainAddress = `0x${Math.random().toString(16).slice(2, 42).padEnd(40, "0")}`;
    }
    return;
  }
  await apiRequest(`/institutions/${id}/approve`, {
    method: "PATCH",
    body: { approvalStatus: "approved" },
    token: getAccessToken() ?? undefined,
  });
}

export async function rejectInstitution(
  id: string,
  reason: string,
): Promise<void> {
  if (USE_MOCK) {
    await wait(300);
    const inst = MOCK_INSTITUTIONS.find((i) => i.id === id);
    if (inst) {
      inst.approvalStatus = "rejected";
      inst.rejectionReason = reason;
    }
    return;
  }
  await apiRequest(`/institutions/${id}/approve`, {
    method: "PATCH",
    body: { approvalStatus: "rejected", rejectionReason: reason },
    token: getAccessToken() ?? undefined,
  });
}

export async function fetchTransactions(filter?: {
  status?: string;
}): Promise<BlockchainTx[]> {
  if (USE_MOCK) {
    await wait(220);
    if (!filter?.status || filter.status === "all") return [...MOCK_TX];
    return MOCK_TX.filter((t) => t.status === filter.status);
  }
  const qs = filter?.status ? `?status=${filter.status}` : "";
  return apiRequest(`/admin/blockchain/transactions${qs}`, {
    token: getAccessToken() ?? undefined,
  });
}
