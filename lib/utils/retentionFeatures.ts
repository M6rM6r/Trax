import type { AttendanceRecord, Employee } from "@/lib/types/trackingTypes";

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
  employees: Employee[]
): RetentionFeatures {
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.status === "active").length;

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

  const presentOrLate = attendance.filter(
    (r) => r.status === "present" || r.status === "late" || r.status === "checked_out"
  ).length;
  const absentCount = attendance.filter((r) => r.status === "absent").length;
  const checkedOutCount = attendance.filter((r) => Boolean(r.checkOutTime)).length;

  const lateRecords = attendance.filter((r) => r.lateMinutes > 0);
  const avgLateMinutes = lateRecords.length
    ? lateRecords.reduce((sum, r) => sum + r.lateMinutes, 0) / lateRecords.length
    : 0;

  return {
    totalEmployees,
    activeEmployees,
    attendanceRate: round((presentOrLate / attendance.length) * 100),
    avgLateMinutes: round(avgLateMinutes),
    absenceRate: round((absentCount / attendance.length) * 100),
    checkOutCompletionRate: round((checkedOutCount / attendance.length) * 100),
  };
}
