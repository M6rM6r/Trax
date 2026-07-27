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

export interface DashboardDateRange {
  from?: Date;
  to?: Date;
}

export function toApiDate(value?: Date): string | undefined {
  if (!value) return undefined;
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
