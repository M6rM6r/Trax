"use client";

import type { CompanySettings } from "@/lib/types/companySettings";
import type { AttendanceMode, Employee, WorkShift } from "@/lib/types/trackingTypes";

/**
 * Minimal Hijri date approximation for Ramadan detection.
 * Uses the known astronomical cycle: Hijri year ≈ 354.36707 days.
 * Base: 1 Muharram 1445 ≈ 2023-07-19.
 */
function approximateHijriMonth(gregorianDate: Date): { month: number; day: number } {
  const baseGregorian = new Date("2023-07-19T00:00:00Z");
  const diffMs = gregorianDate.getTime() - baseGregorian.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const lunarDays = diffDays;
  const lunarYear = Math.floor(lunarDays / 354.36707);
  const remainingDays = lunarDays - lunarYear * 354.36707;
  let dayOfYear = Math.floor(remainingDays);
  if (dayOfYear < 0) dayOfYear += 354;

  // Months alternate 30/29 days starting with 30 for Muharram
  const monthLengths = [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29];
  let month = 1;
  let day = dayOfYear + 1;
  for (let i = 0; i < 12; i++) {
    const len = monthLengths[i];
    if (day <= len) {
      month = i + 1;
      break;
    }
    day -= len;
    month = i + 2;
  }
  return { month, day };
}

export function isSeasonalDate(
  date: Date,
  settings: Pick<CompanySettings, "seasonalAttendanceEnabled" | "seasonalMonths">
): boolean {
  if (!settings.seasonalAttendanceEnabled || !settings.seasonalMonths?.length) return false;
  const hijri = approximateHijriMonth(date);
  return settings.seasonalMonths.includes(hijri.month);
}

export function getActiveShiftForDate(
  settings: CompanySettings,
  date: Date = new Date()
): WorkShift {
  if (isSeasonalDate(date, settings)) {
    return settings.seasonalShift;
  }
  return settings.defaultShift;
}

export function resolveEmployeeAttendanceMode(
  employee: Pick<Employee, "attendanceMode">,
  companyMode: AttendanceMode
): AttendanceMode {
  return employee.attendanceMode ?? companyMode;
}

export function resolveEmployeeShift(
  employee: Pick<Employee, "attendanceMode" | "shiftOverride">,
  settings: CompanySettings,
  date: Date = new Date(),
  slot: "morning" | "evening" | null = null
): { mode: AttendanceMode; shift: WorkShift; slot: "morning" | "evening" | null } {
  const mode = resolveEmployeeAttendanceMode(employee, settings.attendanceMode);

  let baseShift: WorkShift;
  if (mode === "office_two_shift") {
    baseShift = slot === "evening" ? settings.eveningShift : settings.morningShift;
    if (!slot) {
      // Decide slot by current time
      const nowMinutes = date.getHours() * 60 + date.getMinutes();
      const morningEnd = parseTimeToMinutes(settings.morningShift.endTime);
      const eveningStart = parseTimeToMinutes(settings.eveningShift.startTime);
      // If before morning end or closer to morning, use morning; otherwise evening
      if (nowMinutes < morningEnd + (eveningStart - morningEnd) / 2) {
        slot = "morning";
        baseShift = settings.morningShift;
      } else {
        slot = "evening";
        baseShift = settings.eveningShift;
      }
    }
  } else {
    baseShift = getActiveShiftForDate(settings, date);
    slot = null;
  }

  const shift: WorkShift = {
    ...baseShift,
    ...(employee.shiftOverride ?? {}),
  };

  return { mode, shift, slot };
}

export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function formatMinutesAsTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Calculate attendance status details for a check-in time against a shift.
 */
export function evaluateCheckIn(
  checkInTime: string, // HH:mm
  shift: WorkShift
): { status: "present" | "late"; lateMinutes: number } {
  const checkInMinutes = parseTimeToMinutes(checkInTime);
  const startMinutes = parseTimeToMinutes(shift.startTime);
  const graceEnd = startMinutes + shift.gracePeriodMinutes;
  const lateEnd = graceEnd + shift.lateThresholdMinutes;

  if (checkInMinutes <= graceEnd) {
    return { status: "present", lateMinutes: 0 };
  }
  const lateMinutes = Math.max(0, checkInMinutes - startMinutes);
  if (checkInMinutes <= lateEnd) {
    return { status: "late", lateMinutes };
  }
  return { status: "late", lateMinutes };
}

/**
 * Calculate worked hours between check-in and check-out times.
 */
export function calculateWorkedHours(checkInTime: string, checkOutTime: string): number {
  const start = parseTimeToMinutes(checkInTime);
  const end = parseTimeToMinutes(checkOutTime);
  let diff = end - start;
  if (diff < 0) diff += 24 * 60; // crossed midnight
  return Number((diff / 60).toFixed(2));
}

export const attendanceModeLabels: Record<AttendanceMode, string> = {
  field: "ميداني",
  office_two_shift: "مكتبي بفترتين",
  hourly: "بالساعة",
};
