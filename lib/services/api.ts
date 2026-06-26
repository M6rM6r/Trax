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
    update: (id: number, updates: Partial<Employee>): ApiResponse<Employee | undefined> => {
      const idx = mockEmployees.findIndex((e) => e.id === id);
      if (idx >= 0) mockEmployees[idx] = { ...mockEmployees[idx], ...updates };
      return simulateLatency(mockEmployees[idx]);
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
    checkIn: (payload: {
      employeeId: number;
      lat: number;
      lng: number;
      geofenceId: number;
    }): ApiResponse<AttendanceRecord> => {
      const newRecord: AttendanceRecord = {
        id: Date.now(),
        employeeId: payload.employeeId,
        employeeName: mockEmployees.find((e) => e.id === payload.employeeId)?.name ?? "Unknown",
        date: new Date().toISOString().split("T")[0],
        checkInTime: new Date().toTimeString().slice(0, 5),
        checkOutTime: null,
        status: "present",
        checkInLat: payload.lat,
        checkInLng: payload.lng,
        geofenceName: mockGeofences.find((g) => g.id === payload.geofenceId)?.name ?? null,
        lateMinutes: 0,
        workedHours: 0,
      };
      mockAttendance.unshift(newRecord);
      return simulateLatency(newRecord);
    },
    checkOut: (payload: { employeeId: number }): ApiResponse<AttendanceRecord | undefined> => {
      const idx = mockAttendance.findIndex(
        (r) =>
          r.employeeId === payload.employeeId && r.date === new Date().toISOString().split("T")[0]
      );
      if (idx >= 0) {
        mockAttendance[idx].checkOutTime = new Date().toTimeString().slice(0, 5);
        mockAttendance[idx].status = "checked_out";
        mockAttendance[idx].workedHours = 8;
      }
      return simulateLatency(idx >= 0 ? mockAttendance[idx] : undefined);
    },
  },

  geofences: {
    list: (): ApiResponse<Geofence[]> => simulateLatency(mockGeofences),
    create: (geofence: Omit<Geofence, "id">): ApiResponse<Geofence> => {
      const newGeofence: Geofence = { ...geofence, id: Date.now() };
      mockGeofences.push(newGeofence);
      return simulateLatency(newGeofence);
    },
    update: (id: number, updates: Partial<Geofence>): ApiResponse<Geofence | undefined> => {
      const idx = mockGeofences.findIndex((g) => g.id === id);
      if (idx >= 0) mockGeofences[idx] = { ...mockGeofences[idx], ...updates };
      return simulateLatency(mockGeofences[idx]);
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
