import { DEFAULT_COMPANY_TIMEZONE, formatCompanyDate } from "@/lib/utils/companyDate";

export const queryKeys = {
  employees: ["employees"] as const,
  employeesInactive: ["employees", "inactive"] as const,
  attendance: ["attendance"] as const,
  attendanceReports: ["attendance", "reports"] as const,
  geofences: ["geofences"] as const,
  dashboard: ["dashboard", "data"] as const,
  dashboardTrends: ["dashboard", "trends"] as const,
  tracking: ["tracking", "live"] as const,
  aiRetention: ["ai", "retention"] as const,
  companySettings: ["company-settings"] as const,
};

/** Must match useMyAttendance + check-in optimistic cache writes (include company day). */
export function myAttendanceQueryKey(
  companyId: string | null | undefined,
  employeeId: string | number | null | undefined,
  todayYmd: string
) {
  return [
    ...queryKeys.attendance,
    "my",
    companyId ?? "unassigned",
    employeeId ?? "none",
    todayYmd,
  ] as const;
}

export interface DashboardDateRange {
  from?: Date;
  to?: Date;
}

/**
 * Calendar day for API/query keys in company timezone (default Asia/Riyadh).
 * Avoid browser-local getFullYear/Month/Date — those diverge near midnight for KSA product.
 */
export function toApiDate(
  value?: Date,
  timeZone: string = DEFAULT_COMPANY_TIMEZONE
): string | undefined {
  if (!value) return undefined;
  return formatCompanyDate(value, timeZone);
}
