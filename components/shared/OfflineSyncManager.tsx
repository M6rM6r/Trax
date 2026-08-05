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
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/queryKeys";

const SYNC_LOCK_KEY = "trax_offline_sync_lock";
const SYNC_LOCK_TTL = 30000; // 30 seconds

function acquireSyncLock(): boolean {
  if (typeof window === "undefined") return false;
  const now = Date.now();
  const existing = localStorage.getItem(SYNC_LOCK_KEY);
  if (existing) {
    const { timestamp } = JSON.parse(existing);
    if (now - timestamp < SYNC_LOCK_TTL) return false; // Lock held by another tab
  }
  localStorage.setItem(SYNC_LOCK_KEY, JSON.stringify({ timestamp: now }));
  return true;
}

function releaseSyncLock(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SYNC_LOCK_KEY);
}

function extendSyncLock(): void {
  if (typeof window === "undefined") return;
  const existing = localStorage.getItem(SYNC_LOCK_KEY);
  if (existing) {
    localStorage.setItem(SYNC_LOCK_KEY, JSON.stringify({ timestamp: Date.now() }));
  }
}

export default function OfflineSyncManager() {
  const t = useTranslations("CheckIn");
  const qc = useQueryClient();
  const syncingRef = useRef(false);
  const lockIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const syncQueue = async () => {
      if (syncingRef.current) return;
      if (!navigator.onLine) return;
      if (!hasOfflineQueue() && !hasOfflineCheckOutQueue()) return;
      if (!acquireSyncLock()) return; // Another tab is syncing

      syncingRef.current = true;

      // Extend lock periodically while syncing
      lockIntervalRef.current = setInterval(extendSyncLock, 10000);

      try {
        // Sync check-in queue
        const checkInQueue = getOfflineQueue();
        for (const item of checkInQueue) {
          try {
            await firebaseData.attendance.checkIn({
              employeeId: item.employeeId,
              employeeName: item.employeeName,
              lat: item.lat,
              lng: item.lng,
              accuracy: item.accuracy,
              geofenceId: item.geofenceId,
              companySettings: item.settings,
              employee: item.employeeSnapshot ?? null,
              checkInTimestamp: item.timestamp,
            });
            removeFromOfflineQueue(item.id);
            toastSuccess(t("offlineCheckInSynced"));
          } catch (err) {
            console.error("[offline-sync] check-in failed for item", item.id, err);
            const errMsg = err instanceof Error ? err.message : String(err);
            if (errMsg === "AUTH_EXPIRED") break;
            // Already applied on server (or terminal day) — drop stale queue entry.
            if (
              errMsg === "ALREADY_CHECKED_OUT" ||
              errMsg.includes("already") ||
              errMsg === "EMPLOYEE_HAS_NO_ASSIGNED_GEOFENCE" ||
              errMsg === "CHECK_IN_GEOFENCE_MISMATCH" ||
              errMsg.includes("outside the assigned geofence")
            ) {
              removeFromOfflineQueue(item.id);
            }
          }
        }

        // Sync check-out queue
        const checkOutQueue = getOfflineCheckOutQueue();
        for (const item of checkOutQueue) {
          try {
            await firebaseData.attendance.checkOut(item.employeeId, item.settings, item.timestamp);
            removeFromOfflineCheckOutQueue(item.id);
            toastSuccess(t("offlineCheckOutSynced"));
          } catch (err) {
            console.error("[offline-sync] check-out failed for item", item.id, err);
            const errMsg = err instanceof Error ? err.message : String(err);
            if (errMsg === "AUTH_EXPIRED") break;
            if (errMsg === "ALREADY_CHECKED_OUT" || errMsg === "No open attendance record") {
              removeFromOfflineCheckOutQueue(item.id);
            }
          }
        }

        qc.invalidateQueries({ queryKey: queryKeys.attendance });
        qc.invalidateQueries({ queryKey: queryKeys.dashboard });
      } finally {
        if (lockIntervalRef.current) {
          clearInterval(lockIntervalRef.current);
          lockIntervalRef.current = null;
        }
        releaseSyncLock();
        syncingRef.current = false;
      }
    };

    syncQueue();

    window.addEventListener("online", syncQueue);
    return () => {
      window.removeEventListener("online", syncQueue);
      if (lockIntervalRef.current) clearInterval(lockIntervalRef.current);
    };
  }, [t, qc]);

  return null;
}
