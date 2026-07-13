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
  mockLiveTracking,
} from "@/lib/mockData/trackingMockData";
import { logger } from "@/lib/config/logger";

type ApiResponse<T> = Promise<{ data: T; success: boolean }>;

interface DashboardQueryParams {
  from?: string;
  to?: string;
}

function simulateLatency<T>(data: T, delay = 200): ApiResponse<T> {
  return new Promise((resolve) => {
    setTimeout(() => {
      logger.debug("API call resolved", { delay });
      resolve({ data, success: true });
    }, delay);
  });
}

function filterAttendanceByDateRange(records: AttendanceRecord[], params?: DashboardQueryParams) {
  if (!params?.from && !params?.to) {
    return records;
  }

  const fromMs = params.from ? new Date(`${params.from}T00:00:00`).getTime() : -Infinity;
  const toMs = params.to ? new Date(`${params.to}T00:00:00`).getTime() : Infinity;

  return records.filter((record) => {
    const ms = new Date(`${record.date}T00:00:00`).getTime();
    return Number.isFinite(ms) && ms >= fromMs && ms <= toMs;
  });
}

function averageCheckInTime(records: AttendanceRecord[]): string {
  const values = records
    .map((r) => r.checkInTime)
    .filter((v): v is string => typeof v === "string" && /^\d{2}:\d{2}$/.test(v))
    .map((v) => {
      const [h, m] = v.split(":").map(Number);
      return h * 60 + m;
    });

  if (values.length === 0) return "N/A";

  const avg = Math.round(values.reduce((acc, n) => acc + n, 0) / values.length);
  const h = String(Math.floor(avg / 60)).padStart(2, "0");
  const m = String(avg % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function buildDashboardStats(params?: DashboardQueryParams): DashboardStats {
  const scoped = filterAttendanceByDateRange(mockAttendance, params);
  const presentToday = scoped.filter((r) => r.status === "present").length;
  const lateToday = scoped.filter((r) => r.status === "late").length;
  const absentToday = scoped.filter((r) => r.status === "absent").length;
  const checkedOutToday = scoped.filter((r) => r.status === "checked_out").length;

  const punctualBase = presentToday + lateToday;
  const onTimeRate =
    punctualBase > 0 ? Number(((presentToday / punctualBase) * 100).toFixed(1)) : 0;

  const worked = scoped.map((r) => r.workedHours).filter((h) => Number.isFinite(h) && h > 0);
  const avgWorkedHours =
    worked.length > 0
      ? Number((worked.reduce((sum, h) => sum + h, 0) / worked.length).toFixed(1))
      : 0;

  return {
    totalEmployees: mockEmployees.length,
    activeEmployees: mockEmployees.filter((e) => e.status === "active").length,
    inactiveEmployees: mockEmployees.filter((e) => e.status === "inactive").length,
    presentToday,
    absentToday,
    lateToday,
    checkedOutToday,
    onTimeRate,
    avgCheckInTime: averageCheckInTime(scoped),
    avgWorkedHours,
    totalGeofences: mockGeofences.length,
  };
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
    stats: (params?: DashboardQueryParams): ApiResponse<DashboardStats> =>
      simulateLatency(buildDashboardStats(params)),
  },

  tracking: {
    live: (): ApiResponse<LiveTrackingEmployee[]> => simulateLatency(mockLiveTracking),
  },
};
