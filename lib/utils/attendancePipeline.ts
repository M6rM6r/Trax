/**
 * Attendance table + KPI pipeline (single source of truth for the Attendance page).
 *
 * Flow:
 *   raw punches → dedupePersonDay → coverage KPIs
 *              ↘ table rows (punches + synthetic absents on scorable days)
 *
 * Laws:
 *   1. Unit = person-day on scorable workdays only (not weekend / pre-deadline).
 *   2. present + late + absent === expected (always).
 *   3. Table may show weekend/extra punches as history; KPIs never count them.
 *   4. Display status for filters/badges is derived consistently (checkout ≠ erase late).
 */

import type { AttendanceRecord, AttendanceStatus, Employee } from "@/lib/types/trackingTypes";
import type { CompanySettings } from "@/lib/types/companySettings";
import {
  buildSyntheticAbsentRecords,
  computeAttendanceCoverage,
  isCompanyWeekend,
  isPastCheckInDeadlineForDay,
  type AttendanceCoverage,
} from "@/lib/utils/attendanceAbsent";

export type DisplayOutcome = "present" | "late" | "absent" | "checked_out";

/** True when a calendar day is a scorable workday slot (same rules as coverage). */
export function isScorableWorkday(
  dayYmd: string,
  settings?: Partial<CompanySettings> | null,
  now: Date = new Date()
): boolean {
  if (!dayYmd) return false;
  if (isCompanyWeekend(dayYmd, settings)) return false;
  return isPastCheckInDeadlineForDay(dayYmd, settings, now);
}

/** Arrival lateness for a punch row (stored facts only — no re-score from live settings). */
export function isLateArrival(r: Pick<AttendanceRecord, "lateMinutes" | "status">): boolean {
  return (r.lateMinutes ?? 0) > 0 || r.status === "late";
}

/**
 * Badge / filter outcome for one row.
 * - absent: no check-in
 * - checked_out: has checkout (may still be late on arrival — badge can show "Checked out · Late")
 * - late / present: open session arrival
 */
export function displayOutcome(r: AttendanceRecord): DisplayOutcome {
  if (!r.checkInTime) return "absent";
  if (r.status === "checked_out" || Boolean(r.checkOutTime)) return "checked_out";
  if (isLateArrival(r)) return "late";
  return "present";
}

/** KPI arrival bucket for a punch (only used on scorable days). */
export function arrivalBucket(r: AttendanceRecord): "present" | "late" | null {
  if (!r.checkInTime) return null;
  return isLateArrival(r) ? "late" : "present";
}

/**
 * One row per employee×day.
 * Prefer: open session over closed; later check-in; non-synthetic over synthetic.
 */
export function dedupeAttendanceByPersonDay(records: AttendanceRecord[]): AttendanceRecord[] {
  const byKey = new Map<string, AttendanceRecord>();

  const score = (r: AttendanceRecord): number => {
    let s = 0;
    if (r.checkInTime) s += 100;
    if (r.checkOutTime) s += 10;
    if (!String(r.id).startsWith("synthetic-")) s += 5;
    // Prefer later activity for tie-break.
    const act = r.checkOutTime || r.checkInTime || "";
    s += act.length > 0 ? act.charCodeAt(0) * 0.001 : 0;
    return s;
  };

  for (const r of records) {
    if (!r.date || r.employeeId === undefined || r.employeeId === null || r.employeeId === "") {
      continue;
    }
    const key = `${r.date}::${String(r.employeeId)}`;
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, r);
      continue;
    }
    const prevOpen = Boolean(prev.checkInTime && !prev.checkOutTime);
    const nextOpen = Boolean(r.checkInTime && !r.checkOutTime);
    if (nextOpen && !prevOpen) {
      byKey.set(key, r);
      continue;
    }
    if (prevOpen && !nextOpen) continue;
    // Prefer real punch over synthetic absent.
    const prevSyn = String(prev.id).startsWith("synthetic-");
    const nextSyn = String(r.id).startsWith("synthetic-");
    if (prevSyn && !nextSyn) {
      byKey.set(key, r);
      continue;
    }
    if (!prevSyn && nextSyn) continue;

    if (score(r) >= score(prev)) {
      // Prefer later check-in when both are real punches.
      const prevIn = prev.checkInTime ?? "";
      const nextIn = r.checkInTime ?? "";
      if (nextIn > prevIn || score(r) > score(prev)) byKey.set(key, r);
    }
  }

  return Array.from(byKey.values());
}

/** Attach roster names when punch docs have empty/stale employeeName. */
export function attachEmployeeNames(
  records: AttendanceRecord[],
  employees: Array<Pick<Employee, "id" | "name">>
): AttendanceRecord[] {
  if (!employees.length) return records;
  const names = new Map(employees.map((e) => [String(e.id), e.name]));
  return records.map((r) => {
    const rosterName = names.get(String(r.employeeId));
    if (!rosterName) return r;
    if (!r.employeeName || r.employeeName === String(r.employeeId)) {
      return { ...r, employeeName: rosterName };
    }
    return r;
  });
}

