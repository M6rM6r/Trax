import type { AttendanceRecord } from "@/lib/types/trackingTypes";
import type { CompanySettings } from "@/lib/types/companySettings";
import {
  companyMinutesSinceMidnight,
  companyWeekday,
  DEFAULT_COMPANY_TIMEZONE,
  formatCompanyDate,
} from "@/lib/utils/companyDate";

type EmployeeLike = {
  id: string | number;
  name?: string;
  status?: string;
  geofenceId?: string | number | null;
};

/**
 * True once company wall-clock is past workStart + grace for the given day.
 * Historical days (before "today" in company TZ) are always past deadline.
 * Missing workStartTime → treat as past (same as dashboard).
 */
export function isPastCheckInDeadlineForDay(
  dayYmd: string,
  settings?: Partial<CompanySettings> | null,
  now: Date = new Date()
): boolean {
  const tz = settings?.timezone || DEFAULT_COMPANY_TIMEZONE;
  const todayYmd = formatCompanyDate(now, tz);
  if (dayYmd < todayYmd) return true;
  if (dayYmd > todayYmd) return false;

  if (!settings?.workStartTime) return true;
  const [hours, minutes] = settings.workStartTime.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return true;
  const nowMinutes = companyMinutesSinceMidnight(now, tz);
  const deadlineMinutes = hours * 60 + minutes + (settings.gracePeriodMinutes ?? 0);
  return nowMinutes >= deadlineMinutes;
}

export function isCompanyWeekend(
  dayYmd: string,
  settings?: Partial<CompanySettings> | null
): boolean {
  const tz = settings?.timezone || DEFAULT_COMPANY_TIMEZONE;
  const weekend = settings?.weekendDays ?? [5, 6];
  // Noon UTC anchor so TZ conversion lands on the intended calendar day (not browser-local).
  const ref = new Date(`${dayYmd}T12:00:00Z`);
  return weekend.includes(companyWeekday(ref, tz));
}

