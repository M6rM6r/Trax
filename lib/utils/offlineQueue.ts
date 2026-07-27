const QUEUE_KEY = "trax_offline_queue";

export interface QueuedCheckIn {
  id: string;
  employeeId: string;
  employeeName?: string;
  lat: number;
  lng: number;
  geofenceId?: string | null;
  timestamp: number;
  // Policy snapshot captured at queue time for authoritative replay
  requireGeofenceForCheckIn?: boolean;
  allowCheckInOutsideGeofence?: boolean;
}

export interface QueuedCheckOut {
  id: string;
  employeeId: string;
  timestamp: number;
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
    geofenceId: item.geofenceId ?? null,
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

export async function processOfflineQueue(): Promise<{
  processed: number;
  failed: number;
}> {
  const checkIns = getOfflineQueue();
  const checkOuts = getOfflineCheckOutQueue();
  let processed = 0;
  let failed = 0;

  for (const item of checkIns) {
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
        employee: null,
      });
      removeFromOfflineQueue(item.id);
      processed++;
    } catch {
      failed++;
    }
  }

  for (const item of checkOuts) {
    try {
      await firebaseData.attendance.checkOut(item.employeeId);
      removeFromOfflineCheckOutQueue(item.id);
      processed++;
    } catch {
      failed++;
    }
  }

  return { processed, failed };
}