export type AttendancePipelineInput = {
  employees: Array<Pick<Employee, "id" | "name" | "status">>;
  attendance: AttendanceRecord[];
  fromYmd: string;
  toYmd: string;
  settings?: Partial<CompanySettings> | null;
  employeeId?: string | null;
  now?: Date;
  /** Max synthetic absent rows (default 400). */
  rowCap?: number;
};

export type AttendancePipelineResult = {
  /** Deduped punches in range (no synthetic). */
  punches: AttendanceRecord[];
  /** Table rows: punches + synthetic absents (when under cap). */
  rows: AttendanceRecord[];
  coverage: AttendanceCoverage;
  /** True when absent slots exist but table omitted synthetic rows (cap). */
  syntheticCapped: boolean;
  /** Weekend punches kept in table but excluded from KPIs. */
  weekendPunchCount: number;
};

/**
 * Full pipeline for Attendance page: one compute path for KPIs + table.
 */
export function buildAttendancePipeline(input: AttendancePipelineInput): AttendancePipelineResult {
  const {
    employees,
    attendance,
    fromYmd,
    toYmd,
    settings,
    employeeId,
    now = new Date(),
    rowCap,
  } = input;

  const named = attachEmployeeNames(attendance, employees);
  // Only rows inside the window (defense if fetch was wider).
  const inRange = named.filter((r) => {
    if (!r.date) return false;
    if (fromYmd && r.date < fromYmd) return false;
    if (toYmd && r.date > toYmd) return false;
    if (employeeId && String(r.employeeId) !== String(employeeId)) return false;
    return true;
  });

  const punches = dedupeAttendanceByPersonDay(inRange);

  const coverage = computeAttendanceCoverage({
    employees,
    attendance: punches,
    fromYmd,
    toYmd,
    settings,
    employeeId,
    now,
  });

  const synthetic = buildSyntheticAbsentRecords({
    employees,
    attendance: punches,
    fromYmd,
    toYmd,
    settings,
    now,
    employeeId,
    rowCap,
  });

  const syntheticCapped =
    coverage.absent > 0 && synthetic.length === 0 && coverage.absent > (rowCap ?? 400);

  // Never double-count: synthetic only for keys without a punch.
  const punchKeys = new Set(punches.map((r) => `${r.date}::${String(r.employeeId)}`));
  const syntheticClean = synthetic.filter(
    (r) => !punchKeys.has(`${r.date}::${String(r.employeeId)}`)
  );

  const merged = dedupeAttendanceByPersonDay([...punches, ...syntheticClean]);
  const rows = [...merged].sort((a, b) => {
    const byDate = b.date.localeCompare(a.date);
    if (byDate !== 0) return byDate;
    const aAct = a.checkOutTime || a.checkInTime || "";
    const bAct = b.checkOutTime || b.checkInTime || "";
    if (!aAct && bAct) return 1;
    if (aAct && !bAct) return -1;
    return bAct.localeCompare(aAct);
  });

  let weekendPunchCount = 0;
  for (const r of punches) {
    if (r.checkInTime && isCompanyWeekend(r.date, settings)) weekendPunchCount += 1;
  }

  return {
    punches,
    rows,
    coverage,
    syntheticCapped,
    weekendPunchCount,
  };
}

/**
 * Status filter match using display semantics (not raw Firestore status alone).
 * Selecting "late" includes checked-out-but-arrived-late rows.
 */
export function matchesStatusFilter(r: AttendanceRecord, statuses: string[]): boolean {
  if (!statuses.length) return true;
  const outcome = displayOutcome(r);
  const late = isLateArrival(r);

  for (const s of statuses) {
    if (s === "absent" && outcome === "absent") return true;
    if (s === "checked_out" && outcome === "checked_out") return true;
    if (s === "late" && (outcome === "late" || (outcome === "checked_out" && late))) return true;
    if (s === "present" && (outcome === "present" || (outcome === "checked_out" && !late))) {
      return true;
    }
    // Exact raw status fallback
    if (r.status === s) return true;
  }
  return false;
}

export function formatLateMinutes(minutes: number | null | undefined): string | null {
  const m = minutes ?? 0;
  if (m <= 0) return null;
  const hours = Math.floor(m / 60);
  const mins = m % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

export function formatWorkedHours(hours: number | null | undefined): string | null {
  if (hours === null || hours === undefined) return null;
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** Type guard helper for exports */
export function isAttendanceStatus(s: string): s is AttendanceStatus {
  return s === "present" || s === "late" || s === "absent" || s === "checked_out";
}
