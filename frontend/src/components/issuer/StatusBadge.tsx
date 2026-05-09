import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import type {
  ApprovalStatus,
  BatchStatus,
  CredentialStatus,
} from "@/types/issuer";

const CRED_VARIANT: Record<CredentialStatus, BadgeVariant> = {
  pending: "warn",
  issued: "success",
  revoked: "danger",
  reissued: "info",
};

const CRED_LABEL: Record<CredentialStatus, string> = {
  pending: "Pending",
  issued: "Issued",
  revoked: "Revoked",
  reissued: "Reissued",
};

export function CredentialStatusBadge({ status }: { status: CredentialStatus }) {
  return <Badge variant={CRED_VARIANT[status]}>{CRED_LABEL[status]}</Badge>;
}

const APPROVAL_VARIANT: Record<ApprovalStatus, BadgeVariant> = {
  pending: "warn",
  approved: "success",
  rejected: "danger",
};

const APPROVAL_LABEL: Record<ApprovalStatus, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
};

export function ApprovalStatusBadge({ status }: { status: ApprovalStatus }) {
  return <Badge variant={APPROVAL_VARIANT[status]}>{APPROVAL_LABEL[status]}</Badge>;
}

const BATCH_VARIANT: Record<BatchStatus, BadgeVariant> = {
  uploading: "neutral",
  validating: "info",
  processing: "info",
  completed: "success",
  failed: "danger",
  partially_completed: "warn",
};

const BATCH_LABEL: Record<BatchStatus, string> = {
  uploading: "Uploading",
  validating: "Validating",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
  partially_completed: "Partially completed",
};

export function BatchStatusBadge({ status }: { status: BatchStatus }) {
  return <Badge variant={BATCH_VARIANT[status]}>{BATCH_LABEL[status]}</Badge>;
}
