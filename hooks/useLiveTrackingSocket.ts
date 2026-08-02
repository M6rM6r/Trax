"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  subscribeRealtimeEvents,
  isRealtimeConnected,
  type LocationUpdatePayload,
} from "@/lib/services/realtime";
import type { LiveTrackingEmployee } from "@/lib/types/trackingTypes";
import { useAuthStore } from "@/stores/useAuthStore";
import { logger } from "@/lib/config/logger";

// Merges arrays preferring the record with the newer lastSeen timestamp (string compare)
function mergeByTimestamp(
  a: LiveTrackingEmployee[],
  b: LiveTrackingEmployee[]
): LiveTrackingEmployee[] {
  const map = new Map<string, LiveTrackingEmployee>();
  for (const emp of [...a, ...b]) {
    const prev = map.get(emp.id);
    if (!prev || emp.lastSeen.localeCompare(prev.lastSeen) > 0) {
      map.set(emp.id, emp);
    }
  }
  return Array.from(map.values());
}

export function useLiveTrackingSocket(initialData: LiveTrackingEmployee[]) {
  const companyId = useAuthStore((state) => state.companyId);
  const [employees, setEmployees] = useState<LiveTrackingEmployee[]>(initialData);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const employeesRef = useRef<LiveTrackingEmployee[]>(initialData);

  // Seed or merge initial snapshot without clobbering fresher realtime data
  useEffect(() => {
    if (!initialData || initialData.length === 0) return;
    setEmployees((prev) => {
      const merged = mergeByTimestamp(prev, initialData);
      employeesRef.current = merged;
      return merged;
    });
  }, [initialData]);

  useEffect(() => {
    if (!companyId) return;
    const unsubscribe = subscribeRealtimeEvents({
      onLocationUpdate: (data: LocationUpdatePayload) => {
        const incoming: LiveTrackingEmployee = {
          id: String(data.employeeId),
          name: data.employeeName,
          lat: data.lat,
          lng: data.lng,
          status: data.status,
          geofenceName: data.geofenceName,
          lastSeen: data.lastSeen,
          batteryLevel: data.batteryLevel,
        };
        setEmployees((prev) => {
          const merged = mergeByTimestamp(prev, [incoming]);
          employeesRef.current = merged;
          return merged;
        });
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
    setEmployees(employeesRef.current);
  }, []);

  return { employees, isConnected, lastUpdate, forceRefresh };
}
