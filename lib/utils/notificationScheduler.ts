import type { NotificationType } from "@/lib/services/firebase/notifications";
import { renderTemplate } from "./notificationTemplates";
import {
  getEffectiveChannels,
  shouldSendNotification,
  UserNotificationPreferences,
} from "./notificationPreferences";

export interface ScheduledNotification {
  id: string;
  companyId: string;
  type: NotificationType;
  targetRole: "company" | "employee" | "all";
  employeeId?: string | null;
  variables: Record<string, string>;
  scheduledFor: Date;
  recurring?: {
    frequency: "daily" | "weekly" | "monthly";
    daysOfWeek?: number[]; // 0-6
    dayOfMonth?: number;
    endDate?: Date;
  };
  priority: "low" | "normal" | "high";
  createdAt: Date;
  createdBy: string;
  status: "pending" | "sent" | "failed" | "cancelled";
  sentAt?: Date;
  error?: string;
}

export interface BatchedNotification {
  id: string;
  companyId: string;
  type: NotificationType;
  targetRole: "company" | "employee" | "all";
  employeeIds: string[];
  variables: Record<string, string>;
  batchedAt: Date;
  sendAt: Date;
  status: "pending" | "sent" | "failed";
}

const BATCH_INTERVALS = {
  immediate: 0,
  batched_hourly: 60 * 60 * 1000,
  batched_daily: 24 * 60 * 60 * 1000,
  digest: 24 * 60 * 60 * 1000,
};

export function calculateSendTime(
  scheduledFor: Date,
  frequency: "immediate" | "batched_hourly" | "batched_daily" | "digest"
): Date {
  const interval = BATCH_INTERVALS[frequency];
  if (interval === 0) return scheduledFor;

  const sendTime = new Date(scheduledFor.getTime() + interval);
  // Align to hour/day boundaries
  if (frequency === "batched_hourly") {
    sendTime.setMinutes(0, 0, 0);
  } else if (frequency === "batched_daily" || frequency === "digest") {
    sendTime.setHours(8, 0, 0, 0); // 8 AM daily digest
  }
  return sendTime;
}

export function createNotificationPayload(
  type: NotificationType,
  variables: Record<string, string>,
  targetRole: "company" | "employee" | "all",
  employeeId?: string | null,
  priority: "low" | "normal" | "high" = "normal"
) {
  const { title, message } = renderTemplate(type, variables);
  return {
    type,
    title,
    message,
    targetRole,
    employeeId,
    priority,
    variables,
  };
}

export function filterNotificationsByPreferences(
  notifications: Array<{
    type: NotificationType;
    targetRole: "company" | "employee" | "all";
    employeeId?: string | null;
    variables: Record<string, string>;
    priority: "low" | "normal" | "high";
  }>,
  preferences: UserNotificationPreferences,
  now: Date = new Date()
): Array<{
  type: NotificationType;
  targetRole: "company" | "employee" | "all";
  employeeId?: string | null;
  variables: Record<string, string>;
  priority: "low" | "normal" | "high";
  channels: ("push" | "in_app" | "email")[];
}> {
  return notifications
    .map((n) => ({
      ...n,
      channels: getEffectiveChannels(preferences, n.type),
    }))
    .filter((n) => n.channels.length > 0)
    .filter((n) => shouldSendNotification(preferences, n.type, n.channels[0], now));
}

export function groupNotificationsForBatching(
  notifications: Array<{
    type: NotificationType;
    targetRole: "company" | "employee" | "all";
    employeeId?: string | null;
    variables: Record<string, string>;
    priority: "low" | "normal" | "high";
    channels: ("push" | "in_app" | "email")[];
  }>,
  frequency: "batched_hourly" | "batched_daily" | "digest"
): BatchedNotification[] {
  const groups = new Map<string, BatchedNotification>();

  for (const n of notifications) {
    const key = `${n.type}-${n.targetRole}-${frequency}`;
    const existing = groups.get(key);

    if (existing) {
      if (n.employeeId && !existing.employeeIds.includes(n.employeeId)) {
        existing.employeeIds.push(n.employeeId);
      }
    } else {
      groups.set(key, {
        id: `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        companyId: "", // Will be set by caller
        type: n.type,
        targetRole: n.targetRole,
        employeeIds: n.employeeId ? [n.employeeId] : [],
        variables: n.variables,
        batchedAt: new Date(),
        sendAt: calculateSendTime(new Date(), frequency),
        status: "pending",
      });
    }
  }

  return Array.from(groups.values());
}

export function generateDigestContent(
  notifications: Array<{
    type: NotificationType;
    title: string;
    message: string;
    timestamp: string;
  }>
): { title: string; message: string; count: number } {
  const byType = new Map<NotificationType, number>();
  for (const n of notifications) {
    byType.set(n.type, (byType.get(n.type) || 0) + 1);
  }

  const summary = Array.from(byType.entries())
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");

  return {
    title: `Daily Digest (${notifications.length} notifications)`,
    message: `Summary: ${summary}`,
    count: notifications.length,
  };
}
