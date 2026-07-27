"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { useCompanySettingsStore } from "@/stores/useCompanySettingsStore";
import { useAttendance, useEmployees } from "@/hooks/useApi";

const LAST_REMINDER_KEY = "trax_last_reminder_date";
const LAST_LATE_CHECK_KEY = "trax_last_late_check_date";

function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export default function NotificationManager() {
  const { user, role } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const companySettings = useCompanySettingsStore();
  const { data: attendance = [] } = useAttendance({ enabled: role === "boss" || role === "manager" });
  const { data: employees = [] } = useEmployees({ enabled: role === "boss" || role === "manager" });
  const permissionRequested = useRef(false);

  // Request notification permission once (only if push notifications enabled)
  useEffect(() => {
    if (permissionRequested.current) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (!companySettings.pushNotificationsEnabled) return;
    if (Notification.permission === "default") {
      permissionRequested.current = true;
      const timer = setTimeout(() => {
        Notification.requestPermission().catch(() => {});
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [companySettings.pushNotificationsEnabled]);

  // Check-in reminder for employees
  useEffect(() => {
    if (!user || role === "boss" || role === "manager") return;
    if (!companySettings.notificationsEnabled || !companySettings.checkInReminderEnabled) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const reminderMinutes = parseTimeToMinutes(companySettings.checkInReminderTime);
    const lateMinutes = parseTimeToMinutes(companySettings.workStartTime) + companySettings.gracePeriodMinutes;

    const checkReminder = () => {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const today = now.toLocaleDateString("sv-SE");
      const lastReminder = localStorage.getItem(LAST_REMINDER_KEY);

      if (lastReminder === today) return;
      if (companySettings.weekendDays.includes(now.getDay())) return;

      if (nowMinutes >= reminderMinutes && nowMinutes < lateMinutes + 30) {
        localStorage.setItem(LAST_REMINDER_KEY, today);
        const title = "تذكير تسجيل الحضور";
        const body = "لا تنسَ تسجيل حضورك لهذا اليوم";

        if (companySettings.pushNotificationsEnabled && Notification.permission === "granted") {
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
  }, [user, role, addNotification, companySettings.notificationsEnabled, companySettings.checkInReminderEnabled, companySettings.checkInReminderTime, companySettings.workStartTime, companySettings.gracePeriodMinutes, companySettings.pushNotificationsEnabled, companySettings.weekendDays]);

  // Late employee alerts for admins
  useEffect(() => {
    if (role !== "boss" && role !== "manager") return;
    if (!companySettings.notificationsEnabled || !companySettings.lateAlertsEnabled) return;
    if (!employees.length || !attendance.length) return;

    const lateThresholdMinutes = parseTimeToMinutes(companySettings.workStartTime) + companySettings.gracePeriodMinutes + companySettings.lateThresholdMinutes;

    const checkLateEmployees = () => {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const today = now.toLocaleDateString("sv-SE");
      const lastCheck = localStorage.getItem(LAST_LATE_CHECK_KEY);

      if (companySettings.weekendDays.includes(now.getDay())) return;
      if (nowMinutes < lateThresholdMinutes) return;
      if (lastCheck === today) return;

      const checkedInToday = new Set(
        attendance
          .filter((r) => r.date === today)
          .map((r) => String(r.employeeId))
      );

      const lateEmployees = employees.filter(
        (emp) => emp.status === "active" && !checkedInToday.has(String(emp.id))
      );

      if (lateEmployees.length > 0) {
        localStorage.setItem(LAST_LATE_CHECK_KEY, today);

        const title = `تأخر ${lateEmployees.length} موظف`;
        const body = lateEmployees.length === 1
          ? `الموظف ${lateEmployees[0].name} لم يسجل الحضور بعد`
          : `${lateEmployees.length} موظف لم يسجلوا الحضور بعد`;

        if (typeof window !== "undefined" && "Notification" in window && companySettings.pushNotificationsEnabled && Notification.permission === "granted") {
          new Notification(title, { body, icon: "/images/icon-192.png", tag: "late-alert" });
        }

        lateEmployees.slice(0, 5).forEach((emp) => {
          addNotification({
            type: "late_arrival",
            title: "تأخر عن الحضور",
            message: `${emp.name} لم يسجل الحضور اليوم`,
            employeeId: emp.id as unknown as number,
            employeeName: emp.name,
          });
        });
      }
    };

    checkLateEmployees();
    const interval = setInterval(checkLateEmployees, 300000);
    return () => clearInterval(interval);
  }, [role, employees, attendance, addNotification, companySettings.notificationsEnabled, companySettings.lateAlertsEnabled, companySettings.workStartTime, companySettings.gracePeriodMinutes, companySettings.lateThresholdMinutes, companySettings.pushNotificationsEnabled, companySettings.weekendDays]);

  return null;
}
