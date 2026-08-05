"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { firebaseData } from "@/lib/services/firebaseData";
import type { AttendanceRecord, Employee } from "@/lib/types/trackingTypes";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCompanySettingsStore } from "@/stores/useCompanySettingsStore";
import { DEFAULT_COMPANY_TIMEZONE, formatCompanyDate } from "@/lib/utils/companyDate";
import { queryKeys, toApiDate, myAttendanceQueryKey } from "./queryKeys";

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

function useCompanyTodayYmd(): string {
  const timezone = useCompanySettingsStore((s) => s.timezone) || DEFAULT_COMPANY_TIMEZONE;
  const resolve = () => toApiDate(new Date(), timezone) ?? formatCompanyDate(new Date(), timezone);
  const [today, setToday] = useState(resolve);
  useEffect(() => {
    const refresh = () => {
      const next = resolve();
      setToday((prev) => (prev === next ? prev : next));
    };
    refresh();
    const id = setInterval(refresh, 60_000);
    const onVis = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resolve closes over timezone
  }, [timezone]);
  return today;
}

export function useMyAttendance(employeeId?: string | null) {
  const companyId = useAuthStore((state) => state.companyId);
  const timezone = useCompanySettingsStore((s) => s.timezone) || DEFAULT_COMPANY_TIMEZONE;
  const today = useCompanyTodayYmd();

  return useQuery<AttendanceRecord[]>({
    // Include company calendar day so optimistic check-in cache hits this query.
    queryKey: myAttendanceQueryKey(companyId, employeeId, today),
    queryFn: async () => {
      const day = toApiDate(new Date(), timezone) ?? formatCompanyDate(new Date(), timezone);
      return firebaseData.attendance.list(employeeId ?? undefined, { from: day, to: day });
    },
    enabled: Boolean(companyId && employeeId),
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
    refetchOnWindowFocus: true,
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
      employee?: Pick<Employee, "attendanceMode" | "shiftOverride" | "geofenceId"> | null;
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
      timezone: settingsState.timezone,
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
