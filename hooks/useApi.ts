"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { httpClient } from "@/lib/services/httpClient";
import { firebaseData } from "@/lib/services/firebaseData";
import { buildRetentionFeatures, type RetentionFeatures } from "@/lib/utils/retentionFeatures";
import type {
  Employee,
  AttendanceRecord,
  Geofence,
  DashboardStats,
  LiveTrackingEmployee,
  AttendanceMode,
} from "@/lib/types/trackingTypes";
import type { DashboardTrendsSchema } from "@/lib/schemas/dashboard.schema";

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

export const queryKeys = {
  employees: ["employees"] as const,
  employeesInactive: ["employees", "inactive"] as const,
  attendance: ["attendance"] as const,
  attendanceReports: ["attendance", "reports"] as const,
  geofences: ["geofences"] as const,
  /** Unified dashboard data key. Stats and trends are fetched together to avoid duplicate Firestore reads. */
  dashboard: ["dashboard", "data"] as const,
  /** @deprecated Use queryKeys.dashboard for invalidations; stats and trends share a single query. */
  dashboardTrends: ["dashboard", "data"] as const,
  tracking: ["tracking", "live"] as const,
  aiRetention: ["ai", "retention"] as const,
  companySettings: ["company-settings"] as const,
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
      return firebaseData.employees.list();
    },
  });
}

export function useInactiveEmployees() {
  return useQuery<Employee[]>({
    queryKey: queryKeys.employeesInactive,
    queryFn: async (): Promise<Employee[]> => {
      const employees = await firebaseData.employees.list();
      return employees.filter((employee) => employee.status === "inactive");
    },
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (employee: Omit<Employee, "id"> & { password?: string }) => {
      return firebaseData.employees.create(employee);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.employees });
    },
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string | number; data: Partial<Employee> }) => {
      await firebaseData.employees.update(id, data);
      return firebaseData.employees.getById(id) as Promise<Employee>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.employees });
    },
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | number) => {
      await firebaseData.employees.delete(id);
      return { id };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.employees });
    },
  });
}

export function useResetEmployeePassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      password,
      email,
    }: {
      id?: string | number;
      password?: string;
      email?: string;
    }) => {
      if (password && password.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }
      if (email) {
        await firebaseData.employees.resetPassword(email);
        return { id };
      }
      throw new Error("Employee email is required to reset password");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.employees });
    },
  });
}

export function useAttendance(options?: { enabled?: boolean }) {
  return useQuery<AttendanceRecord[]>({
    queryKey: queryKeys.attendance,
    staleTime: 30 * 1000,
    enabled: options?.enabled ?? true,
    queryFn: async (): Promise<AttendanceRecord[]> => {
      return firebaseData.attendance.list();
    },
  });
}

export function useAttendanceReports() {
  return useAttendance();
}

export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      employeeId: string | number;
      employeeName?: string;
      lat: number;
      lng: number;
      geofenceId?: string | number | null;
      companySettings?: Record<string, unknown>;
      employee?: Pick<Employee, "attendanceMode" | "shiftOverride"> | null;
    }) => {
      return firebaseData.attendance.checkIn(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.attendance });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useEmployeesByMode(mode: AttendanceMode) {
  return useQuery<Employee[]>({
    queryKey: [...queryKeys.employees, "mode", mode],
    staleTime: 30 * 1000,
    queryFn: async (): Promise<Employee[]> => {
      const employees = await firebaseData.employees.list();
      return employees.filter(
        (e) => e.attendanceMode === mode || (!e.attendanceMode && mode === "field")
      );
    },
  });
}

export function useCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { employeeId: string | number }) => {
      return firebaseData.attendance.checkOut(payload.employeeId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.attendance });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useGeofences() {
  return useQuery<Geofence[]>({
    queryKey: queryKeys.geofences,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Geofence[]> => {
      return firebaseData.geofences.list();
    },
  });
}

export function useCreateGeofence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (geofence: Omit<Geofence, "id">) => {
      return firebaseData.geofences.create(geofence);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.geofences });
    },
  });
}

export function useUpdateGeofence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string | number; data: Partial<Geofence> }) => {
      await firebaseData.geofences.update(id, data);
      return { id, ...data } as Geofence;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.geofences });
    },
  });
}

export function useDeleteGeofence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | number) => {
      await firebaseData.geofences.delete(id);
      return { id };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.geofences });
    },
  });
}

export function useDashboardData(dateRange?: DashboardDateRange) {
  const from = toApiDate(dateRange?.from);
  const to = toApiDate(dateRange?.to);

  return useQuery<{ stats: DashboardStats; trends: DashboardTrendsSchema }>({
    queryKey: [...queryKeys.dashboard, from ?? "all", to ?? "all"],
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
    queryFn: async () => firebaseData.dashboard.getDashboardData(),
  });
}

export function useDashboardStats(dateRange?: DashboardDateRange) {
  const { data, isLoading, isError, refetch } = useDashboardData(dateRange);
  return {
    data: data?.stats,
    isLoading,
    isError,
    refetch,
  };
}

export function useDashboardTrends(dateRange?: DashboardDateRange) {
  const { data, isLoading, isError } = useDashboardData(dateRange);
  return {
    data: data?.trends,
    isLoading,
    isError,
  };
}

export function useLiveTracking() {
  return useQuery<LiveTrackingEmployee[]>({
    queryKey: queryKeys.tracking,
    staleTime: 10 * 1000,
    queryFn: async (): Promise<LiveTrackingEmployee[]> => {
      return firebaseData.tracking.live();
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

export function useCompanySettings(options?: { enabled?: boolean }) {
  return useQuery<Record<string, unknown> | null>({
    queryKey: queryKeys.companySettings,
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      return firebaseData.companies.getSettings();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveCompanySettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settings: Record<string, unknown> | object) => {
      await firebaseData.companies.saveSettings(settings as Record<string, unknown>);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.companySettings });
    },
  });
}
