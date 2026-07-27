"use client";

import { useQuery } from "@tanstack/react-query";
import { httpClient } from "@/lib/services/httpClient";
import { buildRetentionFeatures, type RetentionFeatures } from "@/lib/utils/retentionFeatures";
import type { AttendanceRecord, Employee } from "@/lib/types/trackingTypes";
import { useAuthStore } from "@/stores/useAuthStore";
import { queryKeys } from "./queryKeys";

export interface RetentionInsightResponse {
  retentionScore: number;
  riskLevel: "low" | "medium" | "high";
  summary: string;
  recommendedActions: string[];
  confidence: number;
}

export function useRetentionInsights(attendance: AttendanceRecord[], employees: Employee[]) {
  const companyId = useAuthStore((state) => state.companyId);

  return useQuery<RetentionInsightResponse>({
    queryKey: [...queryKeys.aiRetention, companyId ?? "unassigned", attendance.length, employees.length],
    queryFn: async () => {
      const features: RetentionFeatures = buildRetentionFeatures(attendance, employees);
      const data = await httpClient.post<unknown>("/ai/retention/analyze", features);

      const payload =
        data !== null && typeof data === "object" && "data" in (data as object)
          ? (data as Record<string, unknown>).data
          : data;

      return payload as RetentionInsightResponse;
    },
    enabled: Boolean(companyId) && attendance.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: 0,
  });
}
