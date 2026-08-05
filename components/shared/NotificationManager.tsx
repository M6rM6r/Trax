"use client";

import { useEffect, useMemo, useRef } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  useNotificationStore,
  wasFeedClearedRecently,
  type AppNotification,
} from "@/stores/useNotificationStore";
import { useCompanySettingsStore } from "@/stores/useCompanySettingsStore";
import { useAttendance, useEmployees } from "@/hooks/useApi";
import { useMyAttendance } from "@/hooks/api/useAttendance";
import { useTranslations } from "next-intl";
import { requestFCMToken } from "@/lib/services/firebase/messaging";
import type { AttendanceRecord, Employee, WorkShift } from "@/lib/types/trackingTypes";
import {
  companyMinutesSinceMidnight,
  companyWallClockToUtcMs,
  companyWeekday,
  DEFAULT_COMPANY_TIMEZONE,
  formatCompanyDate,
} from "@/lib/utils/companyDate";
import { evaluateCheckIn, getEffectiveDefaultShift, parseTimeToMinutes } from "@/lib/utils/shifts";

const LAST_REMINDER_KEY = "trax_last_reminder_date";
const LAST_LATE_PUSH_KEY = "trax_last_late_push_date";

function wallClockIso(dateYmd: string, timeHm: string, timeZone: string): string {
  const ms = companyWallClockToUtcMs(dateYmd, timeHm, timeZone);
  return ms !== null ? new Date(ms).toISOString() : new Date().toISOString();
}

/**
 * Live lateness for the bell — recompute against CURRENT company hours so both
 * punches after grace show as late (e.g. start 00:00 + 30m grace → 05:10 and 06:13).
 * Stored status/lateMinutes alone is unreliable (wrong shift at write, early vs late).
 * Applied shift can also mislead (old 08:00 start treats 05:10 as "on time early").
 */
function resolveLateness(
  record: AttendanceRecord,
  companyShift: WorkShift
): { isLate: boolean; lateMinutes: number } {
  const checkIn = record.checkInTime;
  if (!checkIn) return { isLate: false, lateMinutes: 0 };

  const live = evaluateCheckIn(checkIn, companyShift);
  let minutes = Number.isFinite(live.lateMinutes) ? live.lateMinutes : 0;
  let late = live.status === "late" || minutes > 0;

  const applied = record.appliedShift;
  if (applied && typeof applied.startTime === "string" && typeof applied.endTime === "string") {
    const appliedShift: WorkShift = {
      startTime: applied.startTime,
      endTime: applied.endTime,
      gracePeriodMinutes: applied.gracePeriodMinutes ?? companyShift.gracePeriodMinutes,
      lateThresholdMinutes: applied.lateThresholdMinutes ?? companyShift.lateThresholdMinutes,
    };
    const fromApplied = evaluateCheckIn(checkIn, appliedShift);
    if (fromApplied.status === "late") {
      late = true;
      minutes = Math.max(minutes, fromApplied.lateMinutes);
    }
  }

  if (
    record.status === "late" ||
    (typeof record.lateMinutes === "number" && record.lateMinutes > 0)
  ) {
    late = true;
    minutes = Math.max(minutes, typeof record.lateMinutes === "number" ? record.lateMinutes : 0);
  }

  return { isLate: late, lateMinutes: minutes };
}

function normalizeAttendanceDate(date: unknown): string {
  if (date === null || date === undefined) return "";
  const s = String(date).trim();
  // Accept YYYY-MM-DD or ISO timestamps
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const t = Date.parse(s);
  if (!Number.isNaN(t)) {
    try {
      return formatCompanyDate(new Date(t), DEFAULT_COMPANY_TIMEZONE);
    } catch {
      return s.slice(0, 10);
    }
  }
  return s;
}

/**
 * Company feed defaults:
 * - late check-ins always (if lateAlertsEnabled)
 * - on-time check-ins when attendanceAlertsEnabled
 * - checkout / early checkout when checkoutAlertsEnabled
 * Missing check-ins when past grace (lateAlertsEnabled)
 */
