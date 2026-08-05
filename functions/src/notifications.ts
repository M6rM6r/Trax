import * as admin from "firebase-admin";

const db = admin.firestore();

export type NotificationType =
  | "attendance"
  | "late_arrival"
  | "geofence_breach"
  | "anomaly_detected"
  | "check_out"
  | "reminder"
  | "system"
  | "announcement"
  | "check_in"
  | "check_out_early"
  | "shift_change"
  | "overtime"
  | "absence"
  | "leave_request"
  | "leave_approved"
  | "leave_rejected"
  | "payroll"
  | "document"
  | "meeting"
  | "training"
  | "emergency"
  | "maintenance"
  | "policy_update"
  | "birthday"
  | "work_anniversary"
  | "performance_review"
  | "schedule_change"
  | "location_change"
  | "device_change";

export type NotificationTargetRole = "company" | "employee" | "all";

export interface NotificationPayload {
  companyId: string;
  targetRole: NotificationTargetRole;
  employeeId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, string>;
  priority?: "low" | "normal" | "high";
}

/**
 * Persist a notification to Firestore so both web (company) and mobile (employee)
 * clients can display it, mark it as read, and keep history in sync.
 */
export async function createNotification(payload: NotificationPayload): Promise<string> {
  const {
    companyId,
    targetRole,
    employeeId,
    type,
    title,
    message,
    data,
    priority = "normal",
  } = payload;

  if (!companyId || !title?.trim() || !message?.trim()) {
    throw new Error("companyId, title, and message are required");
  }

  const doc: Record<string, unknown> = {
    company_id: companyId,
    target_role: targetRole,
    employee_id: employeeId ?? null,
    type,
    title: title.trim(),
    message: message.trim(),
    data: data ?? {},
    priority,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    read_by: [],
    archived_by: [],
  };

  const ref = await db.collection("notifications").add(doc);
  return ref.id;
}

/**
 * Mark a notification as read for a specific user.
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<void> {
  if (!notificationId || !userId) return;
  const ref = db.collection("notifications").doc(notificationId);
  await ref.update({
    read_by: admin.firestore.FieldValue.arrayUnion(userId),
  });
}

/**
 * Archive a notification for a specific user.
 */
export async function archiveNotification(notificationId: string, userId: string): Promise<void> {
  if (!notificationId || !userId) return;
  const ref = db.collection("notifications").doc(notificationId);
  await ref.update({
    archived_by: admin.firestore.FieldValue.arrayUnion(userId),
  });
}
