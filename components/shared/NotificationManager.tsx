"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { useAttendance, useEmployees } from "@/hooks/useApi";

const LATE_HOUR = 9;
const LATE_MINUTE = 0;
const CHECK_IN_REMINDER_HOUR = 8;
const LAST_REMINDER_KEY = "trax_last_reminder_date";
const LAST_LATE_CHECK_KEY = "trax_last_late_check_date";

export default function NotificationManager() {
  const { user, role } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { data: attendance = [] } = useAttendance({ enabled: role === "boss" || role === "manager" });
  const { data: employees = [] } = useEmployees({ enabled: role === "boss" || role === "manager" });
  const permissionRequested = useRef(false);

  // Request notification permission once
  useEffect(() => {
    if (permissionRequested.current) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      permissionRequested.current = true;
      // Delay to avoid immediate prompt on page load
      const timer = setTimeout(() => {
        Notification.requestPermission().catch(() => {});
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Check-in reminder for employees
  useEffect(() => {
    if (!user || role === "boss" || role === "manager") return;
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const checkReminder = () => {
      const now = new Date();
      const hour = now.getHours();
      const today = now.toLocaleDateString("sv-SE");
      const lastReminder = localStorage.getItem(LAST_REMINDER_KEY);

      if (lastReminder === today) return;

      if (hour >= CHECK_IN_REMINDER_HOUR && hour < LATE_HOUR + 1) {
        localStorage.setItem(LAST_REMINDER_KEY, today);
        const title = "تذكير تسجيل الحضور";
        const body = "لا تنسَ تسجيل حضورك لهذا اليوم";

        if (Notification.permission === "granted") {
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
  }, [user, role, addNotification]);

  // Late employee alerts for admins
  useEffect(() => {
    if (role !== "boss" && role !== "manager") return;
    if (!employees.length || !attendance.length) return;

    const checkLateEmployees = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const today = now.toLocaleDateString("sv-SE");
      const lastCheck = localStorage.getItem(LAST_LATE_CHECK_KEY);

      // Only check after the late threshold time
      if (hour < LATE_HOUR || (hour === LATE_HOUR && minute < LATE_MINUTE)) return;
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

        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          new Notification(title, { body, icon: "/images/icon-192.png", tag: "late-alert" });
        }

        lateEmployees.slice(0, 5).forEach((emp) => {
          addNotification({
            type: "late_arrival",
            title: "تأخر عن الحضور",
            message: `${emp.name} لم يسجل الحضور اليوم`,
            employeeId: emp.id as number,
            employeeName: emp.name,
          });
        });
      }
    };

    checkLateEmployees();
    const interval = setInterval(checkLateEmployees, 300000); // Check every 5 min
    return () => clearInterval(interval);
  }, [role, employees, attendance, addNotification]);

  return null;
}
