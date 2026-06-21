export enum UserRole {
  ADMIN = 'admin',
  ISSUER = 'issuer',
  CANDIDATE = 'candidate',
  RECRUITER = 'recruiter',
}

export enum AccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum CredentialStatus {
  PENDING = 'pending',
  ISSUED = 'issued',
  REVOKED = 'revoked',
  REISSUED = 'reissued',
}

export enum TxStatus {
  QUEUED = 'queued',
  SUBMITTED = 'submitted',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
}

export enum TxType {
  ISSUE_CREDENTIAL = 'issue_credential',
  REVOKE_CREDENTIAL = 'revoke_credential',
  ADD_ISSUER = 'add_issuer',
  REMOVE_ISSUER = 'remove_issuer',
}

export enum ApplicationStatus {
  APPLIED = 'applied',
  REVIEWING = 'reviewing',
  SHORTLISTED = 'shortlisted',
  INTERVIEW = 'interview',
  OFFERED = 'offered',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

export enum JobStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  CLOSED = 'closed',
  EXPIRED = 'expired',
}

export enum CredentialCategory {
  DEGREE = 'degree',
  IT_CERTIFICATE = 'it_certificate',
  LANGUAGE_CERTIFICATE = 'language_certificate',
  AWARD = 'award',
  PROFESSIONAL_CERTIFICATE = 'professional_certificate',
  OTHER = 'other',
}

export enum VerificationResult {
  VALID = 'valid',
  INVALID = 'invalid',
  REVOKED = 'revoked',
  NOT_FOUND = 'not_found',
  ERROR = 'error',
}

export enum JobInvitationStatus {
  PENDING = 'pending',
  DECLINED = 'declined',
}

export enum NotificationType {
  CREDENTIAL_ISSUED = 'credential_issued',
  CREDENTIAL_REVOKED = 'credential_revoked',
  CREDENTIAL_REISSUED = 'credential_reissued',
  APPLICATION_RECEIVED = 'application_received',
  APPLICATION_STATUS_CHANGED = 'application_status_changed',
  JOB_RECOMMENDATION = 'job_recommendation',
  INSTITUTION_APPROVED = 'institution_approved',
  INSTITUTION_REJECTED = 'institution_rejected',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
}
