import type { NotificationType } from "@/lib/services/firebase/notifications";

export interface NotificationAnalytics {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalOpened: number;
  deliveryRate: number;
  openRate: number;
  byType: Record<NotificationType, TypeAnalytics>;
  byChannel: Record<"push" | "in_app" | "email", ChannelAnalytics>;
  byPriority: Record<"low" | "normal" | "high", PriorityAnalytics>;
  byHour: HourlyAnalytics[];
  byDay: DailyAnalytics[];
  topEmployees: EmployeeAnalytics[];
  trends: TrendPoint[];
}

export interface TypeAnalytics {
  sent: number;
  delivered: number;
  failed: number;
  opened: number;
  deliveryRate: number;
  openRate: number;
  avgLatencyMs: number;
}

export interface ChannelAnalytics {
  sent: number;
  delivered: number;
  failed: number;
  opened: number;
  deliveryRate: number;
  openRate: number;
}

export interface PriorityAnalytics {
  sent: number;
  delivered: number;
  failed: number;
  opened: number;
  deliveryRate: number;
  openRate: number;
}

export interface HourlyAnalytics {
  hour: number; // 0-23
  sent: number;
  delivered: number;
  opened: number;
}

export interface DailyAnalytics {
  date: string; // YYYY-MM-DD
  sent: number;
  delivered: number;
  opened: number;
  uniqueRecipients: number;
}

export interface EmployeeAnalytics {
  employeeId: string;
  employeeName: string;
  received: number;
  opened: number;
  openRate: number;
  lastActivity: string;
}

export interface TrendPoint {
  date: string;
  sent: number;
  delivered: number;
  opened: number;
}

export interface NotificationEvent {
  id: string;
  companyId: string;
  type: NotificationType;
  channel: "push" | "in_app" | "email";
  targetRole: "company" | "employee" | "all";
  employeeId?: string;
  employeeName?: string;
  priority: "low" | "normal" | "high";
  status: "sent" | "delivered" | "failed" | "opened";
  sentAt: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  error?: string;
  latencyMs?: number;
}

export function calculateAnalytics(
  events: NotificationEvent[],
  days: number = 30
): NotificationAnalytics {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const recentEvents = events.filter((e) => e.sentAt >= cutoff);

  const byType: Record<NotificationType, TypeAnalytics> = {} as Record<
    NotificationType,
    TypeAnalytics
  >;
  const byChannel: Record<"push" | "in_app" | "email", ChannelAnalytics> = {
    push: { sent: 0, delivered: 0, failed: 0, opened: 0, deliveryRate: 0, openRate: 0 },
    in_app: { sent: 0, delivered: 0, failed: 0, opened: 0, deliveryRate: 0, openRate: 0 },
    email: { sent: 0, delivered: 0, failed: 0, opened: 0, deliveryRate: 0, openRate: 0 },
  };
  const byPriority: Record<"low" | "normal" | "high", PriorityAnalytics> = {
    low: { sent: 0, delivered: 0, failed: 0, opened: 0, deliveryRate: 0, openRate: 0 },
    normal: { sent: 0, delivered: 0, failed: 0, opened: 0, deliveryRate: 0, openRate: 0 },
    high: { sent: 0, delivered: 0, failed: 0, opened: 0, deliveryRate: 0, openRate: 0 },
  };
  const byHour: HourlyAnalytics[] = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    sent: 0,
    delivered: 0,
    opened: 0,
  }));
  const byDayMap = new Map<string, DailyAnalytics>();
  const employeeMap = new Map<string, EmployeeAnalytics>();

  for (const event of recentEvents) {
    // By type
    if (!byType[event.type]) {
      byType[event.type] = {
        sent: 0,
        delivered: 0,
        failed: 0,
        opened: 0,
        deliveryRate: 0,
        openRate: 0,
        avgLatencyMs: 0,
      };
    }
    byType[event.type].sent++;
    if (event.status === "delivered" || event.status === "opened") byType[event.type].delivered++;
    if (event.status === "failed") byType[event.type].failed++;
    if (event.status === "opened") byType[event.type].opened++;
    if (event.latencyMs) byType[event.type].avgLatencyMs += event.latencyMs;

    // By channel
    byChannel[event.channel].sent++;
    if (event.status === "delivered" || event.status === "opened")
      byChannel[event.channel].delivered++;
    if (event.status === "failed") byChannel[event.channel].failed++;
    if (event.status === "opened") byChannel[event.channel].opened++;

    // By priority
    byPriority[event.priority].sent++;
    if (event.status === "delivered" || event.status === "opened")
      byPriority[event.priority].delivered++;
    if (event.status === "failed") byPriority[event.priority].failed++;
    if (event.status === "opened") byPriority[event.priority].opened++;

    // By hour
    const hour = event.sentAt.getHours();
    byHour[hour].sent++;
    if (event.status === "delivered" || event.status === "opened") byHour[hour].delivered++;
    if (event.status === "opened") byHour[hour].opened++;

    // By day
    const dayKey = event.sentAt.toISOString().split("T")[0];
    if (!byDayMap.has(dayKey)) {
      byDayMap.set(dayKey, { date: dayKey, sent: 0, delivered: 0, opened: 0, uniqueRecipients: 0 });
    }
    const day = byDayMap.get(dayKey)!;
    day.sent++;
    if (event.status === "delivered" || event.status === "opened") day.delivered++;
    if (event.status === "opened") day.opened++;

    // Employee tracking
    if (event.employeeId) {
      if (!employeeMap.has(event.employeeId)) {
        employeeMap.set(event.employeeId, {
          employeeId: event.employeeId,
          employeeName: event.employeeName || "Unknown",
          received: 0,
          opened: 0,
          openRate: 0,
          lastActivity: event.sentAt.toISOString(),
        });
      }
      const emp = employeeMap.get(event.employeeId)!;
      emp.received++;
      if (event.status === "opened") emp.opened++;
      if (event.sentAt > new Date(emp.lastActivity)) emp.lastActivity = event.sentAt.toISOString();
    }
  }

  // Calculate rates
  for (const type of Object.keys(byType) as NotificationType[]) {
    const t = byType[type];
    t.deliveryRate = t.sent > 0 ? t.delivered / t.sent : 0;
    t.openRate = t.delivered > 0 ? t.opened / t.delivered : 0;
    t.avgLatencyMs = t.delivered > 0 ? t.avgLatencyMs / t.delivered : 0;
  }

  for (const channel of ["push", "in_app", "email"] as const) {
    const c = byChannel[channel];
    c.deliveryRate = c.sent > 0 ? c.delivered / c.sent : 0;
    c.openRate = c.delivered > 0 ? c.opened / c.delivered : 0;
  }

  for (const priority of ["low", "normal", "high"] as const) {
    const p = byPriority[priority];
    p.deliveryRate = p.sent > 0 ? p.delivered / p.sent : 0;
    p.openRate = p.delivered > 0 ? p.opened / p.delivered : 0;
  }

  // By day array
  const byDay = Array.from(byDayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  for (const day of byDay) {
    const dayEvents = recentEvents.filter((e) => e.sentAt.toISOString().startsWith(day.date));
    const uniqueEmployees = new Set(dayEvents.map((e) => e.employeeId).filter(Boolean));
    day.uniqueRecipients = uniqueEmployees.size;
  }

  // Top employees
  const topEmployees = Array.from(employeeMap.values())
    .sort((a, b) => b.received - a.received)
    .slice(0, 10)
    .map((e) => ({ ...e, openRate: e.received > 0 ? e.opened / e.received : 0 }));

  // Trends (last 30 days)
  const trends: TrendPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dateKey = date.toISOString().split("T")[0];
    const dayEvents = recentEvents.filter((e) => e.sentAt.toISOString().startsWith(dateKey));
    trends.push({
      date: dateKey,
      sent: dayEvents.length,
      delivered: dayEvents.filter((e) => e.status === "delivered" || e.status === "opened").length,
      opened: dayEvents.filter((e) => e.status === "opened").length,
    });
  }

  return {
    totalSent: recentEvents.length,
    totalDelivered: recentEvents.filter((e) => e.status === "delivered" || e.status === "opened")
      .length,
    totalFailed: recentEvents.filter((e) => e.status === "failed").length,
    totalOpened: recentEvents.filter((e) => e.status === "opened").length,
    deliveryRate:
      recentEvents.length > 0
        ? recentEvents.filter((e) => e.status === "delivered" || e.status === "opened").length /
          recentEvents.length
        : 0,
    openRate:
      recentEvents.filter((e) => e.status === "delivered" || e.status === "opened").length > 0
        ? recentEvents.filter((e) => e.status === "opened").length /
          recentEvents.filter((e) => e.status === "delivered" || e.status === "opened").length
        : 0,
    byType,
    byChannel,
    byPriority,
    byHour,
    byDay,
    topEmployees,
    trends,
  };
}

