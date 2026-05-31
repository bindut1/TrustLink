"use client";

import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";
import type { JobStatus } from "@/types/recruiter-app";

const VARIANT: Record<JobStatus, BadgeVariant> = {
  draft: "neutral",
  open: "success",
  closed: "warn",
  expired: "danger",
};

const KEY: Record<JobStatus, TranslationKey> = {
  draft: "status.job.draft",
  open: "status.job.open",
  closed: "status.job.closed",
  expired: "status.job.expired",
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const { t } = useLanguage();
  return <Badge variant={VARIANT[status]}>{t(KEY[status])}</Badge>;
}
