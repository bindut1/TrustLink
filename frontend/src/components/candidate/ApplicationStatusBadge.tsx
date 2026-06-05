"use client";

import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";
import type { ApplicationStatus } from "@/types/candidate";

const VARIANT: Record<ApplicationStatus, BadgeVariant> = {
  applied: "neutral",
  reviewing: "navy",
  shortlisted: "navy",
  interview: "navy",
  offered: "success",
  rejected: "danger",
  withdrawn: "neutral",
};

const KEY: Record<ApplicationStatus, TranslationKey> = {
  applied: "status.app.applied",
  reviewing: "status.app.reviewing",
  shortlisted: "status.app.shortlisted",
  interview: "status.app.interview",
  offered: "status.app.offered",
  rejected: "status.app.rejected",
  withdrawn: "status.app.withdrawn",
};

export function ApplicationStatusBadge({
  status,
}: {
  status: ApplicationStatus;
}) {
  const { t } = useLanguage();
  return <Badge variant={VARIANT[status]}>{t(KEY[status])}</Badge>;
}
