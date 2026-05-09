import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import type { ApplicationStatus } from "@/types/candidate";

const VARIANT: Record<ApplicationStatus, BadgeVariant> = {
  applied: "info",
  reviewing: "info",
  shortlisted: "accent",
  interview: "accent",
  offered: "success",
  rejected: "danger",
  withdrawn: "neutral",
};

const LABEL: Record<ApplicationStatus, string> = {
  applied: "Applied",
  reviewing: "Reviewing",
  shortlisted: "Shortlisted",
  interview: "Interview",
  offered: "Offered",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export function ApplicationStatusBadge({
  status,
}: {
  status: ApplicationStatus;
}) {
  return <Badge variant={VARIANT[status]}>{LABEL[status]}</Badge>;
}
