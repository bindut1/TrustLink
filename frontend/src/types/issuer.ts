export type ApprovalStatus = "pending" | "approved" | "rejected";

export type CredentialStatus = "pending" | "issued" | "revoked" | "reissued";

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
  createdAt: string;
};

export type FieldSchema = {
  fields: Array<{
    key: string;
    label: string;
    type: "text" | "number" | "date" | "select" | "textarea";
    required?: boolean;
    options?: string[];
    placeholder?: string;
    helpText?: string;
  }>;
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
  institutionId: string;
  candidateId: string;
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
