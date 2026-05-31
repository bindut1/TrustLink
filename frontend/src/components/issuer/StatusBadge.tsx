"use client";

import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";
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

const CRED_KEY: Record<CredentialStatus, TranslationKey> = {
  pending: "status.cred.pending",
  issued: "status.cred.issued",
  revoked: "status.cred.revoked",
  reissued: "status.cred.reissued",
};

export function CredentialStatusBadge({ status }: { status: CredentialStatus }) {
  const { t } = useLanguage();
  return <Badge variant={CRED_VARIANT[status]}>{t(CRED_KEY[status])}</Badge>;
}

const APPROVAL_VARIANT: Record<ApprovalStatus, BadgeVariant> = {
  pending: "warn",
  approved: "success",
  rejected: "danger",
};

const APPROVAL_KEY: Record<ApprovalStatus, TranslationKey> = {
  pending: "status.approval.pending",
  approved: "status.approval.approved",
  rejected: "status.approval.rejected",
};

export function ApprovalStatusBadge({ status }: { status: ApprovalStatus }) {
  const { t } = useLanguage();
  return (
    <Badge variant={APPROVAL_VARIANT[status]}>{t(APPROVAL_KEY[status])}</Badge>
  );
}

const BATCH_VARIANT: Record<BatchStatus, BadgeVariant> = {
  uploading: "neutral",
  validating: "info",
  processing: "info",
  completed: "success",
  failed: "danger",
  partially_completed: "warn",
};

const BATCH_KEY: Record<BatchStatus, TranslationKey> = {
  uploading: "status.batch.uploading",
  validating: "status.batch.validating",
  processing: "status.batch.processing",
  completed: "status.batch.completed",
  failed: "status.batch.failed",
  partially_completed: "status.batch.partially_completed",
};

export function BatchStatusBadge({ status }: { status: BatchStatus }) {
  const { t } = useLanguage();
  return <Badge variant={BATCH_VARIANT[status]}>{t(BATCH_KEY[status])}</Badge>;
}
