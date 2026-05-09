import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import type { JobStatus } from "@/types/recruiter-app";

const VARIANT: Record<JobStatus, BadgeVariant> = {
  draft: "neutral",
  open: "success",
  closed: "warn",
  expired: "danger",
};

const LABEL: Record<JobStatus, string> = {
  draft: "Draft",
  open: "Open",
  closed: "Closed",
  expired: "Expired",
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return <Badge variant={VARIANT[status]}>{LABEL[status]}</Badge>;
}
