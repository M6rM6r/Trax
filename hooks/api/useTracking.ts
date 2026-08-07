"use client";

import { useEffect, useState, useCallback } from "react";
import { firebaseData } from "@/lib/services/firebaseData";
import type { LiveTrackingEmployee } from "@/lib/types/trackingTypes";
import { useAuthStore } from "@/stores/useAuthStore";

export function useLiveTracking(options?: { enabled?: boolean }) {
  const companyId = useAuthStore((state) => state.companyId);
  const role = useAuthStore((state) => state.role);
  // Company-admin live map only — never stampede locations for employee/mastermind shells.
  const enabled = (options?.enabled ?? true) && Boolean(companyId) && role === "company";
  const [data, setData] = useState<LiveTrackingEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isError, setIsError] = useState(false);
  const [refetchKey, setRefetchKey] = useState(0);

  const refetch = useCallback(() => setRefetchKey((k) => k + 1), []);

  useEffect(() => {
    let mounted = true;
    if (!enabled) {
      setData([]);
      setIsLoading(false);
      setIsError(false);
      return;
    }

    setIsLoading(true);
    setIsError(false);

    // One-time fetch for initial snapshot. Live updates are handled by useLiveTrackingSocket via subscribeRealtimeEvents.
    // This avoids duplicating the locations onSnapshot listener.
    (async () => {
      try {
        const items = await firebaseData.tracking.live();
        if (!mounted) return;
        setData(items);
        setIsLoading(false);
      } catch (error) {
        if (!mounted) return;
        console.error("[useLiveTracking] fetch error:", error);
        setIsError(true);
        setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [enabled, companyId, refetchKey]);

  return { data, isLoading, isError, refetch };
}
