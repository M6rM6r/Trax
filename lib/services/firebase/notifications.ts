import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  getDocs,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/config/firebase";

export type NotificationType =
  | "late_arrival"
  | "geofence_breach"
  | "anomaly_detected"
  | "attendance"
  | "check_out"
  | "reminder"
  | "system";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  employeeId?: string;
  employeeName?: string;
  data?: Record<string, string>;
  priority?: "low" | "normal" | "high";
}

export interface NotificationFilters {
  companyId: string;
  userId: string;
  role: "company" | "employee" | "mastermind";
  employeeId?: string | null;
}

function toAppNotification(
  id: string,
  data: Record<string, unknown>,
  userId: string
): AppNotification {
  const createdAt = data.created_at as Timestamp | undefined;
  const timestamp = createdAt?.toDate().toISOString() ?? new Date().toISOString();
  const readBy = Array.isArray(data.read_by) ? (data.read_by as string[]) : [];
  return {
    id,
    type: (data.type as NotificationType) ?? "system",
    title: String(data.title ?? ""),
    message: String(data.message ?? ""),
    timestamp,
    read: readBy.includes(userId),
    employeeId: data.employee_id ? String(data.employee_id) : undefined,
    employeeName: data.employee_name ? String(data.employee_name) : undefined,
    data: (data.data as Record<string, string>) ?? {},
    priority: (data.priority as "low" | "normal" | "high") ?? "normal",
  };
}

function targetRolesFor(role: "company" | "employee" | "mastermind"): string[] {
  if (role === "company" || role === "mastermind") return ["company", "all"];
  return ["employee", "all"];
}

export function subscribeToNotifications(
  filters: NotificationFilters,
  onUpdate: (notifications: AppNotification[]) => void,
  onError?: (error: Error) => void
): () => void {
  const firestore = db;
  if (!firestore || !filters.companyId) {
    onUpdate([]);
    return () => {};
  }

  const unsubscribers: (() => void)[] = [];
  const notificationsMap = new Map<string, AppNotification>();

  function emit() {
    const all = Array.from(notificationsMap.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    onUpdate(all.slice(0, 100));
  }

  const roles = targetRolesFor(filters.role);

  roles.forEach((targetRole) => {
    const q = query(
      collection(firestore, "notifications"),
      where("company_id", "==", filters.companyId),
      where("target_role", "==", targetRole),
      orderBy("created_at", "desc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const id = change.doc.id;
          if (change.type === "removed") {
            notificationsMap.delete(id);
          } else {
            const notif = toAppNotification(id, change.doc.data(), filters.userId);
            // For employee-specific notifications, filter by employeeId if set.
            if (
              filters.role === "employee" &&
              notif.employeeId &&
              notif.employeeId !== String(filters.employeeId ?? "")
            ) {
              notificationsMap.delete(id);
            } else {
              notificationsMap.set(id, notif);
            }
          }
        });
        emit();
      },
      (error) => {
        console.error("[notifications] subscription error:", error);
        onError?.(error);
      }
    );
    unsubscribers.push(unsubscribe);
  });

  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}

export async function markNotificationAsRead(id: string, userId: string): Promise<void> {
  const firestore = db;
  if (!firestore || !id || !userId) return;
  await updateDoc(doc(firestore, "notifications", id), {
    read_by: arrayUnion(userId),
  });
}

export async function markAllNotificationsAsRead(ids: string[], userId: string): Promise<void> {
  const firestore = db;
  if (!firestore || !userId || ids.length === 0) return;
  await Promise.all(
    ids.map((id) => updateDoc(doc(firestore, "notifications", id), { read_by: arrayUnion(userId) }))
  );
}

export async function deleteNotification(id: string): Promise<void> {
  const firestore = db;
  if (!firestore || !id) return;
  await deleteDoc(doc(firestore, "notifications", id));
}

export async function clearAllNotifications(
  companyId: string,
  role: "company" | "employee" | "mastermind",
  userId: string,
  employeeId?: string | null
): Promise<void> {
  const firestore = db;
  if (!firestore || !companyId || !userId) return;
  const roles = targetRolesFor(role);
  const refs: string[] = [];

  for (const targetRole of roles) {
    const q = query(
      collection(firestore, "notifications"),
      where("company_id", "==", companyId),
      where("target_role", "==", targetRole),
      orderBy("created_at", "desc"),
      limit(100)
    );
    const snapshot = await getDocs(q);
    snapshot.forEach((d) => {
      const data = d.data();
      const notifEmployeeId = data.employee_id ? String(data.employee_id) : null;
      if (role === "employee" && notifEmployeeId && notifEmployeeId !== String(employeeId ?? "")) {
        return;
      }
      refs.push(d.id);
    });
  }

  await Promise.all(refs.map((id) => deleteDoc(doc(firestore, "notifications", id))));
}
