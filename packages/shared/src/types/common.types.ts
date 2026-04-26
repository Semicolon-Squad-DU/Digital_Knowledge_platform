export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface Notification {
  notification_id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  action_url?: string;
  created_at: string;
}

export type NotificationType =
  | "due_date_reminder"
  | "overdue_alert"
  | "hold_available"
  | "project_approved"
  | "project_changes_requested"
  | "access_request_approved"
  | "access_request_denied"
  | "announcement"
  | "new_upload"
  | "system";

export interface AuditLog {
  log_id: string;
  user_id: string;
  action: AuditAction;
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown>;
  ip_address?: string;
  timestamp: string;
}

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "ACCESS"
  | "LOGIN"
  | "LOGOUT"
  | "DOWNLOAD"
  | "STATUS_CHANGE";

export interface AccessRequest {
  request_id: string;
  user_id: string;
  item_id: string;
  reason: string;
  status: "pending" | "approved" | "denied";
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}
