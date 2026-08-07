"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { buildRetentionFeatures, type RetentionFeatures } from "@/lib/utils/retentionFeatures";
import type { AttendanceRecord, Employee } from "@/lib/types/trackingTypes";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCompanySettingsStore } from "@/stores/useCompanySettingsStore";
import { firebaseData } from "@/lib/services/firebaseData";
import { queryKeys } from "./queryKeys";

export interface RetentionInsightResponse {
  retentionScore: number;
  riskLevel: "low" | "medium" | "high";
  summary: string;
  recommendedActions: string[];
  confidence: number;
}

function computeRetentionInsightLocal(features: RetentionFeatures): RetentionInsightResponse {
  const score = Math.round(
    features.attendanceRate * 0.4 +
      (100 - features.absenceRate) * 0.3 +
      features.checkOutCompletionRate * 0.3
  );
  const riskLevel: RetentionInsightResponse["riskLevel"] =
    score >= 75 ? "low" : score >= 50 ? "medium" : "high";
  const actions: string[] = [];
  if (features.absenceRate > 20) actions.push("Reduce absenteeism with flexible scheduling");
  if (features.avgLateMinutes > 15) actions.push("Address chronic lateness with shift adjustments");
  if (features.checkOutCompletionRate < 70) actions.push("Improve check-out compliance");
  if (actions.length === 0) actions.push("Maintain current retention strategies");

  return {
    retentionScore: score,
    riskLevel,
    summary: `Retention score ${score}/100 — ${riskLevel} risk`,
    recommendedActions: actions,
    confidence: 0.85,
  };
}

export function useRetentionInsights(
  attendance: AttendanceRecord[],
  employees: Employee[],
  window?: { from?: string; to?: string } | null
) {
  const companyId = useAuthStore((state) => state.companyId);
  const workStartTime = useCompanySettingsStore((s) => s.workStartTime);
  const gracePeriodMinutes = useCompanySettingsStore((s) => s.gracePeriodMinutes);
  const timezone = useCompanySettingsStore((s) => s.timezone);
  const weekendDays = useCompanySettingsStore((s) => s.weekendDays);
  const settings = useMemo(
    () => ({ workStartTime, gracePeriodMinutes, timezone, weekendDays }),
    [workStartTime, gracePeriodMinutes, timezone, weekendDays]
  );
  const from = window?.from ?? "";
  const to = window?.to ?? "";

  return useQuery<RetentionInsightResponse>({
    queryKey: [
      ...queryKeys.aiRetention,
      companyId ?? "unassigned",
      from,
      to,
      attendance.length,
      employees.length,
      workStartTime ?? "",
      String(gracePeriodMinutes ?? ""),
      timezone ?? "",
      JSON.stringify(weekendDays ?? []),
    ],
    queryFn: async () => {
      const features = buildRetentionFeatures(attendance, employees, settings, window);
      try {
        const result = await firebaseData.cloudFunctions.analyzeRetention(
          features as unknown as Record<string, unknown>
        );
        return result as unknown as RetentionInsightResponse;
      } catch {
        return computeRetentionInsightLocal(features);
      }
    },
    enabled: Boolean(companyId) && (attendance.length > 0 || employees.length > 0),
    staleTime: 5 * 60 * 1000,
    retry: 0,
  });
}
