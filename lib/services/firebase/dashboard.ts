import type { DashboardStats } from "@/lib/types/trackingTypes";
import type { DashboardTrendsSchema } from "@/lib/schemas/dashboard.schema";
import { employeesApi } from "./employees";
import { attendanceApi } from "./attendance";
import { geofencesApi } from "./geofences";

export const dashboardApi = {
  async getDashboardData(): Promise<{
    stats: DashboardStats;
    trends: DashboardTrendsSchema;
  }> {
    const [employees, attendance, geofences] = await Promise.all([
      employeesApi.list(),
      attendanceApi.list(),
      geofencesApi.list(),
    ]);
    const today = new Date();
    const todayStr = today.toLocaleDateString("sv-SE");
    const todayRecords = attendance.filter((record) => record.date === todayStr);
    const presentToday = todayRecords.filter(
      (record) => record.status === "present" || record.status === "checked_out"
    ).length;
    const lateToday = todayRecords.filter((record) => record.status === "late").length;
    const checkedOutToday = todayRecords.filter((record) => record.status === "checked_out").length;
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
      absentToday: Math.max(0, employees.length - todayRecords.length),
      lateToday,
      checkedOutToday,
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
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("sv-SE");
      const dayRecords = attendance.filter((r) => r.date === dateStr);
      const present = dayRecords.filter(
        (r) => r.status === "present" || r.status === "checked_out"
      ).length;
      const late = dayRecords.filter((r) => r.status === "late").length;
      const absent = Math.max(0, employees.length - dayRecords.length);
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
      const count = attendance.filter((r) => {
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
