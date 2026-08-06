import type { CompanySettings } from "@/lib/types/companySettings";
import type { Employee } from "@/lib/types/trackingTypes";

const QUEUE_KEY = "trax_offline_queue";

export interface QueuedCheckIn {
  id: string;
  employeeId: string;
  employeeName?: string;
  employeeSnapshot?: Pick<Employee, "attendanceMode" | "shiftOverride" | "geofenceId"> | null;
  lat: number;
  lng: number;
  accuracy?: number;
  geofenceId?: string | null;
  geofenceName?: string | null;
  timestamp: number;
  // Policy snapshot captured at queue time for authoritative replay
  settings: Partial<CompanySettings>;
}

export interface QueuedCheckOut {
  id: string;
  employeeId: string;
  timestamp: number;
  settings?: Partial<CompanySettings>;
}

const CHECKOUT_QUEUE_KEY = "trax_offline_checkout_queue";

import { firebaseData } from "@/lib/services/firebase";

export function getOfflineQueue(): QueuedCheckIn[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedCheckIn[]) : [];
  } catch {
    return [];
  }
}

export function addToOfflineQueue(item: QueuedCheckIn): void {
  if (typeof window === "undefined") return;
  const normalized: QueuedCheckIn = {
    ...item,
    employeeSnapshot: item.employeeSnapshot ?? null,
    geofenceId: item.geofenceId ?? null,
    geofenceName: item.geofenceName ?? null,
    settings: item.settings ?? {},
  };
  const queue = getOfflineQueue();
  queue.push(normalized);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function removeFromOfflineQueue(id: string): void {
  if (typeof window === "undefined") return;
  const queue = getOfflineQueue().filter((item) => item.id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function clearOfflineQueue(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(QUEUE_KEY);
}

export function hasOfflineQueue(): boolean {
  return getOfflineQueue().length > 0;
}

export function getOfflineCheckOutQueue(): QueuedCheckOut[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CHECKOUT_QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedCheckOut[]) : [];
  } catch {
    return [];
  }
}

export function addToOfflineCheckOutQueue(item: QueuedCheckOut): void {
  if (typeof window === "undefined") return;
  const queue = getOfflineCheckOutQueue();
  queue.push(item);
  localStorage.setItem(CHECKOUT_QUEUE_KEY, JSON.stringify(queue));
}

export function removeFromOfflineCheckOutQueue(id: string): void {
  if (typeof window === "undefined") return;
  const queue = getOfflineCheckOutQueue().filter((item) => item.id !== id);
  localStorage.setItem(CHECKOUT_QUEUE_KEY, JSON.stringify(queue));
}

export function hasOfflineCheckOutQueue(): boolean {
  return getOfflineCheckOutQueue().length > 0;
}

/** Prevent concurrent processOfflineQueue runs (online event + interval + resume). */
let offlineSyncInFlight: Promise<{ processed: number; failed: number }> | null = null;

export async function processOfflineQueue(): Promise<{
  processed: number;
  failed: number;
}> {
  if (offlineSyncInFlight) return offlineSyncInFlight;

  offlineSyncInFlight = (async () => {
    const checkIns = getOfflineQueue();
    let processed = 0;
    let failed = 0;

    // One punch per employee: keep earliest check-in / latest check-out in queue.
    const checkInByEmp = new Map<string, QueuedCheckIn>();
    for (const item of checkIns) {
      const key = String(item.employeeId);
      const prev = checkInByEmp.get(key);
      if (!prev || item.timestamp < prev.timestamp) checkInByEmp.set(key, item);
      else removeFromOfflineQueue(item.id);
    }

    const uniqueCheckIns = Array.from(checkInByEmp.values());
    for (const item of uniqueCheckIns) {
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
        processed++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // Idempotent day already punched — drop queue item.
        if (msg === "ALREADY_CHECKED_OUT" || msg.includes("already")) {
          removeFromOfflineQueue(item.id);
          processed++;
        } else {
          failed++;
        }
      }
    }

    const checkOutByEmp = new Map<string, QueuedCheckOut>();
    for (const item of getOfflineCheckOutQueue()) {
      const key = String(item.employeeId);
      const prev = checkOutByEmp.get(key);
      if (!prev || item.timestamp > prev.timestamp) {
        if (prev) removeFromOfflineCheckOutQueue(prev.id);
        checkOutByEmp.set(key, item);
      } else {
        removeFromOfflineCheckOutQueue(item.id);
      }
    }

    const uniqueCheckOuts = Array.from(checkOutByEmp.values());
    for (const item of uniqueCheckOuts) {
      try {
        await firebaseData.attendance.checkOut(item.employeeId, item.settings, item.timestamp);
        removeFromOfflineCheckOutQueue(item.id);
        processed++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "ALREADY_CHECKED_OUT" || msg === "No open attendance record") {
          removeFromOfflineCheckOutQueue(item.id);
          processed++;
        } else {
          failed++;
        }
      }
    }

    return { processed, failed };
  })();

  try {
    return await offlineSyncInFlight;
  } finally {
    offlineSyncInFlight = null;
  }
}
