// Group 1: Identity & Access
export { User } from './user.entity';
export { Institution } from './institution.entity';
export { CandidateProfile } from './candidate-profile.entity';
export { RecruiterProfile } from './recruiter-profile.entity';
export { RefreshToken } from './refresh-token.entity';
export { PasswordResetToken } from './password-reset-token.entity';

// Group 2: Hybrid RBAC
export { Action } from './action.entity';
export { RoleAction } from './role-action.entity';
export { UserActionOverride } from './user-action-override.entity';

// Group 3: Credential Management
export { CredentialType } from './credential-type.entity';
export { Credential } from './credential.entity';
export { BatchImport } from './batch-import.entity';
export { VerificationCache } from './verification-cache.entity';

// Group 4: Blockchain
export { BlockchainTransaction } from './blockchain-transaction.entity';

// Group 5: AI Matching
export { CandidateSkill } from './candidate-skill.entity';
export { CandidateEmbedding } from './candidate-embedding.entity';
export { JobEmbedding } from './job-embedding.entity';

// Group 6: Recruitment
export { Job } from './job.entity';
export { Application } from './application.entity';
export { MatchScore } from './match-score.entity';

// Group 7: System
export { Notification } from './notification.entity';
export { AuditLog } from './audit-log.entity';
