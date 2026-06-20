import { z } from "zod";

export const attendanceRecordSchema = z.object({
  id: z.number(),
  employeeId: z.number(),
  employeeName: z.string(),
  date: z.string(),
  checkInTime: z.string().nullable().optional(),
  checkOutTime: z.string().nullable().optional(),
  status: z.enum(["present", "late", "absent", "checked_out"]),
  lateMinutes: z.number().default(0),
  workedHours: z.number().default(0),
  geofenceName: z.string().nullable().optional(),
});

export const attendanceListSchema = z.array(attendanceRecordSchema);

export const checkInSchema = z.object({
  employeeId: z.number(),
  lat: z.number(),
  lng: z.number(),
  geofenceId: z.number(),
  timestamp: z.string().optional(),
});

export type AttendanceRecordSchema = z.infer<typeof attendanceRecordSchema>;
export type CheckInSchema = z.infer<typeof checkInSchema>;
