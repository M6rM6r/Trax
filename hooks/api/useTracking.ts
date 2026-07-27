"use client";

import { useQuery } from "@tanstack/react-query";
import { firebaseData } from "@/lib/services/firebaseData";
import type { LiveTrackingEmployee } from "@/lib/types/trackingTypes";
import { useAuthStore } from "@/stores/useAuthStore";
import { queryKeys } from "./queryKeys";

export function useLiveTracking() {
  const companyId = useAuthStore((state) => state.companyId);

  return useQuery<LiveTrackingEmployee[]>({
    queryKey: [...queryKeys.tracking, companyId ?? "unassigned"],
    enabled: Boolean(companyId),
    staleTime: 10 * 1000,
    retry: 1,
    queryFn: async (): Promise<LiveTrackingEmployee[]> => {
      return firebaseData.tracking.live();
    },
    refetchInterval: 30000,
  });
}
