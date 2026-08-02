"use client";

import { useEffect, useState, useCallback } from "react";
import {
  subscribeRealtimeEvents,
  isRealtimeConnected,
  type LocationUpdatePayload,
} from "@/lib/services/realtime";
import type { LiveTrackingEmployee } from "@/lib/types/trackingTypes";
import { useAuthStore } from "@/stores/useAuthStore";
import { logger } from "@/lib/config/logger";

function parseLastSeen(value: string): number {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function mergeByTimestamp(
  prev: LiveTrackingEmployee[],
  incoming: LiveTrackingEmployee[]
): LiveTrackingEmployee[] {
  if (prev.length === 0) return incoming;
  const map = new Map(prev.map((e) => [e.id, e]));
  let changed = false;
  for (const item of incoming) {
    const existing = map.get(item.id);
    if (!existing || parseLastSeen(item.lastSeen) > parseLastSeen(existing.lastSeen)) {
      map.set(item.id, item);
      changed = true;
    }
  }
  return changed ? Array.from(map.values()) : prev;
}

export function useLiveTrackingSocket(initialData: LiveTrackingEmployee[]) {
  const companyId = useAuthStore((state) => state.companyId);
  const [employees, setEmployees] = useState<LiveTrackingEmployee[]>(initialData);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    setEmployees((prev) => mergeByTimestamp(prev, initialData));
  }, [initialData]);

  useEffect(() => {
    if (!companyId) return;
    const unsubscribe = subscribeRealtimeEvents({
      onLocationUpdate: (data: LocationUpdatePayload) => {
        setEmployees((prev) =>
          mergeByTimestamp(prev, [
            {
              id: String(data.employeeId),
              name: data.employeeName,
              lat: data.lat,
              lng: data.lng,
              status: data.status,
              geofenceName: data.geofenceName,
              lastSeen: data.lastSeen,
              batteryLevel: data.batteryLevel,
            },
          ])
        );
        setLastUpdate(new Date());
      },
    });

    const interval = setInterval(() => {
      setIsConnected(isRealtimeConnected());
    }, 2000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [companyId]);

  const forceRefresh = useCallback(() => {
    logger.info("Force refresh requested for live tracking");
    setEmployees((prev) => mergeByTimestamp(prev, initialData));
  }, [initialData]);

  return { employees, isConnected, lastUpdate, forceRefresh };
}
