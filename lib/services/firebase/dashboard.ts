import type { DashboardStats } from "@/lib/types/trackingTypes";
import type { DashboardTrendsSchema } from "@/lib/schemas/dashboard.schema";
import type { CompanySettings } from "@/lib/types/companySettings";
import { DEFAULT_COMPANY_TIMEZONE, formatCompanyDate } from "@/lib/utils/companyDate";
import { last7CompanyDays } from "@/lib/utils/attendanceWindow";
import { computeAttendanceCoverage } from "@/lib/utils/attendanceAbsent";
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

const DAY_NAMES_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export const dashboardApi = {
  async getDashboardData(
    { from, to }: { from?: string; to?: string } = {},
    companySettings?: Partial<CompanySettings>
  ): Promise<{
    stats: DashboardStats;
    trends: DashboardTrendsSchema;
  }> {
    try {
      await ensureAuth();
    } catch {
      return { stats: EMPTY_STATS, trends: EMPTY_TRENDS };
    }
    const companyId = getCompanyId();
    if (!companyId) {
      return { stats: EMPTY_STATS, trends: EMPTY_TRENDS };
    }

    const tz = companySettings?.timezone || DEFAULT_COMPANY_TIMEZONE;
    const now = new Date();
    const companyToday = formatCompanyDate(now, tz);
    const toStr = typeof to === "string" && to ? to : companyToday;
    // Always pull enough history for the 7-day trend, even if the UI range is "today".
    const weekWindow = last7CompanyDays(tz, new Date(`${toStr}T12:00:00Z`));
    const weekFrom = weekWindow.from;
    const fromStr =
      typeof from === "string" && from ? (from < weekFrom ? from : weekFrom) : weekFrom;

    let employees: Awaited<ReturnType<typeof employeesApi.list>> = [];
    let attendance: Awaited<ReturnType<typeof attendanceApi.list>> = [];
    let geofences: Awaited<ReturnType<typeof geofencesApi.list>> = [];
    const [empRes, attRes, geoRes] = await Promise.allSettled([
      employeesApi.list(),
      attendanceApi.list(undefined, { from: fromStr, to: toStr }),
      geofencesApi.list(),
    ]);
    if (empRes.status === "fulfilled") employees = empRes.value;
    else console.warn("[dashboard] employees fetch failed:", empRes.reason);
    if (attRes.status === "fulfilled") attendance = attRes.value;
    else console.warn("[dashboard] attendance fetch failed:", attRes.reason);
    if (geoRes.status === "fulfilled") geofences = geoRes.value;
    else console.warn("[dashboard] geofences fetch failed:", geoRes.reason);

    const todayStr = toStr;
    const todayRecords = attendance.filter((record) => record.date === todayStr);
    const rangeRecords = attendance.filter(
      (record) => record.date >= fromStr && record.date <= toStr
    );
    const activeEmployees = employees.filter((employee) => employee.status === "active");

    // Single source of truth — same engine as Attendance page KPIs.
    const todayCoverage = computeAttendanceCoverage({
      employees,
      attendance,
      fromYmd: todayStr,
      toYmd: todayStr,
      settings: companySettings,
      now,
    });

    const earlyCheckoutsToday = todayRecords.filter((record) => record.earlyCheckout).length;
    const worked = todayRecords
      .map((record) => record.workedHours)
      .filter((hours): hours is number => hours !== null && hours > 0);
    const checkInTimes = todayRecords
      .map((r) => r.checkInTime)
      .filter((t): t is string => t !== null && t !== undefined)
      .sort();
    const medianCheckIn =
      checkInTimes.length > 0 ? checkInTimes[Math.floor(checkInTimes.length / 2)] : "N/A";

    const stats: DashboardStats = {
      totalEmployees: employees.length,
      activeEmployees: activeEmployees.length,
      inactiveEmployees: employees.filter((employee) => employee.status === "inactive").length,
      presentToday: todayCoverage.present,
      absentToday: todayCoverage.absent,
      lateToday: todayCoverage.late,
      checkedOutToday: todayCoverage.checkedOut,
      earlyCheckoutsToday,
      // On-time among arrivals only — not attendance rate (that includes absents).
      onTimeRate:
        todayCoverage.present + todayCoverage.late > 0
          ? Number(
              (
                (todayCoverage.present / (todayCoverage.present + todayCoverage.late)) *
                100
              ).toFixed(1)
            )
          : 0,
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

    const weeklyData: {
      day: string;
      present: number;
      late: number;
      absent: number;
      avgWorkedHours: number;
    }[] = [];
    // One pass group — avoid O(7n) filter on every dashboard load.
    const byDate = new Map<string, typeof attendance>();
    for (const r of attendance) {
      if (!r.date) continue;
      const list = byDate.get(r.date);
      if (list) list.push(r);
      else byDate.set(r.date, [r]);
    }
    const wdMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    for (let i = 6; i >= 0; i--) {
      const d = new Date(`${toStr}T12:00:00Z`);
      d.setUTCDate(d.getUTCDate() - i);
      const dateStr = formatCompanyDate(d, tz);
      const dayRecords = byDate.get(dateStr) ?? [];
      // Same person-day engine as Attendance page (weekends → expected 0).
      const dayCov = computeAttendanceCoverage({
        employees,
        attendance: dayRecords,
        fromYmd: dateStr,
        toYmd: dateStr,
        settings: companySettings,
        now,
      });
      const dayWorked = dayRecords
        .map((r) => r.workedHours)
        .filter((h): h is number => h !== null && h > 0);
      const wd = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        weekday: "short",
      }).format(d);
      weeklyData.push({
        day: DAY_NAMES_AR[wdMap[wd] ?? 0],
        present: dayCov.present,
        late: dayCov.late,
        absent: dayCov.absent,
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
