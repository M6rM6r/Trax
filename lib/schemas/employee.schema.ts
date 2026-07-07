import { z } from "zod";

export const employeeSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email").toLowerCase(),
  phone: z.string().trim().min(1, "Phone is required"),
  role: z.enum(["manager", "employee", "supervisor"]),
  department: z.string().trim().min(1, "Department is required"),
  avatar: z.string().nullable().optional(),
  geofenceId: z.coerce.number().int().positive().nullable().optional(),
  status: z.enum(["active", "inactive"]),
  currentLat: z.coerce.number().min(-90).max(90).nullable().optional(),
  currentLng: z.coerce.number().min(-180).max(180).nullable().optional(),
  lastSeen: z.string().nullable().optional(),
  batteryLevel: z.coerce.number().min(0).max(100).nullable().optional(),
  employeeNumber: z.string().trim().min(1).nullable().optional(),
  password: z.string().trim().min(8).optional(),
});

export const createEmployeeSchema = employeeSchema.omit({ id: true });

export const employeeListSchema = z.array(employeeSchema);

export type EmployeeSchema = z.infer<typeof employeeSchema>;
export type CreateEmployeeSchema = z.infer<typeof createEmployeeSchema>;
