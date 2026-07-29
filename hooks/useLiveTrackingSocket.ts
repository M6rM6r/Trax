"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { subscribeRealtimeEvents, type LocationUpdatePayload } from "@/lib/services/realtime";
import type { LiveTrackingEmployee } from "@/lib/types/trackingTypes";
import { useAuthStore } from "@/stores/useAuthStore";
import { logger } from "@/lib/config/logger";

export function useLiveTrackingSocket(initialData: LiveTrackingEmployee[]) {
  const companyId = useAuthStore((state) => state.companyId);
  const [employees, setEmployees] = useState<LiveTrackingEmployee[]>(initialData);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const employeesRef = useRef<LiveTrackingEmployee[]>(initialData);

  useEffect(() => {
    employeesRef.current = initialData;
    setEmployees(initialData);
  }, [initialData]);

  useEffect(() => {
    if (!companyId) return;
    const unsubscribe = subscribeRealtimeEvents({
      onLocationUpdate: (data: LocationUpdatePayload) => {
        setEmployees((prev) => {
          const idx = prev.findIndex((e) => e.id === String(data.employeeId));
          const updated: LiveTrackingEmployee = {
            id: String(data.employeeId),
            name: data.employeeName,
            lat: data.lat,
            lng: data.lng,
            status: data.status,
            geofenceName: data.geofenceName,
            lastSeen: data.lastSeen,
            batteryLevel: data.batteryLevel,
          };

          if (idx >= 0) {
            const next = [...prev];
            next[idx] = updated;
            return next;
          }
          return [...prev, updated];
        });
        setLastUpdate(new Date());
      },
    });

    const interval = setInterval(() => {
      import("@/lib/services/realtime").then(({ isRealtimeConnected }) => {
        setIsConnected(isRealtimeConnected());
      });
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
