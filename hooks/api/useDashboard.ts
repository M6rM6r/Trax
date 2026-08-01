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
  const workStartTime = useCompanySettingsStore((state) => state.workStartTime);
  const gracePeriodMinutes = useCompanySettingsStore((state) => state.gracePeriodMinutes);
  const from = toApiDate(dateRange?.from);
  const to = toApiDate(dateRange?.to);

  const companySettings = useMemo(
    () => ({ workStartTime, gracePeriodMinutes }),
    [workStartTime, gracePeriodMinutes]
  );

  return useQuery<{ stats: DashboardStats; trends: DashboardTrendsSchema }>({
    queryKey: [
      ...queryKeys.dashboard,
      companyId ?? "unassigned",
      from ?? "all",
      to ?? "all",
      workStartTime ?? "",
      String(gracePeriodMinutes ?? ""),
    ],
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
    enabled: Boolean(companyId),
    queryFn: async () => firebaseData.dashboard.getDashboardData({ from, to }, companySettings),
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
