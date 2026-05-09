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
