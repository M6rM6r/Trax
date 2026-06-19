"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/services/api";
import type {
  Employee,
  AttendanceRecord,
  Geofence,
  DashboardStats,
  LiveTrackingEmployee,
} from "@/lib/types/trackingTypes";

export const queryKeys = {
  employees: ["employees"] as const,
  employeesInactive: ["employees", "inactive"] as const,
  attendance: ["attendance"] as const,
  attendanceReports: ["attendance", "reports"] as const,
  geofences: ["geofences"] as const,
  dashboard: ["dashboard", "stats"] as const,
  tracking: ["tracking", "live"] as const,
};

export function useEmployees() {
  return useQuery<Employee[]>({
    queryKey: queryKeys.employees,
    queryFn: async () => {
      const res = await api.employees.list();
      return res.data;
    },
  });
}

export function useInactiveEmployees() {
  return useQuery<Employee[]>({
    queryKey: queryKeys.employeesInactive,
    queryFn: async () => {
      const res = await api.employees.inactive();
      return res.data;
    },
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (employee: Omit<Employee, "id">) => {
      const res = await api.employees.create(employee);
      return res.data;
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
      const res = await api.employees.delete(id);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.employees });
    },
  });
}

export function useAttendance() {
  return useQuery<AttendanceRecord[]>({
    queryKey: queryKeys.attendance,
    queryFn: async () => {
      const res = await api.attendance.list();
      return res.data;
    },
  });
}

export function useAttendanceReports() {
  return useQuery<AttendanceRecord[]>({
    queryKey: queryKeys.attendanceReports,
    queryFn: async () => {
      const res = await api.attendance.reports();
      return res.data;
    },
  });
}

export function useGeofences() {
  return useQuery<Geofence[]>({
    queryKey: queryKeys.geofences,
    queryFn: async () => {
      const res = await api.geofences.list();
      return res.data;
    },
  });
}

export function useCreateGeofence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (geofence: Omit<Geofence, "id">) => {
      const res = await api.geofences.create(geofence);
      return res.data;
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
      const res = await api.geofences.delete(id);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.geofences });
    },
  });
}

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: queryKeys.dashboard,
    queryFn: async () => {
      const res = await api.dashboard.stats();
      return res.data;
    },
  });
}

export function useLiveTracking() {
  return useQuery<LiveTrackingEmployee[]>({
    queryKey: queryKeys.tracking,
    queryFn: async () => {
      const res = await api.tracking.live();
      return res.data;
    },
    refetchInterval: 30000,
  });
}