/** Inclusive list of YYYY-MM-DD from start to end. */
export function eachDateInclusive(startYmd: string, endYmd: string): string[] {
  if (!startYmd || !endYmd || startYmd > endYmd) return [];
  const out: string[] = [];
  const cur = new Date(`${startYmd}T12:00:00Z`);
  const end = new Date(`${endYmd}T12:00:00Z`);
  while (cur.getTime() <= end.getTime()) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

export type AttendanceCoverage = {
  /** On-time arrivals (person-days). */
  present: number;
  /** Late arrivals (person-days). */
  late: number;
  /** No check-in after deadline on a workday (person-days). */
  absent: number;
  /** Sessions that reached checkout (subset of present+late). */
  checkedOut: number;
  /** Workdays in range where absence is scorable (past deadline, not weekend). */
  workdays: number;
  /** activeEmployees × workdays — denominator for rate math. */
  expected: number;
  /**
   * Identity: present + late + absent === expected (after deadline workdays).
   * total === expected so cards never lie about “% of what”.
   */
  total: number;
  activeEmployees: number;
  /** 0–100 attendance rate: (present+late) / expected. */
  attendanceRate: number;
};

type PunchLike = {
  date: string;
  employeeId: string | number;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  status: string;
  lateMinutes?: number | null;
};

/**
 * Single source of truth for Attendance KPI cards (today, 7d, 30d, month).
 *
 * Unit = person-day:
 *   expected = activeEmployees × scorable workdays
 *   present  = check-ins that were on time
 *   late     = check-ins that were late
 *   absent   = expected − unique check-ins (by employee×day)
 *   total    = expected  (not raw Firestore row count)
 *
 * Large numbers on multi-day ranges are correct (e.g. 10 staff × 5 workdays = 50 slots).
 * UI must label them as person-days / attendance slots, not “people”.
 */
export function computeAttendanceCoverage(args: {
  employees: EmployeeLike[];
  attendance: PunchLike[];
  fromYmd: string;
  toYmd: string;
  settings?: Partial<CompanySettings> | null;
  /** When set, only this employee is in the roster (filter). */
  employeeId?: string | null;
  now?: Date;
}): AttendanceCoverage {
  const { employees, attendance, fromYmd, toYmd, settings, employeeId, now = new Date() } = args;

  let active = employees.filter((e) => (e.status ?? "active") === "active");
  if (employeeId) {
    active = active.filter((e) => String(e.id) === String(employeeId));
  }

  const empty: AttendanceCoverage = {
    present: 0,
    late: 0,
    absent: 0,
    checkedOut: 0,
    workdays: 0,
    expected: 0,
    total: 0,
    activeEmployees: active.length,
    attendanceRate: 0,
  };
  if (active.length === 0 || !fromYmd || !toYmd) return empty;

  const activeIds = new Set(active.map((e) => String(e.id)));

  // Scorable person-day slots only: workday + past check-in deadline.
  // Weekend / pre-deadline punches may still appear in the table, but must NOT
  // inflate present/late while expected stays 0 (identity break).
  const scorableDays = new Set<string>();
  for (const day of eachDateInclusive(fromYmd, toYmd)) {
    if (isCompanyWeekend(day, settings)) continue;
    if (!isPastCheckInDeadlineForDay(day, settings, now)) continue;
    scorableDays.add(day);
  }
  const workdays = scorableDays.size;

  // One arrival outcome per employee×day on scorable days only (last punch wins).
  const arrivalByKey = new Map<string, "present" | "late">();
  const checkedOutKeys = new Set<string>();

  for (const r of attendance) {
    const eid = String(r.employeeId);
    if (!activeIds.has(eid)) continue;
    if (!r.checkInTime) continue;
    if (!scorableDays.has(r.date)) continue;
    const key = `${r.date}::${eid}`;
    const late = (r.lateMinutes ?? 0) > 0 || r.status === "late";
    arrivalByKey.set(key, late ? "late" : "present");
    if (r.status === "checked_out" || Boolean(r.checkOutTime)) {
      checkedOutKeys.add(key);
    }
  }

  let present = 0;
  let late = 0;
  arrivalByKey.forEach((outcome) => {
    if (outcome === "late") late += 1;
    else present += 1;
  });

  const expected = active.length * workdays;
  const checkedIn = arrivalByKey.size;
  const absent = Math.max(0, expected - checkedIn);
  const attendanceRate =
    expected > 0 ? Number((((present + late) / expected) * 100).toFixed(1)) : 0;

  return {
    present,
    late,
    absent,
    checkedOut: checkedOutKeys.size,
    workdays,
    expected,
    total: expected,
    activeEmployees: active.length,
    attendanceRate,
  };
}

/** @deprecated Prefer computeAttendanceCoverage().absent */
export function countAbsentPersonDays(args: {
  employees: EmployeeLike[];
  attendance: PunchLike[];
  fromYmd: string;
  toYmd: string;
  settings?: Partial<CompanySettings> | null;
  now?: Date;
}): number {
  return computeAttendanceCoverage(args).absent;
}

/**
 * Cap for materializing synthetic absent rows in the table.
 * KPI cards always use full coverage math; the grid only expands when cheap.
 * ~400 rows ≈ 20 employees × 20 workdays — still smooth on mobile.
 */
export const SYNTHETIC_ABSENT_ROW_CAP = 400;

/**
 * Synthetic absent rows for UI tables (not persisted).
 * One per missing active employee per scorable workday.
 * Returns [] when estimated row count exceeds `rowCap` (KPIs still use coverage math).
 */
export function buildSyntheticAbsentRecords(args: {
  employees: EmployeeLike[];
  attendance: AttendanceRecord[];
  fromYmd: string;
  toYmd: string;
  settings?: Partial<CompanySettings> | null;
  now?: Date;
  employeeId?: string | null;
  rowCap?: number;
}): AttendanceRecord[] {
  const {
    employees,
    attendance,
    fromYmd,
    toYmd,
    settings,
    now = new Date(),
    employeeId,
    rowCap = SYNTHETIC_ABSENT_ROW_CAP,
  } = args;

  let active = employees.filter((e) => (e.status ?? "active") === "active");
  if (employeeId) {
    active = active.filter((e) => String(e.id) === String(employeeId));
  }
  if (active.length === 0 || !fromYmd || !toYmd) return [];

  const coverage = computeAttendanceCoverage({
    employees: active,
    attendance,
    fromYmd,
    toYmd,
    settings,
    now,
  });
  // Don't materialize thousands of ghost rows — cards already show the truth.
  if (coverage.absent > rowCap) return [];

  const checkedInByDay = new Map<string, Set<string>>();
  for (const r of attendance) {
    if (!r.checkInTime) continue;
    const day = r.date;
    if (!checkedInByDay.has(day)) checkedInByDay.set(day, new Set());
    checkedInByDay.get(day)!.add(String(r.employeeId));
  }

  const explicitAbsent = new Set(
    attendance
      .filter((r) => r.status === "absent" && !r.checkInTime)
      .map((r) => `${r.date}::${String(r.employeeId)}`)
  );

  const synthetic: AttendanceRecord[] = [];
  for (const day of eachDateInclusive(fromYmd, toYmd)) {
    if (isCompanyWeekend(day, settings)) continue;
    if (!isPastCheckInDeadlineForDay(day, settings, now)) continue;
    const checked = checkedInByDay.get(day) ?? new Set();
    for (const emp of active) {
      const id = String(emp.id);
      if (checked.has(id)) continue;
      if (explicitAbsent.has(`${day}::${id}`)) continue;
      const assignedId =
        emp.geofenceId !== null &&
        emp.geofenceId !== undefined &&
        String(emp.geofenceId).trim() !== ""
          ? String(emp.geofenceId)
          : null;
      synthetic.push({
        id: `synthetic-absent-${day}-${id}`,
        employeeId: id,
        employeeName: emp.name || id,
        date: day,
        checkInTime: null,
        checkOutTime: null,
        status: "absent",
        lateMinutes: 0,
        workedHours: null,
        earlyCheckout: false,
        geofenceId: assignedId,
        geofenceName: null,
      } as AttendanceRecord);
    }
  }
  return synthetic;
}
