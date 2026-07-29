import type { DashboardStats } from "@/lib/types/trackingTypes";
import type { DashboardTrendsSchema } from "@/lib/schemas/dashboard.schema";
import type { CompanySettings } from "@/lib/types/companySettings";
import { employeesApi } from "./employees";
import { attendanceApi } from "./attendance";
import { geofencesApi } from "./geofences";
import { getCompanyId, ensureAuth } from "./helpers";

const EMPTY_STATS: DashboardStats = {
  totalEmployees: 0,
  activeEmployees: 0,
  inactiveEmployees: 0,
  presentToday: 0,
  absentToday: 0,
  lateToday: 0,
  checkedOutToday: 0,
  earlyCheckoutsToday: 0,
  onTimeRate: 0,
  avgCheckInTime: "N/A",
  avgWorkedHours: 0,
  totalGeofences: 0,
  fieldToday: 0,
  officeToday: 0,
  hourlyToday: 0,
};
const EMPTY_TRENDS: DashboardTrendsSchema = {
  weeklyData: [],
  peakHoursData: [],
  employeeGrowth: 0,
  presentChange: 0,
  lateChange: 0,
  absentChange: 0,
  onTimeRateChange: 0,
};

function isPastCheckInDeadline(
  settings?: Partial<CompanySettings>,
  referenceDate: Date = new Date()
): boolean {
  if (!settings?.workStartTime) return true;
  const [hours, minutes] = settings.workStartTime.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return true;
  const deadline = new Date(referenceDate);
  deadline.setHours(hours, minutes + (settings.gracePeriodMinutes ?? 0), 0, 0);
  return referenceDate >= deadline;
}

export const dashboardApi = {
  async getDashboardData(
    { from, to }: { from?: string; to?: string } = {},
    companySettings?: Partial<CompanySettings>
  ): Promise<{
    stats: DashboardStats;
    trends: DashboardTrendsSchema;
  }> {
    // Ensure user is authenticated first
    try {
      await ensureAuth();
    } catch {
      return { stats: EMPTY_STATS, trends: EMPTY_TRENDS };
    }
    // If no company assigned yet, return empty dashboard
    const companyId = getCompanyId();
    if (!companyId) {
      return { stats: EMPTY_STATS, trends: EMPTY_TRENDS };
    }

    let employees: Awaited<ReturnType<typeof employeesApi.list>> = [];
    let attendance: Awaited<ReturnType<typeof attendanceApi.list>> = [];
    let geofences: Awaited<ReturnType<typeof geofencesApi.list>> = [];
    const [empRes, attRes, geoRes] = await Promise.allSettled([
      employeesApi.list(),
      attendanceApi.list(undefined, { from, to }),
      geofencesApi.list(),
    ]);
    if (empRes.status === "fulfilled") employees = empRes.value;
    else console.warn("[dashboard] employees fetch failed:", empRes.reason);
    if (attRes.status === "fulfilled") attendance = attRes.value;
    else console.warn("[dashboard] attendance fetch failed:", attRes.reason);
    if (geoRes.status === "fulfilled") geofences = geoRes.value;
    else console.warn("[dashboard] geofences fetch failed:", geoRes.reason);
    const toStr = typeof to === "string" ? to : undefined;
    const fromStr = typeof from === "string" ? from : undefined;
    const referenceDate = toStr ? new Date(`${toStr}T00:00:00`) : new Date();
    const todayStr = toStr || referenceDate.toLocaleDateString("sv-SE");
    const todayRecords = attendance.filter((record) => record.date === todayStr);
    const rangeRecords =
      fromStr && toStr
        ? attendance.filter((record) => record.date >= fromStr && record.date <= toStr)
        : attendance;
    const activeEmployees = employees.filter((employee) => employee.status === "active");
    const presentToday = todayRecords.filter(
      (record) =>
        record.status === "present" ||
        (record.status === "checked_out" && !(record.lateMinutes > 0))
    ).length;
    const lateToday = todayRecords.filter(
      (record) =>
        record.status === "late" || (record.status === "checked_out" && record.lateMinutes > 0)
    ).length;
    const checkedOutToday = todayRecords.filter((record) => record.status === "checked_out").length;
    const earlyCheckoutsToday = todayRecords.filter((record) => record.earlyCheckout).length;
    const worked = todayRecords.map((record) => record.workedHours).filter((hours) => hours > 0);
    const punctualBase = presentToday + lateToday;
    const checkInTimes = todayRecords
      .map((r) => r.checkInTime)
      .filter((t): t is string => t !== null && t !== undefined)
      .sort();
    const medianCheckIn =
      checkInTimes.length > 0 ? checkInTimes[Math.floor(checkInTimes.length / 2)] : "N/A";

    const stats: DashboardStats = {
      totalEmployees: employees.length,
      activeEmployees: employees.filter((employee) => employee.status === "active").length,
      inactiveEmployees: employees.filter((employee) => employee.status === "inactive").length,
      presentToday,
      absentToday: isPastCheckInDeadline(companySettings, referenceDate)
        ? Math.max(0, activeEmployees.length - todayRecords.length)
        : 0,
      lateToday,
      checkedOutToday,
      earlyCheckoutsToday,
      onTimeRate: punctualBase > 0 ? Number(((presentToday / punctualBase) * 100).toFixed(1)) : 0,
      avgCheckInTime: medianCheckIn,
      avgWorkedHours:
        worked.length > 0
          ? Number((worked.reduce((sum, hours) => sum + hours, 0) / worked.length).toFixed(1))
          : 0,
      totalGeofences: geofences.length,
      fieldToday: todayRecords.filter((r) => r.attendanceMode === "field").length,
      officeToday: todayRecords.filter((r) => r.attendanceMode === "office_two_shift").length,
      hourlyToday: todayRecords.filter((r) => r.attendanceMode === "hourly").length,
    };

    const dayNames = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    const weeklyData: {
      day: string;
      present: number;
      late: number;
      absent: number;
      avgWorkedHours: number;
    }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(referenceDate);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("sv-SE");
      const dayRecords = attendance.filter((r) => r.date === dateStr);
      const present = dayRecords.filter(
        (r) => r.status === "present" || (r.status === "checked_out" && !(r.lateMinutes > 0))
      ).length;
      const late = dayRecords.filter(
        (r) => r.status === "late" || (r.status === "checked_out" && r.lateMinutes > 0)
      ).length;
      const absent = Math.max(0, activeEmployees.length - dayRecords.length);
      const dayWorked = dayRecords.map((r) => r.workedHours).filter((h) => h > 0);
      weeklyData.push({
        day: dayNames[d.getDay()],
        present,
        late,
        absent,
        avgWorkedHours:
          dayWorked.length > 0
            ? Number((dayWorked.reduce((s, h) => s + h, 0) / dayWorked.length).toFixed(1))
            : 0,
      });
    }
    const peakHoursData: { hour: string; count: number }[] = [];
    for (let h = 6; h <= 19; h++) {
      const count = rangeRecords.filter((r) => {
        const checkInHour = parseInt(r.checkInTime?.split(":")[0] ?? "0", 10);
        return checkInHour === h;
      }).length;
      const label = h < 12 ? `${h}ص` : `${h - 12 === 0 ? 12 : h - 12}م`;
      peakHoursData.push({ hour: label, count });
    }

    const trends: DashboardTrendsSchema = {
      weeklyData,
      peakHoursData,
      employeeGrowth: 0,
      presentChange: 0,
      lateChange: 0,
      absentChange: 0,
      onTimeRateChange: 0,
    };

    return { stats, trends };
  },
};