function buildAttendanceNotifications(
  attendance: AttendanceRecord[],
  role: "company" | "employee" | "mastermind" | null,
  employeeId: string | number | null,
  t: (key: string, values?: Record<string, string | number>) => string,
  timeZone: string,
  companyShift: WorkShift,
  opts: {
    attendanceAlertsEnabled: boolean;
    lateAlertsEnabled: boolean;
    checkoutAlertsEnabled: boolean;
  }
): AppNotification[] {
  const notifications: AppNotification[] = [];
  const today = formatCompanyDate(new Date(), timeZone);

  for (const record of attendance) {
    if (!record.checkInTime) continue;
    const recordDate = normalizeAttendanceDate(record.date);
    if (recordDate !== today) continue;
    if (role === "employee" && String(record.employeeId) !== String(employeeId ?? "")) continue;

    const name = record.employeeName || t("employee");
    const empId = String(record.employeeId);
    const { isLate, lateMinutes } = resolveLateness(record, companyShift);
    const isCheckedOut = record.status === "checked_out" || Boolean(record.checkOutTime);
    const isEarlyCheckout = record.earlyCheckout === true;

    if (isLate && opts.lateAlertsEnabled) {
      notifications.push({
        id: `notif_late_${record.id}`,
        type: "late_arrival",
        title: t("lateCheckInTitle"),
        message: t("lateCheckInMessage", {
          name,
          time: record.checkInTime,
          minutes: lateMinutes,
        }),
        timestamp: wallClockIso(recordDate, record.checkInTime, timeZone),
        read: false,
        employeeId: empId,
        employeeName: record.employeeName,
        priority: "high",
        // Drop any stale on-time card for the same punch via shared day key preference in store
        dedupeKey: `late_arrival:${empId}:${recordDate}`,
        data: { date: recordDate, lateMinutes: String(lateMinutes) },
      });
    } else if (!isLate && opts.attendanceAlertsEnabled) {
      notifications.push({
        id: `notif_checkin_${record.id}`,
        type: "check_in",
        title: t("checkIn"),
        message: t("checkInMessage", { name, time: record.checkInTime }),
        timestamp: wallClockIso(recordDate, record.checkInTime, timeZone),
        read: false,
        employeeId: empId,
        employeeName: record.employeeName,
        priority: role === "company" ? "normal" : "low",
        dedupeKey: `check_in:${empId}:${recordDate}`,
        data: { date: recordDate },
      });
    }

    if (isCheckedOut && record.checkOutTime && opts.checkoutAlertsEnabled) {
      if (isEarlyCheckout) {
        notifications.push({
          id: `notif_early_${record.id}`,
          type: "check_out_early",
          title: t("checkOutEarlyTitle"),
          message: t("checkOutEarlyMessage", { name, time: record.checkOutTime }),
          timestamp: wallClockIso(recordDate, record.checkOutTime, timeZone),
          read: false,
          employeeId: empId,
          employeeName: record.employeeName,
          priority: "normal",
          dedupeKey: `check_out_early:${empId}:${recordDate}`,
          data: { date: recordDate },
        });
      } else {
        notifications.push({
          id: `notif_checkout_${record.id}`,
          type: "check_out",
          title: t("checkOutTitle"),
          message: t("checkOutMessage", { name, time: record.checkOutTime }),
          timestamp: wallClockIso(recordDate, record.checkOutTime, timeZone),
          read: false,
          employeeId: empId,
          employeeName: record.employeeName,
          priority: "low",
          dedupeKey: `check_out:${empId}:${recordDate}`,
          data: { date: recordDate },
        });
      }
    }
  }

  return notifications.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

function buildMissingCheckInNotifications(
  employees: Employee[],
  attendance: AttendanceRecord[],
  workStartTime: string,
  gracePeriodMinutes: number,
  weekendDays: number[],
  t: (key: string, values?: Record<string, string | number>) => string,
  timeZone: string
): AppNotification[] {
  const now = new Date();
  if (weekendDays.includes(companyWeekday(now, timeZone))) return [];

  const startMinutes = parseTimeToMinutes(workStartTime);
  if (!Number.isFinite(startMinutes)) return [];
  const grace = Number.isFinite(gracePeriodMinutes) ? gracePeriodMinutes : 0;
  const lateThreshold = startMinutes + grace;
  const nowMinutes = companyMinutesSinceMidnight(now, timeZone);
  if (nowMinutes < lateThreshold) return [];

  const today = formatCompanyDate(now, timeZone);
  const checkedInToday = new Set(
    attendance
      .filter((r) => normalizeAttendanceDate(r.date) === today && r.checkInTime)
      .map((r) => String(r.employeeId))
  );

  const thH = String(Math.floor(lateThreshold / 60) % 24).padStart(2, "0");
  const thM = String(lateThreshold % 60).padStart(2, "0");
  const timestamp = wallClockIso(today, `${thH}:${thM}`, timeZone);

  return employees
    .filter((emp) => {
      const status = String(emp.status ?? "active").toLowerCase();
      return (status === "active" || status === "") && !checkedInToday.has(String(emp.id));
    })
    .map((emp) => {
      const empId = String(emp.id);
      return {
        id: `notif_missing_${empId}_${today}`,
        type: "missing_check_in" as const,
        title: t("missingCheckInTitle"),
        message: t("missingCheckInMessage", { name: emp.name }),
        timestamp,
        read: false,
        employeeId: empId,
        employeeName: emp.name,
        priority: "high" as const,
        dedupeKey: `missing_check_in:${empId}:${today}`,
        data: { date: today },
      };
    });
}

export default function NotificationManager() {
  const t = useTranslations("Notifications");
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const companyId = useAuthStore((s) => s.companyId);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const initialize = useNotificationStore((s) => s.initialize);
  const replaceLiveFeed = useNotificationStore((s) => s.replaceLiveFeed);
  const pushNotificationsEnabled = useCompanySettingsStore((s) => s.pushNotificationsEnabled);
  const notificationsEnabled = useCompanySettingsStore((s) => s.notificationsEnabled);
  const checkInReminderEnabled = useCompanySettingsStore((s) => s.checkInReminderEnabled);
  const checkInReminderTime = useCompanySettingsStore((s) => s.checkInReminderTime);
  const workStartTime = useCompanySettingsStore((s) => s.workStartTime);
  const workEndTime = useCompanySettingsStore((s) => s.workEndTime);
  const gracePeriodMinutes = useCompanySettingsStore((s) => s.gracePeriodMinutes);
  const lateThresholdMinutes = useCompanySettingsStore((s) => s.lateThresholdMinutes);
  const weekendDays = useCompanySettingsStore((s) => s.weekendDays);
  const lateAlertsEnabled = useCompanySettingsStore((s) => s.lateAlertsEnabled);
  const attendanceAlertsEnabled = useCompanySettingsStore((s) => s.attendanceAlertsEnabled);
  const checkoutAlertsEnabled = useCompanySettingsStore((s) => s.checkoutAlertsEnabled);
  const timezone = useCompanySettingsStore((s) => s.timezone) || DEFAULT_COMPANY_TIMEZONE;
  const settingsLoaded = useCompanySettingsStore((s) => s.loaded);

  const isAdmin = role === "company";
  const todayYmd = useMemo(
    () => formatCompanyDate(new Date(), timezone),
    // Refresh when timezone changes; day rollover handled by interval below via attendance refetch
    [timezone]
  );

  // Scope company list to today so the feed always has today's punches (not an unbounded dump).
  const { data: companyAttendance = [], isFetching: companyAttFetching } = useAttendance({
    enabled: isAdmin,
    dateRange: isAdmin ? { from: todayYmd, to: todayYmd } : undefined,
  });
  const { data: myAttendance = [] } = useMyAttendance(user?.employee_id ?? null);
  const { data: employees = [], isFetching: employeesFetching } = useEmployees({
    enabled: isAdmin,
  });
  const permissionRequested = useRef(false);

  const attendance = isAdmin ? companyAttendance : myAttendance;

  // Initialize once per session identity — never stop() on every layout remount.
  useEffect(() => {
    if (!user || !role || !companyId) {
      // Real logout
      if (!user) useNotificationStore.getState().stop();
      return;
    }
    initialize({
      companyId,
      userId: String(user.id),
      role,
      employeeId: user.employee_id ?? null,
    });
  }, [initialize, user, role, companyId]);

  // Build live feed whenever attendance / settings change.
  useEffect(() => {
    if (!role || !companyId || !user) return;
    // Wait for settings hydration so we don't clear the feed with default false flags.
    if (!settingsLoaded && typeof window !== "undefined") {
      // persist may still hydrate — don't wipe; skip one frame
    }

    const masterOn = notificationsEnabled !== false;
    if (!masterOn) {
      replaceLiveFeed([]);
      return;
    }

    // Soft clear: don't repopulate for 30s after user hit clear (session only).
    if (wasFeedClearedRecently(companyId, String(user.id), 30_000)) {
      return;
    }

    const companyShift = getEffectiveDefaultShift({
      workStartTime: workStartTime || "08:00",
      workEndTime: workEndTime || "17:00",
      gracePeriodMinutes: gracePeriodMinutes ?? 30,
      lateThresholdMinutes: lateThresholdMinutes ?? 30,
    });

    const fromRecords = buildAttendanceNotifications(
      attendance,
      role,
      user?.employee_id ?? null,
      t,
      timezone,
      companyShift,
      {
        // Default-on when flags undefined (legacy settings docs).
        attendanceAlertsEnabled: attendanceAlertsEnabled !== false,
        lateAlertsEnabled: lateAlertsEnabled !== false,
        checkoutAlertsEnabled: checkoutAlertsEnabled !== false,
      }
    );

    let missing: AppNotification[] = [];
    if (isAdmin && lateAlertsEnabled !== false && employees.length > 0) {
      missing = buildMissingCheckInNotifications(
        employees,
        attendance,
        workStartTime || "08:00",
        gracePeriodMinutes ?? 30,
        weekendDays ?? [5, 6],
        t,
        timezone
      );
    }

    replaceLiveFeed([...fromRecords, ...missing]);
  }, [
    attendance,
    role,
    companyId,
    user,
    t,
    replaceLiveFeed,
    attendanceAlertsEnabled,
    lateAlertsEnabled,
    checkoutAlertsEnabled,
    isAdmin,
    employees,
    notificationsEnabled,
    workStartTime,
    workEndTime,
    lateThresholdMinutes,
    gracePeriodMinutes,
    weekendDays,
    timezone,
    settingsLoaded,
    companyAttFetching,
    employeesFetching,
    todayYmd,
  ]);

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
      requestFCMToken().catch((err) => console.warn("[FCM] token registration failed:", err));
    }
  }, [pushNotificationsEnabled]);

  // Check-in reminder for employees only
  useEffect(() => {
    if (!user || role !== "employee") return;
    if (notificationsEnabled === false || !checkInReminderEnabled) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const reminderMinutes = parseTimeToMinutes(checkInReminderTime || "07:45");
    const lateMinutes = parseTimeToMinutes(workStartTime || "08:00") + (gracePeriodMinutes ?? 30);

    const checkReminder = () => {
      const now = new Date();
      const nowMinutes = companyMinutesSinceMidnight(now, timezone);
      const today = formatCompanyDate(now, timezone);
      const scopeKey = `${LAST_REMINDER_KEY}:${companyId ?? "none"}:${user?.id ?? "anon"}`;
      const lastReminder = localStorage.getItem(scopeKey);

      if (lastReminder === today) return;
      if ((weekendDays ?? []).includes(companyWeekday(now, timezone))) return;

      const alreadyIn = attendance.some(
        (r) =>
          normalizeAttendanceDate(r.date) === today &&
          r.checkInTime &&
          String(r.employeeId) === String(user.employee_id ?? "")
      );
      if (alreadyIn) return;

      if (nowMinutes >= reminderMinutes && nowMinutes < lateMinutes + 30) {
        localStorage.setItem(scopeKey, today);
        const title = t("checkInReminderTitle");
        const body = t("checkInReminderBody");

        if (pushNotificationsEnabled && Notification.permission === "granted") {
          new Notification(title, { body, icon: "/images/icon-192.png", tag: "check-in-reminder" });
        }

        addNotification({
          type: "reminder",
          title,
          message: body,
          priority: "normal",
          dedupeKey: `reminder:check_in:${user.id}:${today}`,
        });
      }
    };

    checkReminder();
    const interval = setInterval(checkReminder, 60000);
    return () => clearInterval(interval);
  }, [
    user,
    role,
    companyId,
    addNotification,
    notificationsEnabled,
    checkInReminderEnabled,
    checkInReminderTime,
    workStartTime,
    gracePeriodMinutes,
    weekendDays,
    timezone,
    pushNotificationsEnabled,
    t,
    attendance,
  ]);

  // Optional browser push once/day when missing check-ins appear (company)
  useEffect(() => {
    if (!isAdmin || lateAlertsEnabled === false || !pushNotificationsEnabled) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const today = formatCompanyDate(new Date(), timezone);
    const scopeKey = `${LAST_LATE_PUSH_KEY}:${companyId ?? "none"}`;
    if (localStorage.getItem(scopeKey) === today) return;

    const missingCount = employees.filter((emp) => {
      const status = String(emp.status ?? "active").toLowerCase();
      if (status !== "active" && status !== "") return false;
      return !attendance.some(
        (r) =>
          normalizeAttendanceDate(r.date) === today &&
          r.checkInTime &&
          String(r.employeeId) === String(emp.id)
      );
    }).length;

    const startMinutes = parseTimeToMinutes(workStartTime || "08:00");
    const nowMinutes = companyMinutesSinceMidnight(new Date(), timezone);
    if (nowMinutes < startMinutes + (gracePeriodMinutes ?? 30)) return;
    if (missingCount <= 0) return;

    localStorage.setItem(scopeKey, today);
    new Notification(t("lateEmployeesTitle", { count: missingCount }), {
      body: t("lateEmployeesBody", { count: missingCount }),
      icon: "/images/icon-192.png",
      tag: "missing-check-in-summary",
    });
  }, [
    isAdmin,
    lateAlertsEnabled,
    pushNotificationsEnabled,
    employees,
    attendance,
    workStartTime,
    gracePeriodMinutes,
    timezone,
    companyId,
    t,
  ]);

  return null;
}
