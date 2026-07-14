"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/services/api";
import { validatedApi } from "@/lib/services/validatedApi";
import { httpClient } from "@/lib/services/httpClient";
import { firebaseData } from "@/lib/services/firebaseData";
import { env } from "@/lib/config/env";
import { buildRetentionFeatures, type RetentionFeatures } from "@/lib/utils/retentionFeatures";
import type {
  Employee,
  AttendanceRecord,
  Geofence,
  DashboardStats,
  LiveTrackingEmployee,
} from "@/lib/types/trackingTypes";
import type { DashboardTrendsSchema } from "@/lib/schemas/dashboard.schema";

const useMock = env.NEXT_PUBLIC_USE_MOCK;
const useFirebase = env.NEXT_PUBLIC_USE_FIREBASE;

export interface DashboardDateRange {
  from?: Date;
  to?: Date;
}

function toApiDate(value?: Date): string | undefined {
  if (!value) return undefined;
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const mockTrends: DashboardTrendsSchema = {
  weeklyData: [
    { day: "السبت", present: 6, late: 1, absent: 1, avgWorkedHours: 7.5 },
    { day: "الأحد", present: 7, late: 1, absent: 0, avgWorkedHours: 8.0 },
    { day: "الإثنين", present: 5, late: 2, absent: 1, avgWorkedHours: 7.2 },
    { day: "الثلاثاء", present: 6, late: 1, absent: 1, avgWorkedHours: 7.8 },
    { day: "الأربعاء", present: 7, late: 1, absent: 0, avgWorkedHours: 8.1 },
    { day: "الخميس", present: 5, late: 2, absent: 1, avgWorkedHours: 7.0 },
    { day: "الجمعة", present: 3, late: 0, absent: 5, avgWorkedHours: 4.5 },
  ],
  peakHoursData: [
    { hour: "6ص", count: 1 },
    { hour: "7ص", count: 3 },
    { hour: "8ص", count: 8 },
    { hour: "9ص", count: 4 },
    { hour: "10ص", count: 2 },
    { hour: "11ص", count: 1 },
    { hour: "12م", count: 1 },
    { hour: "1م", count: 1 },
    { hour: "2م", count: 1 },
    { hour: "3م", count: 2 },
    { hour: "4م", count: 3 },
    { hour: "5م", count: 6 },
    { hour: "6م", count: 4 },
    { hour: "7م", count: 1 },
  ],
  employeeGrowth: 5,
  presentChange: 8,
  lateChange: -3,
  absentChange: -12,
  onTimeRateChange: 4,
};

export const queryKeys = {
  employees: ["employees"] as const,
  employeesInactive: ["employees", "inactive"] as const,
  attendance: ["attendance"] as const,
  attendanceReports: ["attendance", "reports"] as const,
  geofences: ["geofences"] as const,
  dashboard: ["dashboard", "stats"] as const,
  dashboardTrends: ["dashboard", "trends"] as const,
  tracking: ["tracking", "live"] as const,
  aiRetention: ["ai", "retention"] as const,
};

export interface RetentionInsightResponse {
  retentionScore: number;
  riskLevel: "low" | "medium" | "high";
  summary: string;
  recommendedActions: string[];
  confidence: number;
}

export function useEmployees(options?: { enabled?: boolean }) {
  return useQuery<Employee[]>({
    queryKey: queryKeys.employees,
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000,
    queryFn: async (): Promise<Employee[]> => {
      if (useFirebase) return firebaseData.employees.list();
      if (useMock) {
        const res = await api.employees.list();
        return res.data;
      }
      return validatedApi.employees.list();
    },
  });
}

export function useInactiveEmployees() {
  return useQuery<Employee[]>({
    queryKey: queryKeys.employeesInactive,
    queryFn: async (): Promise<Employee[]> => {
      if (useFirebase) {
        const employees = await firebaseData.employees.list();
        return employees.filter((employee) => employee.status === "inactive");
      }
      if (useMock) {
        const res = await api.employees.inactive();
        return res.data;
      }
      return validatedApi.employees.inactive();
    },
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (employee: Omit<Employee, "id">) => {
      if (useFirebase) return firebaseData.employees.create(employee);
      if (useMock) {
        const res = await api.employees.create(employee);
        return res.data;
      }
      return validatedApi.employees.create(employee);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.employees });
    },
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Employee> }) => {
      if (useFirebase) {
        await firebaseData.employees.update(id, data);
        return firebaseData.employees.getById(id) as Promise<Employee>;
      }
      if (useMock) {
        const res = await api.employees.update(id, data);
        return res.data;
      }
      return validatedApi.employees.update(id, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.employees });
    },
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      if (useFirebase) {
        await firebaseData.employees.delete(id);
        return { id };
      }
      if (useMock) {
        const res = await api.employees.delete(id);
        return res.data;
      }
      return validatedApi.employees.delete(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.employees });
    },
  });
}

export function useResetEmployeePassword() {
  return useMutation({
    mutationFn: async ({ id, password }: { id: number; password: string }) => {
      return httpClient.post(`/employees/${id}/reset-password`, { password });
    },
  });
}

