"use client";

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { firebaseData } from "@/lib/services/firebaseData";
import type { AttendanceRecord, Employee } from "@/lib/types/trackingTypes";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCompanySettingsStore } from "@/stores/useCompanySettingsStore";
import { queryKeys, toApiDate } from "./queryKeys";

export function useAttendance(options?: {
  enabled?: boolean;
  dateRange?: { from?: string; to?: string };
}) {
  const companyId = useAuthStore((state) => state.companyId);
  const from = options?.dateRange?.from;
  const to = options?.dateRange?.to;

  return useQuery<AttendanceRecord[]>({
    queryKey: [...queryKeys.attendance, companyId ?? "unassigned", from ?? "all", to ?? "all"],
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
    enabled: Boolean(companyId) && (options?.enabled ?? true),
    queryFn: async (): Promise<AttendanceRecord[]> => {
      return firebaseData.attendance.list(undefined, options?.dateRange);
    },
  });
}

export function useAttendanceReports() {
  return useAttendance();
}

export function useMyAttendance(employeeId?: string | null) {
  const companyId = useAuthStore((state) => state.companyId);
  const today = useMemo(() => toApiDate(new Date()) ?? new Date().toISOString().split("T")[0], []);

  return useQuery<AttendanceRecord[]>({
    queryKey: [
      ...queryKeys.attendance,
      "my",
      companyId ?? "unassigned",
      employeeId ?? "none",
      today,
    ],
    queryFn: async () =>
      firebaseData.attendance.list(employeeId ?? undefined, { from: today, to: today }),
    enabled: Boolean(companyId && employeeId),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
  });
}

export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      employeeId: string;
      employeeName?: string;
      lat: number;
      lng: number;
      accuracy?: number;
      geofenceId?: string | null;
      companySettings?: Record<string, unknown>;
      employee?: Pick<Employee, "attendanceMode" | "shiftOverride"> | null;
      checkInTimestamp?: number;
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
  const settingsState = useCompanySettingsStore();
  const companySettings = useMemo(
    () => ({
      notificationsEnabled: settingsState.notificationsEnabled,
      checkoutAlertsEnabled: settingsState.checkoutAlertsEnabled,
      checkoutTimeRangeEnabled: settingsState.checkoutTimeRangeEnabled,
      checkoutStartTime: settingsState.checkoutStartTime,
    }),
    [settingsState]
  );
  return useMutation({
    mutationFn: async (payload: { employeeId: string }) => {
      return firebaseData.attendance.checkOut(payload.employeeId, companySettings);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.attendance });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}
