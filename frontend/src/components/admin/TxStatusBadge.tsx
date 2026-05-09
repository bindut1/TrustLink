import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import type { TxStatus } from "@/types/admin";

const STATUS_VARIANT: Record<TxStatus, BadgeVariant> = {
  queued: "neutral",
  submitted: "info",
  retrying: "warn",
  confirmed: "success",
  failed: "danger",
};

const STATUS_LABEL: Record<TxStatus, string> = {
  queued: "Queued",
  submitted: "Submitted",
  retrying: "Retrying",
  confirmed: "Confirmed",
  failed: "Failed",
};

export function TxStatusBadge({ status }: { status: TxStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