export function useAttendance() {
  return useQuery<AttendanceRecord[]>({
    queryKey: queryKeys.attendance,
    staleTime: 30 * 1000,
    queryFn: async (): Promise<AttendanceRecord[]> => {
      if (useFirebase) return firebaseData.attendance.list();
      if (useMock) {
        const res = await api.attendance.list();
        return res.data;
      }
      return validatedApi.attendance.list();
    },
  });
}

export function useAttendanceReports() {
  return useQuery<AttendanceRecord[]>({
    queryKey: queryKeys.attendanceReports,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<AttendanceRecord[]> => {
      if (useFirebase) return firebaseData.attendance.list();
      if (useMock) {
        const res = await api.attendance.reports();
        return res.data;
      }
      return validatedApi.attendance.reports();
    },
  });
}

export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      employeeId: number;
      lat: number;
      lng: number;
      geofenceId: number;
    }) => {
      if (useFirebase) return firebaseData.attendance.checkIn(payload);
      if (useMock) {
        const res = await api.attendance.checkIn(payload);
        return res.data;
      }
      return validatedApi.attendance.checkIn(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.attendance });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
      qc.invalidateQueries({ queryKey: queryKeys.dashboardTrends });
    },
  });
}

export function useCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { employeeId: number }) => {
      if (useFirebase) return firebaseData.attendance.checkOut(payload.employeeId);
      if (useMock) {
        const res = await api.attendance.checkOut(payload);
        return res.data;
      }
      return validatedApi.attendance.checkOut(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.attendance });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
      qc.invalidateQueries({ queryKey: queryKeys.dashboardTrends });
    },
  });
}

export function useGeofences() {
  return useQuery<Geofence[]>({
    queryKey: queryKeys.geofences,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Geofence[]> => {
      if (useFirebase) return firebaseData.geofences.list();
      if (useMock) {
        const res = await api.geofences.list();
        return res.data;
      }
      return validatedApi.geofences.list();
    },
  });
}

export function useCreateGeofence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (geofence: Omit<Geofence, "id">) => {
      if (useFirebase) return firebaseData.geofences.create(geofence);
      if (useMock) {
        const res = await api.geofences.create(geofence);
        return res.data;
      }
      return validatedApi.geofences.create(geofence);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.geofences });
    },
  });
}

export function useUpdateGeofence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Geofence> }) => {
      if (useFirebase) {
        await firebaseData.geofences.update(id, data);
        return { id, ...data } as Geofence;
      }
      if (useMock) {
        const res = await api.geofences.update(id, data);
        return res.data;
      }
      return validatedApi.geofences.update(id, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.geofences });
    },
  });
}

export function useDeleteGeofence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      if (useFirebase) {
        await firebaseData.geofences.delete(id);
        return { id };
      }
      if (useMock) {
        const res = await api.geofences.delete(id);
        return res.data;
      }
      return validatedApi.geofences.delete(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.geofences });
    },
  });
}

export function useDashboardStats(dateRange?: DashboardDateRange) {
  const from = toApiDate(dateRange?.from);
  const to = toApiDate(dateRange?.to);

  return useQuery<DashboardStats>({
    queryKey: [...queryKeys.dashboard, from ?? "all", to ?? "all"],
    staleTime: 60 * 1000,
    queryFn: async (): Promise<DashboardStats> => {
      if (useFirebase) return firebaseData.dashboard.stats();
      if (useMock) {
        const res = await api.dashboard.stats({ from, to });
        return res.data;
      }
      return validatedApi.dashboard.stats({ from, to });
    },
  });
}

export function useDashboardTrends(dateRange?: DashboardDateRange) {
  const from = toApiDate(dateRange?.from);
  const to = toApiDate(dateRange?.to);

  return useQuery<DashboardTrendsSchema>({
    queryKey: [...queryKeys.dashboardTrends, from ?? "all", to ?? "all"],
    queryFn: async (): Promise<DashboardTrendsSchema> => {
      if (useFirebase) return mockTrends;
      if (useMock) {
        await new Promise((r) => setTimeout(r, 100));
        return mockTrends;
      }
      return validatedApi.dashboard.trends({ from, to });
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useLiveTracking() {
  return useQuery<LiveTrackingEmployee[]>({
    queryKey: queryKeys.tracking,
    staleTime: 10 * 1000,
    queryFn: async (): Promise<LiveTrackingEmployee[]> => {
      if (useFirebase) return firebaseData.tracking.live();
      if (useMock) {
        const res = await api.tracking.live();
        return res.data;
      }
      return validatedApi.tracking.live();
    },
    refetchInterval: 30000,
  });
}

export function useRetentionInsights(attendance: AttendanceRecord[], employees: Employee[]) {
  return useQuery<RetentionInsightResponse>({
    queryKey: [...queryKeys.aiRetention, attendance.length, employees.length],
    queryFn: async () => {
      const features: RetentionFeatures = buildRetentionFeatures(attendance, employees);
      const data = await httpClient.post<unknown>("/ai/retention/analyze", features);

      const payload =
        data !== null && typeof data === "object" && "data" in (data as object)
          ? (data as Record<string, unknown>).data
          : data;

      return payload as RetentionInsightResponse;
    },
    enabled: attendance.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: 0,
  });
}
