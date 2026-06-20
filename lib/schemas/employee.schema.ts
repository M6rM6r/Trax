import { z } from "zod";

export const employeeSchema = z.object({
  id: z.number(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(1, "Phone is required"),
  role: z.enum(["manager", "employee", "supervisor"]),
  department: z.string().min(1, "Department is required"),
  avatar: z.string().nullable().optional(),
  geofenceId: z.number().nullable().optional(),
  status: z.enum(["active", "inactive"]),
  currentLat: z.number().nullable().optional(),
  currentLng: z.number().nullable().optional(),
  lastSeen: z.string().nullable().optional(),
});

export const createEmployeeSchema = employeeSchema.omit({ id: true });

export const employeeListSchema = z.array(employeeSchema);

export type EmployeeSchema = z.infer<typeof employeeSchema>;
export type CreateEmployeeSchema = z.infer<typeof createEmployeeSchema>;
