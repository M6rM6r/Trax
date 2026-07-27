"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { firebaseData } from "@/lib/services/firebaseData";
import type { AttendanceRecord, Employee } from "@/lib/types/trackingTypes";
import { useAuthStore } from "@/stores/useAuthStore";
import { queryKeys } from "./queryKeys";

export function useAttendance(options?: { enabled?: boolean }) {
  const companyId = useAuthStore((state) => state.companyId);

  return useQuery<AttendanceRecord[]>({
    queryKey: [...queryKeys.attendance, companyId ?? "unassigned"],
    staleTime: 30 * 1000,
    enabled: Boolean(companyId) && (options?.enabled ?? true),
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
      employeeId: string;
      employeeName?: string;
      lat: number;
      lng: number;
      geofenceId?: string | null;
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

export function useCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { employeeId: string }) => {
      return firebaseData.attendance.checkOut(payload.employeeId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.attendance });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}
