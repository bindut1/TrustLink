export type ApprovalStatus = "pending" | "approved" | "rejected";

export type CredentialStatus = "pending" | "issued" | "revoked" | "reissued";

/** Aggregates for the issuer dashboard (GET /institutions/me/dashboard). */
export type IssuerDashboard = {
  credentials: {
    total: number;
    onChain: number;
    revoked: number;
    byStatus: { status: string; count: number }[];
  };
  issuanceByMonth: { month: string; count: number }[];
  candidatesReached: number;
  recent: {
    id: string;
    title: string;
    candidateName: string | null;
    status: CredentialStatus;
    issuedDate: string | null;
  }[];
  institution: {
    name: string;
    approvalStatus: ApprovalStatus;
    blockchainAddress: string | null;
  };
};

export type BatchStatus =
  | "uploading"
  | "validating"
  | "processing"
  | "completed"
  | "failed"
  | "partially_completed";

export type Institution = {
  id: string;
  userId: string;
  name: string;
  nameEn?: string | null;
  abbreviation?: string | null;
  institutionType: string;
  taxCode?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  description?: string | null;
  approvalStatus: ApprovalStatus;
  rejectionReason?: string | null;
  blockchainAddress?: string | null;
  signingAddress?: string | null;
  createdAt: string;
};

export type FieldSchema = {
  fields: Array<{
    key: string;
    label: string;
    type: "text" | "number" | "date" | "select" | "textarea" | "skills";
    required?: boolean;
    options?: string[];
    placeholder?: string;
    helpText?: string;
  }>;
};

/** A canonical skill from GET /skills, used by the controlled-vocabulary picker. */
export type SkillCatalogItem = {
  id: string;
  normalized: string;
  name: string;
  category: string | null;
  aliases: string[];
};

export type CredentialType = {
  id: string;
  category: string;
  name: string;
  nameEn?: string | null;
  description?: string | null;
  fieldSchema: FieldSchema;
  isActive: boolean;
};

export type Credential = {
  id: string;
  credentialNumber: string;
  credentialTypeId: string;
  credentialType?: {
    id: string;
    name: string;
    nameEn?: string | null;
    category?: string | null;
  } | null;
  institutionId: string;
  institution?: { id: string; name: string; nameEn?: string | null } | null;
  candidateId: string;
  candidate?: { id: string; fullName: string; email: string; avatarUrl?: string | null } | null;
  title: string;
  issuedDate: string;
  expiryDate?: string | null;
  metadata: Record<string, unknown>;
  status: CredentialStatus;
  credentialHash?: string | null;
  blockchainTxHash?: string | null;
  blockchainBlockNumber?: number | string | null;
  revokedAt?: string | null;
  revocationReason?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BatchImport = {
  id: string;
  institutionId: string;
  initiatedBy: string;
  credentialTypeId: string;
  originalFilename: string;
  status: BatchStatus;
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  errorReport: Array<{ row: number; field?: string; error: string }>;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CandidateLookupResult = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
};

export type IssueCredentialPayload = {
  credentialNumber: string;
  credentialTypeId: string;
  candidateId: string;
  title: string;
  issuedDate: string;
  expiryDate?: string;
  metadata: Record<string, unknown>;
};
