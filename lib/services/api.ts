import {
  Employee,
  AttendanceRecord,
  Geofence,
  DashboardStats,
  LiveTrackingEmployee,
} from "@/lib/types/trackingTypes";
import {
  mockEmployees,
  mockAttendance,
  mockGeofences,
  mockDashboardStats,
  mockLiveTracking,
} from "@/lib/mockData/trackingMockData";
import { logger } from "@/lib/config/logger";

type ApiResponse<T> = Promise<{ data: T; success: boolean }>;

function simulateLatency<T>(data: T, delay = 200): ApiResponse<T> {
  return new Promise((resolve) => {
    setTimeout(() => {
      logger.debug("API call resolved", { delay });
      resolve({ data, success: true });
    }, delay);
  });
}

export const api = {
  employees: {
    list: (): ApiResponse<Employee[]> => simulateLatency(mockEmployees),
    inactive: (): ApiResponse<Employee[]> =>
      simulateLatency(mockEmployees.filter((e) => e.status === "inactive")),
    byId: (id: number): ApiResponse<Employee | undefined> =>
      simulateLatency(mockEmployees.find((e) => e.id === id)),
    create: (employee: Omit<Employee, "id">): ApiResponse<Employee> => {
      const newEmployee: Employee = { ...employee, id: Date.now() };
      mockEmployees.push(newEmployee);
      return simulateLatency(newEmployee);
    },
    delete: (id: number): ApiResponse<{ id: number }> => {
      const idx = mockEmployees.findIndex((e) => e.id === id);
      if (idx >= 0) mockEmployees.splice(idx, 1);
      return simulateLatency({ id });
    },
  },

  attendance: {
    list: (): ApiResponse<AttendanceRecord[]> => simulateLatency(mockAttendance),
    reports: (): ApiResponse<AttendanceRecord[]> => simulateLatency(mockAttendance),
  },

  geofences: {
    list: (): ApiResponse<Geofence[]> => simulateLatency(mockGeofences),
    create: (geofence: Omit<Geofence, "id">): ApiResponse<Geofence> => {
      const newGeofence: Geofence = { ...geofence, id: Date.now() };
      mockGeofences.push(newGeofence);
      return simulateLatency(newGeofence);
    },
    delete: (id: number): ApiResponse<{ id: number }> => {
      const idx = mockGeofences.findIndex((g) => g.id === id);
      if (idx >= 0) mockGeofences.splice(idx, 1);
      return simulateLatency({ id });
    },
  },

  dashboard: {
    stats: (): ApiResponse<DashboardStats> => simulateLatency(mockDashboardStats),
  },

  tracking: {
    live: (): ApiResponse<LiveTrackingEmployee[]> => simulateLatency(mockLiveTracking),
  },
};
