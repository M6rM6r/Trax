import { z } from "zod";

export const dashboardStatsSchema = z.object({
  totalEmployees: z.number(),
  activeEmployees: z.number(),
  inactiveEmployees: z.number(),
  presentToday: z.number(),
  lateToday: z.number(),
  absentToday: z.number(),
  onTimeRate: z.number(),
  avgWorkedHours: z.number(),
  totalGeofences: z.number(),
});

export const liveTrackingEmployeeSchema = z.object({
  id: z.number(),
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
  status: z.enum(["online", "offline", "idle"]),
  lastSeen: z.string(),
  geofenceName: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
  role: z.enum(["manager", "employee", "supervisor"]),
  batteryLevel: z.number().nullable().optional(),
  speed: z.number().nullable().optional(),
});

export const liveTrackingListSchema = z.array(liveTrackingEmployeeSchema);

export type DashboardStatsSchema = z.infer<typeof dashboardStatsSchema>;
export type LiveTrackingEmployeeSchema = z.infer<typeof liveTrackingEmployeeSchema>;
