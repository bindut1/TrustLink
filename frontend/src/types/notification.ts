export type NotificationType =
  | "credential_issued"
  | "credential_revoked"
  | "credential_reissued"
  | "application_received"
  | "application_status_changed"
  | "job_recommendation"
  | "institution_approved"
  | "institution_rejected"
  | "system_announcement";

export type NotificationItem = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceType?: string | null;
  referenceId?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
};
