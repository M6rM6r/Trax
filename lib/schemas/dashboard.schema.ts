import { z } from "zod";

export const dashboardStatsSchema = z.object({
  totalEmployees: z.number(),
  activeEmployees: z.number(),
  inactiveEmployees: z.number(),
  presentToday: z.number(),
  lateToday: z.number(),
  absentToday: z.number(),
  checkedOutToday: z.number(),
  onTimeRate: z.number(),
  avgCheckInTime: z.string(),
  avgWorkedHours: z.number(),
  totalGeofences: z.number(),
});

export const liveTrackingEmployeeSchema = z.object({
  id: z.number(),
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
  status: z.enum(["inside_geofence", "outside_geofence", "offline"]),
  lastSeen: z.string(),
  geofenceName: z.string().nullable().optional(),
  batteryLevel: z.number().nullable(),
  role: z.enum(["manager", "employee", "supervisor"]).optional(),
  avatar: z.string().nullable().optional(),
  speed: z.number().nullable().optional(),
});

export const liveTrackingListSchema = z.array(liveTrackingEmployeeSchema);

export const dashboardTrendDaySchema = z.object({
  date: z.string().optional(),
  day: z.string(),
  present: z.number(),
  late: z.number(),
  absent: z.number(),
  avgWorkedHours: z.number().optional(),
});

export const peakHourSchema = z.object({
  hour: z.string(),
  count: z.number(),
});

export const dashboardTrendsSchema = z.object({
  weeklyData: z.array(dashboardTrendDaySchema),
  peakHoursData: z.array(peakHourSchema),
  employeeGrowth: z.number().default(0),
  presentChange: z.number().default(0),
  lateChange: z.number().default(0),
  absentChange: z.number().default(0),
  onTimeRateChange: z.number().default(0),
});

export type DashboardStatsSchema = z.infer<typeof dashboardStatsSchema>;
export type DashboardTrendDaySchema = z.infer<typeof dashboardTrendDaySchema>;
export type PeakHourSchema = z.infer<typeof peakHourSchema>;
export type DashboardTrendsSchema = z.infer<typeof dashboardTrendsSchema>;
export type LiveTrackingEmployeeSchema = z.infer<typeof liveTrackingEmployeeSchema>;
