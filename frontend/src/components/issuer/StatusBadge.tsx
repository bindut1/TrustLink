"use client";

import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { StatusPill, type StatusTone } from "@/components/ui/StatusPill";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";
import type {
  ApprovalStatus,
  BatchStatus,
  Credential,
  CredentialStatus,
} from "@/types/issuer";

/**
 * On-chain-aware status pill for a credential: an issued/reissued credential
 * with a tx hash reads as "On-chain" (teal); pending=warn; revoked=danger.
 */
export function CredentialStatusPill({ credential }: { credential: Credential }) {
  const { t } = useLanguage();
  const onChain = Boolean(credential.blockchainTxHash);
  const map: Record<CredentialStatus, { tone: StatusTone; labelKey: TranslationKey }> = {
    issued: onChain
      ? { tone: "on-chain", labelKey: "candidate.credentials.onChain" }
      : { tone: "verified", labelKey: "status.cred.issued" },
    reissued: { tone: "on-chain", labelKey: "status.cred.reissued" },
    pending: { tone: "pending", labelKey: "status.cred.pending" },
    revoked: { tone: "revoked", labelKey: "status.cred.revoked" },
  };
  const pill = map[credential.status];
  return <StatusPill tone={pill.tone}>{t(pill.labelKey)}</StatusPill>;
}

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
