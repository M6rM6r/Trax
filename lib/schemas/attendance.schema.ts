import { z } from "zod";

export const attendanceRecordSchema = z.object({
  id: z.coerce.number().int().positive(),
  employeeId: z.coerce.number().int().positive(),
  employeeName: z.string().trim().min(1),
  date: z.string(),
  checkInTime: z.string().nullable().optional(),
  checkOutTime: z.string().nullable().optional(),
  status: z.enum(["present", "late", "absent", "checked_out"]),
  checkInLat: z.coerce.number().min(-90).max(90).nullable().optional(),
  checkInLng: z.coerce.number().min(-180).max(180).nullable().optional(),
  checkOutLat: z.coerce.number().min(-90).max(90).nullable().optional(),
  checkOutLng: z.coerce.number().min(-180).max(180).nullable().optional(),
  geofenceId: z.coerce.number().int().positive().nullable().optional(),
  geofenceName: z.string().nullable().optional(),
  lateMinutes: z.coerce.number().min(0).default(0),
  workedHours: z.coerce.number().min(0).max(24).default(0),
  checkOutStatus: z.enum(["present", "late", "absent"]).nullable().optional(),
});

export const attendanceListSchema = z.array(attendanceRecordSchema);

export const checkInSchema = z.object({
  employeeId: z.coerce.number().int().positive(),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  geofenceId: z.coerce.number().int().positive(),
  timestamp: z.string().optional(),
});

export const checkOutSchema = z.object({
  employeeId: z.coerce.number().int().positive(),
});

export type AttendanceRecordSchema = z.infer<typeof attendanceRecordSchema>;
export type CheckInSchema = z.infer<typeof checkInSchema>;
export type CheckOutSchema = z.infer<typeof checkOutSchema>;
