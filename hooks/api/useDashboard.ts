"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { firebaseData } from "@/lib/services/firebaseData";
import type { DashboardStats } from "@/lib/types/trackingTypes";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCompanySettingsStore } from "@/stores/useCompanySettingsStore";
import type { DashboardTrendsSchema } from "@/lib/schemas/dashboard.schema";
import { queryKeys, toApiDate, type DashboardDateRange } from "./queryKeys";

export function useDashboardData(dateRange?: DashboardDateRange) {
  const companyId = useAuthStore((state) => state.companyId);
  const role = useAuthStore((state) => state.role);
  const workStartTime = useCompanySettingsStore((state) => state.workStartTime);
  const gracePeriodMinutes = useCompanySettingsStore((state) => state.gracePeriodMinutes);
  const timezone = useCompanySettingsStore((state) => state.timezone);
  const weekendDays = useCompanySettingsStore((state) => state.weekendDays);
  // Company wall-clock range — never browser-local midnight edge bugs.
  const from = toApiDate(dateRange?.from, timezone);
  const to = toApiDate(dateRange?.to, timezone);

  const companySettings = useMemo(
    () => ({ workStartTime, gracePeriodMinutes, timezone, weekendDays }),
    [workStartTime, gracePeriodMinutes, timezone, weekendDays]
  );

  return useQuery<{ stats: DashboardStats; trends: DashboardTrendsSchema }>({
    queryKey: [
      ...queryKeys.dashboard,
      companyId ?? "unassigned",
      from ?? "all",
      to ?? "all",
      workStartTime ?? "",
      String(gracePeriodMinutes ?? ""),
      timezone ?? "",
      // Weekend policy affects present/absent buckets — must bust cache on change.
      JSON.stringify(weekendDays ?? []),
    ],
    // Lockstep with useAttendance (30s) — KPIs must not lag roster by a second cadence.
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    // Company admin pipeline only — employees/mastermind must not stampede Firestore.
    enabled: Boolean(companyId) && role === "company",
    queryFn: async () => {
      if (useAuthStore.getState().role !== "company") {
        throw new Error("UNAUTHORIZED_DASHBOARD");
      }
      return firebaseData.dashboard.getDashboardData({ from, to }, companySettings);
    },
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
