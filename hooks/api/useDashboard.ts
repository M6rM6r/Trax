"use client";

import { useQuery } from "@tanstack/react-query";
import { firebaseData } from "@/lib/services/firebaseData";
import type { DashboardStats } from "@/lib/types/trackingTypes";
import { useAuthStore } from "@/stores/useAuthStore";
import type { DashboardTrendsSchema } from "@/lib/schemas/dashboard.schema";
import { queryKeys, toApiDate, type DashboardDateRange } from "./queryKeys";

export function useDashboardData(dateRange?: DashboardDateRange) {
  const companyId = useAuthStore((state) => state.companyId);
  const from = toApiDate(dateRange?.from);
  const to = toApiDate(dateRange?.to);

  return useQuery<{ stats: DashboardStats; trends: DashboardTrendsSchema }>({
    queryKey: [...queryKeys.dashboard, companyId ?? "unassigned", from ?? "all", to ?? "all"],
    staleTime: 60 * 1000,
    enabled: Boolean(companyId),
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
