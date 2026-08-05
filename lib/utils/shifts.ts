"use client";

import { defaultCompanySettings, type CompanySettings } from "@/lib/types/companySettings";
import type { AttendanceMode, Employee, WorkShift } from "@/lib/types/trackingTypes";
import { companyMinutesSinceMidnight, DEFAULT_COMPANY_TIMEZONE } from "@/lib/utils/companyDate";

const HH_MM_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const FALLBACK_SHIFT: WorkShift = {
  startTime: "08:00",
  endTime: "17:00",
  gracePeriodMinutes: 30,
  lateThresholdMinutes: 30,
};

function isValidHhMm(time: string | null | undefined): time is string {
  return typeof time === "string" && HH_MM_REGEX.test(time);
}

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

export function getEffectiveDefaultShift(settings: Partial<CompanySettings>): WorkShift {
  const fallback = defaultCompanySettings.defaultShift;
  const startTime = settings.workStartTime;
  const endTime = settings.workEndTime;
  return {
    startTime: isValidHhMm(startTime)
      ? startTime
      : (settings.defaultShift?.startTime ?? fallback.startTime),
    endTime: isValidHhMm(endTime) ? endTime : (settings.defaultShift?.endTime ?? fallback.endTime),
    gracePeriodMinutes:
      settings.gracePeriodMinutes ??
      settings.defaultShift?.gracePeriodMinutes ??
      fallback.gracePeriodMinutes,
    lateThresholdMinutes:
      settings.lateThresholdMinutes ??
      settings.defaultShift?.lateThresholdMinutes ??
      fallback.lateThresholdMinutes,
  };
}

export function getActiveShiftForDate(
  settings: CompanySettings,
  date: Date = new Date()
): WorkShift {
  if (isSeasonalDate(date, settings)) {
    return settings.seasonalShift;
  }
  return getEffectiveDefaultShift(settings);
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
  slot: "morning" | "evening" | null = null,
  geofenceShifts?: {
    defaultShift: WorkShift;
    morningShift: WorkShift;
    eveningShift: WorkShift;
  } | null
): { mode: AttendanceMode; shift: WorkShift; slot: "morning" | "evening" | null } {
  const mode = resolveEmployeeAttendanceMode(employee, settings.attendanceMode);
  const shifts = geofenceShifts ?? {
    defaultShift: settings.defaultShift,
    morningShift: settings.morningShift,
    eveningShift: settings.eveningShift,
  };

  let baseShift: WorkShift;
  if (mode === "office_two_shift") {
    baseShift = slot === "evening" ? shifts.eveningShift : shifts.morningShift;
    if (!slot) {
      // Company wall-clock minutes — never browser-local getHours (wrong shift near TZ edges).
      const tz = (settings as { timezone?: string }).timezone || DEFAULT_COMPANY_TIMEZONE;
      const nowMinutes = companyMinutesSinceMidnight(date, tz);
      const morningEnd = parseTimeToMinutes(shifts.morningShift.endTime);
      const eveningStart = parseTimeToMinutes(shifts.eveningShift.startTime);
      let threshold: number;
      if (Number.isFinite(morningEnd) && Number.isFinite(eveningStart)) {
        threshold = morningEnd + (eveningStart - morningEnd) / 2;
      } else {
        threshold = 14 * 60; // 14:00 safe default midpoint
      }
      slot = nowMinutes < threshold ? "morning" : "evening";
      baseShift = slot === "morning" ? shifts.morningShift : shifts.eveningShift;
    }
  } else {
    baseShift = geofenceShifts ? shifts.defaultShift : getActiveShiftForDate(settings, date);
    slot = null;
  }

  const shift: WorkShift = {
    ...baseShift,
    ...(employee.shiftOverride ?? {}),
  };

  if (!isValidHhMm(shift.startTime) || !isValidHhMm(shift.endTime)) {
    return {
      mode,
      shift: {
        ...FALLBACK_SHIFT,
        ...shift,
        startTime: FALLBACK_SHIFT.startTime,
        endTime: FALLBACK_SHIFT.endTime,
      },
      slot,
    };
  }

  return { mode, shift, slot };
}

export function parseTimeToMinutes(time: string): number {
  if (!isValidHhMm(time)) return NaN;
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
  let checkInMinutes = parseTimeToMinutes(checkInTime);
  const startMinutes = parseTimeToMinutes(shift.startTime);
  const endMinutes = parseTimeToMinutes(shift.endTime);
  const gracePeriod = shift.gracePeriodMinutes ?? 0;
  const lateThreshold = shift.lateThresholdMinutes ?? 0;

  if (
    !Number.isFinite(checkInMinutes) ||
    !Number.isFinite(startMinutes) ||
    !Number.isFinite(endMinutes)
  ) {
    return { status: "present", lateMinutes: 0 };
  }

  // Handle night shifts that cross midnight (e.g. 22:00 - 06:00).
  // A check-in after midnight (e.g. 01:58) needs to be compared to the
  // previous day's start time. We treat any early-morning check-in that is
  // more than 6 hours before the shift start as the next day.
  const shiftSpansMidnight = startMinutes > endMinutes;
  const nightWindowMinutes = 6 * 60;
  if (shiftSpansMidnight && checkInMinutes < startMinutes - nightWindowMinutes) {
    checkInMinutes += 24 * 60;
  }

  const graceEnd = startMinutes + gracePeriod;
  const lateEnd = graceEnd + lateThreshold;

  if (checkInMinutes <= graceEnd) {
    return { status: "present", lateMinutes: 0 };
  }
  if (checkInMinutes <= lateEnd) {
    const lateMinutes = Math.max(0, checkInMinutes - startMinutes);
    return { status: "late", lateMinutes };
  }
  const lateMinutes = Math.max(0, checkInMinutes - startMinutes);
  return { status: "late", lateMinutes };
}

/**
 * Calculate worked hours between check-in and check-out times.
 */
export function calculateWorkedHours(checkInTime: string, checkOutTime: string): number {
  const start = parseTimeToMinutes(checkInTime);
  const end = parseTimeToMinutes(checkOutTime);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  let diff = end - start;
  if (diff < 0) diff += 24 * 60; // crossed midnight
  return Number((diff / 60).toFixed(2));
}

export const attendanceModeLabels: Record<AttendanceMode, string> = {
  field: "ميداني",
  office_two_shift: "مكتبي بفترتين",
  hourly: "بالساعة",
};
