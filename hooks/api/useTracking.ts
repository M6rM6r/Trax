"use client";

import { useEffect, useState, useCallback } from "react";
import { firebaseData } from "@/lib/services/firebaseData";
import type { LiveTrackingEmployee } from "@/lib/types/trackingTypes";
import { useAuthStore } from "@/stores/useAuthStore";

export function useLiveTracking() {
  const companyId = useAuthStore((state) => state.companyId);
  const [data, setData] = useState<LiveTrackingEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [refetchKey, setRefetchKey] = useState(0);

  const refetch = useCallback(() => setRefetchKey((k) => k + 1), []);

  useEffect(() => {
    if (!companyId) {
      setData([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsError(false);

    const unsubscribe = firebaseData.tracking.onSnapshotLive(
      (items) => {
        setData(items);
        setIsLoading(false);
      },
      (error) => {
        console.error("[useLiveTracking] onSnapshot error:", error);
        setIsError(true);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
      setData([]);
    };
  }, [companyId, refetchKey]);

  return { data, isLoading, isError, refetch };
}