export function formatAnalyticsForExport(analytics: NotificationAnalytics): string {
  const lines = [
    "Notification Analytics Report",
    `Generated: ${new Date().toISOString()}`,
    "",
    "OVERVIEW",
    `Total Sent: ${analytics.totalSent}`,
    `Total Delivered: ${analytics.totalDelivered}`,
    `Total Failed: ${analytics.totalFailed}`,
    `Total Opened: ${analytics.totalOpened}`,
    `Delivery Rate: ${(analytics.deliveryRate * 100).toFixed(1)}%`,
    `Open Rate: ${(analytics.openRate * 100).toFixed(1)}%`,
    "",
    "BY TYPE",
    ...Object.entries(analytics.byType).map(
      ([type, data]) =>
        `${type}: Sent=${data.sent} Delivered=${data.delivered} Failed=${data.failed} Opened=${data.opened} Delivery=${(data.deliveryRate * 100).toFixed(1)}% Open=${(data.openRate * 100).toFixed(1)}% Latency=${data.avgLatencyMs.toFixed(0)}ms`
    ),
    "",
    "BY CHANNEL",
    ...Object.entries(analytics.byChannel).map(
      ([channel, data]) =>
        `${channel}: Sent=${data.sent} Delivered=${data.delivered} Failed=${data.failed} Opened=${data.opened} Delivery=${(data.deliveryRate * 100).toFixed(1)}% Open=${(data.openRate * 100).toFixed(1)}%`
    ),
    "",
    "BY PRIORITY",
    ...Object.entries(analytics.byPriority).map(
      ([priority, data]) =>
        `${priority}: Sent=${data.sent} Delivered=${data.delivered} Failed=${data.failed} Opened=${data.opened} Delivery=${(data.deliveryRate * 100).toFixed(1)}% Open=${(data.openRate * 100).toFixed(1)}%`
    ),
    "",
    "TOP EMPLOYEES",
    ...analytics.topEmployees.map(
      (e) =>
        `${e.employeeName} (${e.employeeId}): Received=${e.received} Opened=${e.opened} OpenRate=${(e.openRate * 100).toFixed(1)}%`
    ),
  ];
  return lines.join("\n");
}
