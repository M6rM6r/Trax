"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNotificationStore, type AppNotification } from "@/stores/useNotificationStore";
import { useCompanySettingsStore } from "@/stores/useCompanySettingsStore";
import { useAttendance, useEmployees } from "@/hooks/useApi";
import { useMyAttendance } from "@/hooks/api/useAttendance";
import { useTranslations } from "next-intl";
import { requestFCMToken } from "@/lib/services/firebase/messaging";
import type { AttendanceRecord, Employee } from "@/lib/types/trackingTypes";

const LAST_REMINDER_KEY = "trax_last_reminder_date";
const LAST_LATE_PUSH_KEY = "trax_last_late_push_date";

function buildAttendanceNotifications(
  attendance: AttendanceRecord[],
  role: "company" | "employee" | "mastermind" | null,
  employeeId: string | number | null,
  t: (key: string, values?: Record<string, string | number>) => string
): AppNotification[] {
  const notifications: AppNotification[] = [];
  const today = new Date().toLocaleDateString("sv-SE");

  for (const record of attendance) {
    if (!record.checkInTime) continue;
    if (record.date !== today) continue;
    if (role === "employee" && String(record.employeeId) !== String(employeeId ?? "")) continue;

    const name = record.employeeName || t("employee");
    const isLate = record.status === "late" || (record.lateMinutes ?? 0) > 0;
    const isCheckedOut = record.status === "checked_out";
    const isEarlyCheckout = record.earlyCheckout === true;

    if (isLate) {
      notifications.push({
        id: `notif_late_${record.id}`,
        type: "late_arrival",
        title: t("lateArrivalTitle"),
        message: t("lateArrivalMessage", { name }),
        timestamp: new Date(`${record.date}T${record.checkInTime}`).toISOString(),
        read: false,
        employeeId: record.employeeId,
        employeeName: record.employeeName,
        priority: "high",
      });
    } else {
      notifications.push({
        id: `notif_checkin_${record.id}`,
        type: "check_in",
        title: t("checkIn"),
        message: t("checkInMessage", { name, time: record.checkInTime }),
        timestamp: new Date(`${record.date}T${record.checkInTime}`).toISOString(),
        read: false,
        employeeId: record.employeeId,
        employeeName: record.employeeName,
        priority: "normal",
      });
    }

    if (isCheckedOut && record.checkOutTime) {
      if (isEarlyCheckout) {
        notifications.push({
          id: `notif_early_${record.id}`,
          type: "check_out_early",
          title: t("checkOutEarlyTitle"),
          message: t("checkOutEarlyMessage", { name, time: record.checkOutTime }),
          timestamp: new Date(`${record.date}T${record.checkOutTime}`).toISOString(),
          read: false,
          employeeId: record.employeeId,
          employeeName: record.employeeName,
          priority: "normal",
        });
      } else {
        notifications.push({
          id: `notif_checkout_${record.id}`,
          type: "check_out",
          title: t("checkOutTitle"),
          message: t("checkOutMessage", { name, time: record.checkOutTime }),
          timestamp: new Date(`${record.date}T${record.checkOutTime}`).toISOString(),
          read: false,
          employeeId: record.employeeId,
          employeeName: record.employeeName,
          priority: "normal",
        });
      }
    }
  }

  return notifications.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

function buildAdminLateNotifications(
  employees: Employee[],
  attendance: AttendanceRecord[],
  workStartTime: string,
  gracePeriodMinutes: number,
  weekendDays: number[],
  t: (key: string, values?: Record<string, string | number>) => string
): AppNotification[] {
  const now = new Date();
  if (weekendDays.includes(now.getDay())) return [];

  const startMinutes = parseTimeToMinutes(workStartTime);
  if (!Number.isFinite(startMinutes)) return [];
  const lateThreshold =
    startMinutes + (Number.isFinite(gracePeriodMinutes) ? gracePeriodMinutes : 0);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  if (nowMinutes < lateThreshold) return [];

  const today = now.toLocaleDateString("sv-SE");
  const checkedInToday = new Set(
    attendance
      .filter((r) => r.date === today && r.checkInTime !== null)
      .map((r) => String(r.employeeId))
  );

  const lateTime = new Date(`${today}T${workStartTime}`);
  lateTime.setMinutes(lateTime.getMinutes() + gracePeriodMinutes);
  const timestamp = lateTime.toISOString();

  return employees
    .filter((emp) => emp.status === "active" && !checkedInToday.has(String(emp.id)))
    .map((emp) => ({
      id: `notif_late_admin_${emp.id}`,
      type: "late_arrival" as const,
      title: t("lateArrivalTitle"),
      message: t("lateArrivalMessage", { name: emp.name }),
      timestamp,
      read: false,
      employeeId: String(emp.id),
      employeeName: emp.name,
      priority: "high" as const,
    }));
}

function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export default function NotificationManager() {
  const t = useTranslations("Notifications");
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const companyId = useAuthStore((s) => s.companyId);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const initialize = useNotificationStore((s) => s.initialize);
  const syncNotifications = useNotificationStore((s) => s.syncNotifications);
  const pushNotificationsEnabled = useCompanySettingsStore((s) => s.pushNotificationsEnabled);
  const notificationsEnabled = useCompanySettingsStore((s) => s.notificationsEnabled);
  const checkInReminderEnabled = useCompanySettingsStore((s) => s.checkInReminderEnabled);
  const checkInReminderTime = useCompanySettingsStore((s) => s.checkInReminderTime);
  const workStartTime = useCompanySettingsStore((s) => s.workStartTime);
  const gracePeriodMinutes = useCompanySettingsStore((s) => s.gracePeriodMinutes);
  const weekendDays = useCompanySettingsStore((s) => s.weekendDays);
  const lateAlertsEnabled = useCompanySettingsStore((s) => s.lateAlertsEnabled);
  const attendanceAlertsEnabled = useCompanySettingsStore((s) => s.attendanceAlertsEnabled);
  const checkoutAlertsEnabled = useCompanySettingsStore((s) => s.checkoutAlertsEnabled);

  const isAdmin = role === "company" || role === "mastermind";
  const { data: companyAttendance = [] } = useAttendance({ enabled: isAdmin });
  const { data: myAttendance = [] } = useMyAttendance(user?.employee_id ?? null);
  const { data: employees = [] } = useEmployees({ enabled: isAdmin });
  const permissionRequested = useRef(false);

  const attendance = role === "company" ? companyAttendance : myAttendance;

  // Sync notifications from attendance data (real-time) and recompute admin late alerts
  useEffect(() => {
    if (!role || !companyId) return;
    const notifs = buildAttendanceNotifications(
      attendance,
      role,
      user?.employee_id ?? null,
      t
    ).filter((n) => {
      if (n.type === "check_in" && !attendanceAlertsEnabled) return false;
      if (n.type === "late_arrival" && !lateAlertsEnabled) return false;
      if ((n.type === "check_out" || n.type === "check_out_early") && !checkoutAlertsEnabled)
        return false;
      return true;
    });
    syncNotifications(notifs);

    if (isAdmin && notificationsEnabled && lateAlertsEnabled && employees.length > 0) {
      const adminNotifs = buildAdminLateNotifications(
        employees,
        attendance,
        workStartTime,
        gracePeriodMinutes,
        weekendDays,
        t
      );
      syncNotifications(adminNotifs);
    }
  }, [
    attendance,
    role,
    companyId,
    user,
    t,
    syncNotifications,
    attendanceAlertsEnabled,
    lateAlertsEnabled,
    checkoutAlertsEnabled,
    isAdmin,
    employees,
    notificationsEnabled,
    workStartTime,
    gracePeriodMinutes,
    weekendDays,
  ]);

  useEffect(() => {
    if (!user || !role || !companyId) return;
    initialize({
      companyId,
      userId: String(user.id),
      role,
      employeeId: user.employee_id ?? null,
    });
    return () => {
      useNotificationStore.getState().stop();
    };
  }, [initialize, user, role, companyId]);

  // Request notification permission once (only if push notifications enabled)
  useEffect(() => {
    if (permissionRequested.current) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (!pushNotificationsEnabled) return;
    if (Notification.permission === "default") {
      permissionRequested.current = true;
      const timer = setTimeout(async () => {
        const granted = await Notification.requestPermission().catch(() => "denied");
        if (granted === "granted") {
          await requestFCMToken().catch((err) =>
            console.warn("[FCM] token registration failed:", err)
          );
        }
      }, 5000);
      return () => clearTimeout(timer);
    } else if (Notification.permission === "granted") {
      // Permission already granted, ensure FCM token is registered
      requestFCMToken().catch((err) => console.warn("[FCM] token registration failed:", err));
    }
  }, [pushNotificationsEnabled]);

  // Check-in reminder for employees
  useEffect(() => {
    if (!user || role === "company") return;
    if (!notificationsEnabled || !checkInReminderEnabled) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const reminderMinutes = parseTimeToMinutes(checkInReminderTime);
    const lateMinutes = parseTimeToMinutes(workStartTime) + gracePeriodMinutes;

    const checkReminder = () => {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const today = now.toLocaleDateString("sv-SE");
      const lastReminder = localStorage.getItem(LAST_REMINDER_KEY);

      if (lastReminder === today) return;
      if (weekendDays.includes(now.getDay())) return;

      if (nowMinutes >= reminderMinutes && nowMinutes < lateMinutes + 30) {
        localStorage.setItem(LAST_REMINDER_KEY, today);
        const title = t("checkInReminderTitle");
        const body = t("checkInReminderBody");

        if (pushNotificationsEnabled && Notification.permission === "granted") {
          new Notification(title, { body, icon: "/images/icon-192.png", tag: "check-in-reminder" });
        }

        addNotification({
          type: "reminder",
          title,
          message: body,
        });
      }
    };

    checkReminder();
    const interval = setInterval(checkReminder, 60000);
    return () => clearInterval(interval);
  }, [
    user,
    role,
    addNotification,
    notificationsEnabled,
    checkInReminderEnabled,
    checkInReminderTime,
    workStartTime,
    gracePeriodMinutes,
    pushNotificationsEnabled,
    weekendDays,
    t,
  ]);

  // Late employee alerts for admins
  useEffect(() => {
    if (!isAdmin) return;
    if (!notificationsEnabled || !lateAlertsEnabled) return;
    if (!employees.length) return;

    const syncAdminLate = () => {
      const adminNotifs = buildAdminLateNotifications(
        employees,
        attendance,
        workStartTime,
        gracePeriodMinutes,
        weekendDays,
        t
      );
      syncNotifications(adminNotifs);

      // Show one push notification per day
      if (adminNotifs.length > 0 && typeof window !== "undefined" && "Notification" in window) {
        const today = new Date().toLocaleDateString("sv-SE");
        const lastPush = localStorage.getItem(LAST_LATE_PUSH_KEY);
        if (
          lastPush !== today &&
          pushNotificationsEnabled &&
          Notification.permission === "granted"
        ) {
          localStorage.setItem(LAST_LATE_PUSH_KEY, today);
          const title = t("lateEmployeesTitle", { count: adminNotifs.length });
          const body =
            adminNotifs.length === 1
              ? t("lateEmployeeBody", { name: adminNotifs[0].employeeName })
              : t("lateEmployeesBody", { count: adminNotifs.length });
          new Notification(title, { body, icon: "/images/icon-192.png", tag: "late-alert" });
        }
      }
    };

    syncAdminLate();
    const interval = setInterval(syncAdminLate, 300000);
    return () => clearInterval(interval);
  }, [
    isAdmin,
    employees,
    attendance,
    syncNotifications,
    notificationsEnabled,
    lateAlertsEnabled,
    workStartTime,
    gracePeriodMinutes,
    pushNotificationsEnabled,
    weekendDays,
    t,
  ]);

  return null;
}
