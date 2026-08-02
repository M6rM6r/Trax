"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { firebaseData } from "@/lib/services/firebaseData";
import { useAuthStore } from "@/stores/useAuthStore";
import { queryKeys } from "./queryKeys";

export function useCompanySettings(options?: { enabled?: boolean }) {
  const companyId = useAuthStore((state) => state.companyId);

  return useQuery<Record<string, unknown> | null>({
    queryKey: [...queryKeys.companySettings, companyId ?? "unassigned"],
    enabled: Boolean(companyId) && (options?.enabled ?? true),
    queryFn: async () => {
      return firebaseData.companies.getSettings();
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
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
