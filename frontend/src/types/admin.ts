import type { UserRole } from "./auth";

export type AccountStatus =
  | "active"
  | "inactive"
  | "suspended"
  | "pending_verification";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export type TxStatus =
  | "queued"
  | "submitted"
  | "confirmed"
  | "failed"
  | "retrying";

export type TxType =
  | "issue_credential"
  | "revoke_credential"
  | "add_issuer"
  | "remove_issuer";

export type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: AccountStatus;
  emailVerified: boolean;
  avatarUrl?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
};

export type AdminInstitution = {
  id: string;
  userId: string;
  name: string;
  institutionType: string;
  taxCode?: string | null;
  website?: string | null;
  city?: string | null;
  approvalStatus: ApprovalStatus;
  blockchainAddress?: string | null;
  rejectionReason?: string | null;
  contactEmail: string;
  contactName: string;
  createdAt: string;
};

export type BlockchainTx = {
  id: string;
  transactionType: TxType;
  status: TxStatus;
  txHash?: string | null;
  blockNumber?: number | null;
  contractMethod: string;
  initiatedByName: string;
  retryCount: number;
  errorMessage?: string | null;
  queuedAt: string;
  confirmedAt?: string | null;
};

export type AdminAction = {
  id: string;
  code: string;
  name: string;
  module: string;
};

export type UserActionOverride = {
  actionId: string;
  isEnabled: boolean;
  reason?: string | null;
};

export type AdminDashboardStats = {
  users: { total: number; byRole: Record<UserRole, number> };
  credentials: { total: number; issued: number; revoked: number };
  institutions: { total: number; pending: number; approved: number };
  transactions: { queued: number; failed: number; confirmed: number };
};

export type CredentialCategory =
  | "degree"
  | "it_certificate"
  | "language_certificate"
  | "award"
  | "professional_certificate"
  | "other";

export type CredentialTypeField = {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
};

export type CredentialType = {
  id: string;
  category: CredentialCategory;
  name: string;
  nameEn?: string | null;
  description?: string | null;
  fieldSchema: { fields: CredentialTypeField[] };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AuditLog = {
  id: string;
  userId: string | null;
  user?: { id: string; email: string; fullName: string } | null;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

/** A canonical skill catalog entry (admin management view). */
export type SkillCatalogEntry = {
  id: string;
  normalized: string;
  name: string;
  category: string | null;
  aliases: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
