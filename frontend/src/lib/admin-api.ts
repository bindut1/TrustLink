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
  AuditLog,
  BlockchainTx,
  CredentialType,
  SkillCatalogEntry,
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

export function fetchActions(role?: string): Promise<AdminAction[]> {
  const qs = role ? `?role=${encodeURIComponent(role)}` : "";
  return apiRequest(`/admin/actions${qs}`, authOpts());
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

// ───────────── Credential types ─────────────

export function fetchCredentialTypes(): Promise<CredentialType[]> {
  return apiRequest("/credential-types", authOpts());
}

// Admin management list — includes inactive types so they can be re-enabled.
export function fetchAllCredentialTypes(): Promise<CredentialType[]> {
  return apiRequest("/credential-types/all", authOpts());
}

export function createCredentialType(payload: {
  category: string;
  name: string;
  nameEn?: string;
  description?: string;
  fieldSchema: { fields: Array<Record<string, unknown>> };
  isActive?: boolean;
}): Promise<CredentialType> {
  return apiRequest("/credential-types", {
    method: "POST",
    body: payload,
    ...authOpts(),
  });
}

export function updateCredentialType(
  id: string,
  payload: Partial<{
    category: string;
    name: string;
    nameEn: string;
    description: string;
    fieldSchema: { fields: Array<Record<string, unknown>> };
    isActive: boolean;
  }>,
): Promise<CredentialType> {
  return apiRequest(`/credential-types/${id}`, {
    method: "PATCH",
    body: payload,
    ...authOpts(),
  });
}

// ───────────── Skill catalog ─────────────

export function fetchAllSkills(): Promise<SkillCatalogEntry[]> {
  return apiRequest("/skills/all", authOpts());
}

export function createSkill(payload: {
  name: string;
  normalized?: string;
  category?: string;
  aliases?: string[];
  isActive?: boolean;
}): Promise<SkillCatalogEntry> {
  return apiRequest("/skills", { method: "POST", body: payload, ...authOpts() });
}

export function updateSkill(
  id: string,
  payload: Partial<{
    name: string;
    category: string;
    aliases: string[];
    isActive: boolean;
  }>,
): Promise<SkillCatalogEntry> {
  return apiRequest(`/skills/${id}`, {
    method: "PATCH",
    body: payload,
    ...authOpts(),
  });
}

export function deleteSkill(id: string): Promise<{ deleted: boolean }> {
  return apiRequest(`/skills/${id}`, { method: "DELETE", ...authOpts() });
}

// ───────────── Audit logs ─────────────

export function fetchAuditLogs(filter?: {
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  limit?: number;
}): Promise<AuditLog[]> {
  const entries = Object.entries(filter ?? {}).filter(
    ([, v]) => v !== undefined && v !== "" && v !== null,
  ) as [string, string | number][];
  const qs = new URLSearchParams(
    entries.map(([k, v]) => [k, String(v)]),
  ).toString();
  return apiRequest(`/admin/audit-logs${qs ? `?${qs}` : ""}`, authOpts());
}
