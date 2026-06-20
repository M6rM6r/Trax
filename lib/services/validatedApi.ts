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
  attendanceListSchema,
  type AttendanceRecordSchema,
  type CheckInSchema,
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
  liveTrackingListSchema,
  type DashboardStatsSchema,
  type LiveTrackingEmployeeSchema,
} from "@/lib/schemas/dashboard.schema";

function validate<T>(data: unknown, schema: { parse: (d: unknown) => T }, endpoint: string): T {
  try {
    return schema.parse(data);
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
      const validated = createEmployeeSchema.parse(employee);
      const data = await httpClient.post<unknown>("/employees", validated);
      return validate(data, employeeSchema, "/employees");
    },
    delete: async (id: number): Promise<{ id: number }> => {
      return httpClient.delete<{ id: number }>(`/employees/${id}`);
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
      const list = validate(data, attendanceListSchema, "/attendance/check-in");
      return list[0];
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
    delete: async (id: number): Promise<{ id: number }> => {
      return httpClient.delete<{ id: number }>(`/geofences/${id}`);
    },
  },

  dashboard: {
    stats: async (): Promise<DashboardStatsSchema> => {
      const data = await httpClient.get<unknown>("/dashboard/stats");
      return validate(data, dashboardStatsSchema, "/dashboard/stats");
    },
  },

  tracking: {
    live: async (): Promise<LiveTrackingEmployeeSchema[]> => {
      const data = await httpClient.get<unknown>("/tracking/live");
      return validate(data, liveTrackingListSchema, "/tracking/live");
    },
  },

  ai: {
    predictAttendance: async (payload: {
      employee_id: number;
      day_of_week: number;
      historical_late_rate: number;
      historical_absent_rate: number;
      distance_to_geofence: number;
      weather_score?: number;
    }) => {
      return httpClient.post("/ai/attendance/predict", payload);
    },
    detectAnomaly: async (payload: {
      employee_id: number;
      check_in_hour: number;
      check_out_hour: number;
      worked_hours: number;
      late_frequency: number;
    }) => {
      return httpClient.post("/ai/anomaly/detect", payload);
    },
    analyzePatterns: async (payload: {
      employee_id: number;
      attendance_history: Record<string, unknown>[];
    }) => {
      return httpClient.post("/ai/patterns/analyze", payload);
    },
  },
};
