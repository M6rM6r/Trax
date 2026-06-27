import { httpClient, ApiError } from "./httpClient";
import { logger } from "@/lib/config/logger";
import {
  employeeSchema,
  employeeListSchema,
  createEmployeeSchema,
  type EmployeeSchema,
  type CreateEmployeeSchema,
} from "@/lib/schemas/employee.schema";
import {
  attendanceRecordSchema,
  attendanceListSchema,
  type AttendanceRecordSchema,
  type CheckInSchema,
  type CheckOutSchema,
} from "@/lib/schemas/attendance.schema";
import {
  geofenceListSchema,
  geofenceSchema,
  createGeofenceSchema,
  type CreateGeofenceSchema,
  type GeofenceSchema,
} from "@/lib/schemas/geofence.schema";
import {
  dashboardStatsSchema,
  dashboardTrendsSchema,
  liveTrackingListSchema,
  type DashboardStatsSchema,
  type DashboardTrendsSchema,
  type LiveTrackingEmployeeSchema,
} from "@/lib/schemas/dashboard.schema";

function validate<T>(raw: unknown, schema: { parse: (d: unknown) => T }, endpoint: string): T {
  try {
    const payload =
      raw !== null && typeof raw === "object" && "data" in (raw as object)
        ? (raw as Record<string, unknown>).data
        : raw;
    return schema.parse(payload);
  } catch (error) {
    logger.error(`Schema validation failed for ${endpoint}`, {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new ApiError("Response validation failed", 422, endpoint);
  }
}

export const validatedApi = {
  employees: {
    list: async (): Promise<EmployeeSchema[]> => {
      const data = await httpClient.get<unknown>("/employees");
      return validate(data, employeeListSchema, "/employees");
    },
    inactive: async (): Promise<EmployeeSchema[]> => {
      const data = await httpClient.get<unknown>("/employees/inactive/list");
      return validate(data, employeeListSchema, "/employees/inactive/list");
    },
    byId: async (id: number): Promise<EmployeeSchema> => {
      const data = await httpClient.get<unknown>(`/employees/${id}`);
      return validate(data, employeeSchema, `/employees/${id}`);
    },
    create: async (employee: CreateEmployeeSchema): Promise<EmployeeSchema> => {
      const validated = { ...createEmployeeSchema.parse(employee), password: employee.password };
      const data = await httpClient.post<unknown>("/employees", validated);
      return validate(data, employeeSchema, "/employees");
    },
    update: async (
      id: number,
      employee: Partial<CreateEmployeeSchema>
    ): Promise<EmployeeSchema> => {
      const data = await httpClient.put<unknown>(`/employees/${id}`, employee);
      return validate(data, employeeSchema, `/employees/${id}`);
    },
    delete: async (id: number): Promise<{ id: number }> => {
      const raw = await httpClient.delete<Record<string, unknown>>(`/employees/${id}`);
      return (raw?.data ?? raw) as { id: number };
    },
  },

  attendance: {
    list: async (): Promise<AttendanceRecordSchema[]> => {
      const data = await httpClient.get<unknown>("/attendance");
      return validate(data, attendanceListSchema, "/attendance");
    },
    reports: async (): Promise<AttendanceRecordSchema[]> => {
      const data = await httpClient.get<unknown>("/attendance/reports");
      return validate(data, attendanceListSchema, "/attendance/reports");
    },
    checkIn: async (payload: CheckInSchema): Promise<AttendanceRecordSchema> => {
      const data = await httpClient.post<unknown>("/attendance/check-in", payload);
      return validate(data, attendanceRecordSchema, "/attendance/check-in");
    },
    checkOut: async (payload: CheckOutSchema): Promise<AttendanceRecordSchema> => {
      const data = await httpClient.post<unknown>("/attendance/check-out", payload);
      return validate(data, attendanceRecordSchema, "/attendance/check-out");
    },
  },

  geofences: {
    list: async (): Promise<GeofenceSchema[]> => {
      const data = await httpClient.get<unknown>("/geofences");
      return validate(data, geofenceListSchema, "/geofences");
    },
    create: async (geofence: CreateGeofenceSchema): Promise<GeofenceSchema> => {
      const validated = createGeofenceSchema.parse(geofence);
      const data = await httpClient.post<unknown>("/geofences", validated);
      return validate(data, geofenceSchema, "/geofences");
    },
    update: async (
      id: number,
      geofence: Partial<CreateGeofenceSchema>
    ): Promise<GeofenceSchema> => {
      const data = await httpClient.put<unknown>(`/geofences/${id}`, geofence);
      return validate(data, geofenceSchema, `/geofences/${id}`);
    },
    delete: async (id: number): Promise<{ id: number }> => {
      const raw = await httpClient.delete<Record<string, unknown>>(`/geofences/${id}`);
      return (raw?.data ?? raw) as { id: number };
    },
  },

  dashboard: {
    stats: async (): Promise<DashboardStatsSchema> => {
      const data = await httpClient.get<unknown>("/dashboard/stats");
      return validate(data, dashboardStatsSchema, "/dashboard/stats");
    },
    trends: async (): Promise<DashboardTrendsSchema> => {
      const data = await httpClient.get<unknown>("/dashboard/trends");
      return validate(data, dashboardTrendsSchema, "/dashboard/trends");
    },
  },

  tracking: {
    live: async (): Promise<LiveTrackingEmployeeSchema[]> => {
      const data = await httpClient.get<unknown>("/tracking/live");
      return validate(data, liveTrackingListSchema, "/tracking/live");
    },
  },
};
