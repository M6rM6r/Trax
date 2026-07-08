import { z } from "zod";

export const dashboardStatsSchema = z.object({
  totalEmployees: z.coerce.number().int().min(0),
  activeEmployees: z.coerce.number().int().min(0),
  inactiveEmployees: z.coerce.number().int().min(0),
  presentToday: z.coerce.number().int().min(0),
  lateToday: z.coerce.number().int().min(0),
  absentToday: z.coerce.number().int().min(0),
  checkedOutToday: z.coerce.number().int().min(0),
  onTimeRate: z.coerce.number().min(0).max(1),
  avgCheckInTime: z.string(),
  avgWorkedHours: z.coerce.number().min(0).max(24),
  totalGeofences: z.coerce.number().int().min(0),
});

export const liveTrackingEmployeeSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string().trim().min(1),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  status: z.enum(["inside_geofence", "outside_geofence", "offline"]),
  lastSeen: z.string(),
  geofenceName: z.string().nullable().optional(),
  batteryLevel: z.coerce.number().min(0).max(100).nullable(),
  role: z.enum(["manager", "employee", "supervisor"]).optional(),
  avatar: z.string().nullable().optional(),
  speed: z.coerce.number().min(0).nullable().optional(),
});

export const liveTrackingListSchema = z.array(liveTrackingEmployeeSchema);

export const dashboardTrendDaySchema = z.object({
  date: z.string().optional(),
  day: z.string().trim().min(1),
  present: z.coerce.number().int().min(0),
  late: z.coerce.number().int().min(0),
  absent: z.coerce.number().int().min(0),
  avgWorkedHours: z.coerce.number().min(0).max(24).optional(),
});

export const peakHourSchema = z.object({
  hour: z.string().trim().min(1),
  count: z.coerce.number().int().min(0),
});

export const dashboardTrendsSchema = z.object({
  weeklyData: z.array(dashboardTrendDaySchema).default([]),
  peakHoursData: z.array(peakHourSchema).default([]),
  employeeGrowth: z.coerce.number().default(0),
  presentChange: z.coerce.number().default(0),
  lateChange: z.coerce.number().default(0),
  absentChange: z.coerce.number().default(0),
  onTimeRateChange: z.coerce.number().default(0),
});

export type DashboardStatsSchema = z.infer<typeof dashboardStatsSchema>;
export type DashboardTrendDaySchema = z.infer<typeof dashboardTrendDaySchema>;
export type PeakHourSchema = z.infer<typeof peakHourSchema>;
export type DashboardTrendsSchema = z.infer<typeof dashboardTrendsSchema>;
export type LiveTrackingEmployeeSchema = z.infer<typeof liveTrackingEmployeeSchema>;
