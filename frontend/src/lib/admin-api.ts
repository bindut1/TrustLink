/**
 * Admin API adapter — every admin page calls these functions, which forward to
 * the NestJS backend with the current Bearer token.
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

const authOpts = () => ({ token: getAccessToken() ?? undefined });

// ───────────── Dashboard ─────────────

export function fetchDashboardStats(): Promise<AdminDashboardStats> {
  return apiRequest("/admin/dashboard", authOpts());
}

// ───────────── Users ─────────────

export function fetchUsers(params?: {
  search?: string;
  role?: string;
  status?: string;
}): Promise<AdminUser[]> {
  const entries = Object.entries(params ?? {}).filter(
    ([, v]) => v && v !== "all",
  ) as [string, string][];
  const qs = new URLSearchParams(entries).toString();
  return apiRequest(`/admin/users${qs ? `?${qs}` : ""}`, authOpts());
}

export async function updateUserStatus(
  userId: string,
  status: "active" | "suspended",
): Promise<void> {
  await apiRequest(`/admin/users/${userId}`, {
    method: "PATCH",
    body: { status },
    ...authOpts(),
  });
}

// ───────────── Action overrides ─────────────

export function fetchActions(): Promise<AdminAction[]> {
  return apiRequest("/admin/actions", authOpts());
}

export function fetchUserOverrides(
  userId: string,
): Promise<UserActionOverride[]> {
  return apiRequest(`/admin/users/${userId}/restrictions`, authOpts());
}

export async function setUserOverride(
  userId: string,
  override: UserActionOverride,
): Promise<void> {
  await apiRequest(`/admin/users/${userId}/restrictions`, {
    method: "POST",
    body: override as unknown as Record<string, unknown>,
    ...authOpts(),
  });
}

export async function removeUserOverride(
  userId: string,
  actionId: string,
): Promise<void> {
  await apiRequest(`/admin/users/${userId}/restrictions/${actionId}`, {
    method: "DELETE",
    ...authOpts(),
  });
}

// ───────────── Institutions ─────────────
// The `/institutions` controller doesn't accept a status query yet, so we
// fetch all and filter client-side. The backend returns the Institution entity
// with a `user` relation (id, email, fullName) — flatten to the shape the UI
// expects.

export async function fetchInstitutions(filter?: {
  status?: "all" | "pending" | "approved" | "rejected";
}): Promise<AdminInstitution[]> {
  type RawInst = Omit<AdminInstitution, "contactEmail" | "contactName"> & {
    user?: { email?: string; fullName?: string };
  };
  const raw = await apiRequest<RawInst[]>("/institutions", authOpts());
  const flat: AdminInstitution[] = raw.map((i) => ({
    ...i,
    contactEmail: i.user?.email ?? "—",
    contactName: i.user?.fullName ?? "—",
  }));
  if (!filter?.status || filter.status === "all") return flat;
  return flat.filter((i) => i.approvalStatus === filter.status);
}

export async function approveInstitution(id: string): Promise<void> {
  await apiRequest(`/institutions/${id}/approve`, {
    method: "PATCH",
    body: { approvalStatus: "approved" },
    ...authOpts(),
  });
}

export async function rejectInstitution(
  id: string,
  reason: string,
): Promise<void> {
  await apiRequest(`/institutions/${id}/approve`, {
    method: "PATCH",
    body: { approvalStatus: "rejected", rejectionReason: reason },
    ...authOpts(),
  });
}

// ───────────── Blockchain ─────────────

export function fetchTransactions(filter?: {
  status?: string;
}): Promise<BlockchainTx[]> {
  const qs =
    filter?.status && filter.status !== "all"
      ? `?status=${filter.status}`
      : "";
  return apiRequest(`/admin/blockchain/transactions${qs}`, authOpts());
}
