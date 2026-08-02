"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { useCompanySettingsStore } from "@/stores/useCompanySettingsStore";
import { useAttendance, useEmployees } from "@/hooks/useApi";
import { useTranslations } from "next-intl";

const LAST_REMINDER_KEY = "trax_last_reminder_date";
const LAST_LATE_CHECK_KEY = "trax_last_late_check_date";

function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export default function NotificationManager() {
  const t = useTranslations("Notifications");
  const { user, role, companyId } = useAuthStore();
  const { addNotification, initialize } = useNotificationStore();
  const notificationsEnabled = useCompanySettingsStore((s) => s.notificationsEnabled);
  const checkInReminderEnabled = useCompanySettingsStore((s) => s.checkInReminderEnabled);
  const checkInReminderTime = useCompanySettingsStore((s) => s.checkInReminderTime);
  const workStartTime = useCompanySettingsStore((s) => s.workStartTime);
  const gracePeriodMinutes = useCompanySettingsStore((s) => s.gracePeriodMinutes);
  const lateThresholdMinutes = useCompanySettingsStore((s) => s.lateThresholdMinutes);
  const lateAlertsEnabled = useCompanySettingsStore((s) => s.lateAlertsEnabled);
  const pushNotificationsEnabled = useCompanySettingsStore((s) => s.pushNotificationsEnabled);
  const weekendDays = useCompanySettingsStore((s) => s.weekendDays);

  useEffect(() => {
    initialize({
      companyId: companyId ?? null,
      userId: user ? String(user.id) : null,
      role: role ?? null,
      employeeId: user?.employee_id ?? null,
    });
    return () => {
      useNotificationStore.getState().stop();
    };
  }, [initialize, user, role, companyId]);
  const { data: attendance = [] } = useAttendance({ enabled: role === "company" });
  const { data: employees = [] } = useEmployees({ enabled: role === "company" });
  const permissionRequested = useRef(false);

  // Request notification permission once (only if push notifications enabled)
  useEffect(() => {
    if (permissionRequested.current) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (!pushNotificationsEnabled) return;
    if (Notification.permission === "default") {
      permissionRequested.current = true;
      const timer = setTimeout(() => {
        Notification.requestPermission().catch(() => {});
      }, 5000);
      return () => clearTimeout(timer);
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
          type: "attendance",
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
    if (role !== "company") return;
    if (!notificationsEnabled || !lateAlertsEnabled) return;
    if (!employees.length || !attendance.length) return;

    const lateThreshold =
      parseTimeToMinutes(workStartTime) + gracePeriodMinutes + lateThresholdMinutes;

    const checkLateEmployees = () => {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const today = now.toLocaleDateString("sv-SE");
      const lastCheck = localStorage.getItem(LAST_LATE_CHECK_KEY);

      if (weekendDays.includes(now.getDay())) return;
      if (nowMinutes < lateThreshold) return;
      if (lastCheck === today) return;

      const checkedInToday = new Set(
        attendance.filter((r) => r.date === today).map((r) => String(r.employeeId))
      );

      const lateEmployees = employees.filter(
        (emp) => emp.status === "active" && !checkedInToday.has(String(emp.id))
      );

      if (lateEmployees.length > 0) {
        localStorage.setItem(LAST_LATE_CHECK_KEY, today);

        const title = t("lateEmployeesTitle", { count: lateEmployees.length });
        const body =
          lateEmployees.length === 1
            ? t("lateEmployeeBody", { name: lateEmployees[0].name })
            : t("lateEmployeesBody", { count: lateEmployees.length });

        if (
          typeof window !== "undefined" &&
          "Notification" in window &&
          pushNotificationsEnabled &&
          Notification.permission === "granted"
        ) {
          new Notification(title, { body, icon: "/images/icon-192.png", tag: "late-alert" });
        }

        lateEmployees.slice(0, 5).forEach((emp) => {
          addNotification({
            type: "late_arrival",
            title: t("lateArrivalTitle"),
            message: t("lateArrivalMessage", { name: emp.name }),
            employeeId: String(emp.id),
            employeeName: emp.name,
          });
        });
      }
    };

    checkLateEmployees();
    const interval = setInterval(checkLateEmployees, 300000);
    return () => clearInterval(interval);
  }, [
    role,
    employees,
    attendance,
    addNotification,
    notificationsEnabled,
    lateAlertsEnabled,
    workStartTime,
    gracePeriodMinutes,
    lateThresholdMinutes,
    pushNotificationsEnabled,
    weekendDays,
    t,
  ]);

  return null;
}
