"use client";

import { useEffect, useRef } from "react";
import { toastSuccess } from "@/hooks/use-toast";
import { getOfflineQueue, removeFromOfflineQueue, hasOfflineQueue } from "@/lib/utils/offlineQueue";
import { firebaseData } from "@/lib/services/firebaseData";

export default function OfflineSyncManager() {
  const syncingRef = useRef(false);

  useEffect(() => {
    const syncQueue = async () => {
      if (syncingRef.current) return;
      if (!navigator.onLine) return;
      if (!hasOfflineQueue()) return;

      syncingRef.current = true;
      const queue = getOfflineQueue();

      for (const item of queue) {
        try {
          await firebaseData.attendance.checkIn({
            employeeId: item.employeeId,
            employeeName: item.employeeName,
            lat: item.lat,
            lng: item.lng,
            geofenceId: item.geofenceId,
          });
          removeFromOfflineQueue(item.id);
          toastSuccess("تم مزامنة تسجيل الحضور المخزن مؤقتاً");
        } catch (err) {
          console.error("[offline-sync] failed for item", item.id, err);
          // Stop on auth errors, continue on network errors
          const errMsg = err instanceof Error ? err.message : String(err);
          if (errMsg === "AUTH_EXPIRED") break;
        }
      }

      syncingRef.current = false;
    };

    // Sync on mount if online
    syncQueue();

    // Sync when coming back online
    window.addEventListener("online", syncQueue);
    return () => window.removeEventListener("online", syncQueue);
  }, []);

  return null;
}
