"use client";

import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";
import type { TxStatus } from "@/types/admin";

const STATUS_VARIANT: Record<TxStatus, BadgeVariant> = {
  queued: "neutral",
  submitted: "info",
  retrying: "warn",
  confirmed: "success",
  failed: "danger",
};

const STATUS_KEY: Record<TxStatus, TranslationKey> = {
  queued: "status.tx.queued",
  submitted: "status.tx.submitted",
  retrying: "status.tx.retrying",
  confirmed: "status.tx.confirmed",
  failed: "status.tx.failed",
};

export function TxStatusBadge({ status }: { status: TxStatus }) {
  const { t } = useLanguage();
  return <Badge variant={STATUS_VARIANT[status]}>{t(STATUS_KEY[status])}</Badge>;
}
