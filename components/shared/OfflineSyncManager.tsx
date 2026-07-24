"use client";

import { useEffect, useRef } from "react";
import { toastSuccess } from "@/hooks/use-toast";
import {
  getOfflineQueue,
  removeFromOfflineQueue,
  hasOfflineQueue,
  getOfflineCheckOutQueue,
  removeFromOfflineCheckOutQueue,
  hasOfflineCheckOutQueue,
} from "@/lib/utils/offlineQueue";
import { firebaseData } from "@/lib/services/firebaseData";

export default function OfflineSyncManager() {
  const syncingRef = useRef(false);

  useEffect(() => {
    const syncQueue = async () => {
      if (syncingRef.current) return;
      if (!navigator.onLine) return;
      if (!hasOfflineQueue() && !hasOfflineCheckOutQueue()) return;

      syncingRef.current = true;

      // Sync check-in queue
      const checkInQueue = getOfflineQueue();
      for (const item of checkInQueue) {
        try {
          await firebaseData.attendance.checkIn({
            employeeId: item.employeeId,
            employeeName: item.employeeName,
            lat: item.lat,
            lng: item.lng,
            geofenceId: item.geofenceId,
            companySettings: {
              requireGeofenceForCheckIn: item.requireGeofenceForCheckIn,
              allowCheckInOutsideGeofence: item.allowCheckInOutsideGeofence,
            },
          });
          removeFromOfflineQueue(item.id);
          toastSuccess("تم مزامنة تسجيل الحضور المخزن مؤقتاً");
        } catch (err) {
          console.error("[offline-sync] check-in failed for item", item.id, err);
          const errMsg = err instanceof Error ? err.message : String(err);
          if (errMsg === "AUTH_EXPIRED") break;
        }
      }

      // Sync check-out queue
      const checkOutQueue = getOfflineCheckOutQueue();
      for (const item of checkOutQueue) {
        try {
          await firebaseData.attendance.checkOut(item.employeeId);
          removeFromOfflineCheckOutQueue(item.id);
          toastSuccess("تم مزامنة تسجيل الانصراف المخزن مؤقتاً");
        } catch (err) {
          console.error("[offline-sync] check-out failed for item", item.id, err);
          const errMsg = err instanceof Error ? err.message : String(err);
          if (errMsg === "AUTH_EXPIRED") break;
        }
      }

      syncingRef.current = false;
    };

    syncQueue();

    window.addEventListener("online", syncQueue);
    return () => window.removeEventListener("online", syncQueue);
  }, []);

  return null;
}
