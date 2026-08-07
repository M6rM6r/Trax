import type { AttendanceRecord, Employee } from "@/lib/types/trackingTypes";
import type { CompanySettings } from "@/lib/types/companySettings";
import { computeAttendanceCoverage } from "@/lib/utils/attendanceAbsent";
import { DEFAULT_COMPANY_TIMEZONE, formatCompanyDate } from "@/lib/utils/companyDate";

export interface RetentionFeatures {
  totalEmployees: number;
  activeEmployees: number;
  attendanceRate: number;
  avgLateMinutes: number;
  absenceRate: number;
  checkOutCompletionRate: number;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function buildRetentionFeatures(
  attendance: AttendanceRecord[],
  employees: Employee[],
  settings?: Partial<CompanySettings> | null,
  /** Same fetch window as reports/attendance — never shrink to min/max punch dates. */
  window?: { from?: string; to?: string } | null
): RetentionFeatures {
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.status === "active").length;
  const tz = settings?.timezone || DEFAULT_COMPANY_TIMEZONE;

  // Empty feed → zero rates (no invented 100% absence from a silent window).
  if (attendance.length === 0) {
    return {
      totalEmployees,
      activeEmployees,
      attendanceRate: 0,
      avgLateMinutes: 0,
      absenceRate: 0,
      checkOutCompletionRate: 0,
    };
  }

  const dates = attendance.map((r) => r.date).filter(Boolean);
  const dataTo = dates.length
    ? dates.reduce((a, b) => (a > b ? a : b))
    : formatCompanyDate(new Date(), tz);
  const dataFrom = dates.length ? dates.reduce((a, b) => (a < b ? a : b)) : dataTo;
  // Prefer caller window (reports = last 30d). Without it, use punch span — never invent a wider empty range.
  const toYmd = window?.to && window.to.trim() !== "" ? window.to : dataTo;
  const fromYmd = window?.from && window.from.trim() !== "" ? window.from : dataFrom;

  const coverage = computeAttendanceCoverage({
    employees,
    attendance,
    fromYmd,
    toYmd,
    settings,
  });

  const lateRecords = attendance.filter((r) => (r.lateMinutes ?? 0) > 0 && r.checkInTime);
  const avgLateMinutes = lateRecords.length
    ? lateRecords.reduce((sum, r) => sum + (r.lateMinutes ?? 0), 0) / lateRecords.length
    : 0;

  const checkedInSlots = coverage.present + coverage.late;
  const checkOutCompletionRate =
    checkedInSlots > 0 ? round((coverage.checkedOut / checkedInSlots) * 100) : 0;

  return {
    totalEmployees,
    activeEmployees,
    attendanceRate: coverage.attendanceRate,
    avgLateMinutes: round(avgLateMinutes),
    absenceRate: coverage.expected > 0 ? round((coverage.absent / coverage.expected) * 100) : 0,
    checkOutCompletionRate,
  };
}
