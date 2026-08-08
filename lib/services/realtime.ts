"use client";

import { onSnapshot, collection, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/config/firebase";
import { getCompanyId, toNumber } from "./firebase/helpers";

export interface LocationUpdatePayload {
  employeeId: string | number;
  employeeName: string;
  lat: number;
  lng: number;
  status: "inside_geofence" | "outside_geofence" | "offline";
  geofenceName?: string;
  lastSeen: string;
  batteryLevel: number | null;
}

interface AnomalyPayload {
  employeeId?: string;
  details: string;
}

interface GeofenceBreachPayload {
  employeeId?: string;
  employeeName: string;
  geofenceName: string;
}

interface AttendanceCheckInPayload {
  employeeId: string;
  employeeName: string;
  checkInTime: string;
}

interface RealtimeCallbacks {
  onAnomalyDetected?: (data: AnomalyPayload) => void;
  onGeofenceBreach?: (data: GeofenceBreachPayload) => void;
  onAttendanceCheckIn?: (data: AttendanceCheckInPayload) => void;
  onLocationUpdate?: (data: LocationUpdatePayload) => void;
}

let connectionCount = 0;

function getStatus(
  data: Record<string, unknown>
): "inside_geofence" | "outside_geofence" | "offline" {
  const stored = data.status;
  if (stored === "inside_geofence" || stored === "outside_geofence" || stored === "offline") {
    return stored;
  }
  const lastSeen = new Date(String(data.lastSeen ?? new Date().toISOString())).getTime();
  const isStale = Number.isNaN(lastSeen) ? false : Date.now() - lastSeen > 5 * 60 * 1000;
  if (isStale) return "offline";
  if (data.isInsideGeofence === false) return "outside_geofence";
  return "inside_geofence";
}

export function isRealtimeConnected(): boolean {
  return connectionCount > 0;
}

export function subscribeRealtimeEvents(callbacks: RealtimeCallbacks): () => void {
  const unsubscribers: (() => void)[] = [];
  const companyId = getCompanyId();

  if (!db || !companyId) {
    return () => undefined;
  }

  // Only count as a live connection if we attach at least one listener
  let attached = 0;
  // Normalize company_id comparison: historical docs may store number or string.
  const companyIdVariants: Array<string | number> = [companyId];
  const asNumber = Number(companyId);
  if (String(asNumber) === companyId && Number.isFinite(asNumber)) {
    companyIdVariants.push(asNumber);
  }

  if (callbacks.onLocationUpdate) {
    const base = collection(db, "locations");
    // Dual-type company_id probe (string + numeric legacy) — same law as tracking.ts.
    const seenLocationKeys = new Set<string>();
    const emitLocation = (docId: string, data: Record<string, unknown>) => {
      const lat = toNumber(data.lat ?? data.currentLat ?? data.latitude);
      const lng = toNumber(data.lng ?? data.currentLng ?? data.longitude);
      const lastSeen = String(data.lastSeen ?? new Date().toISOString());
      const dedupeKey = `${docId}|${lat}|${lng}|${lastSeen}`;
      if (seenLocationKeys.has(dedupeKey)) return;
      seenLocationKeys.add(dedupeKey);
      // Bound memory on long-lived live-map sessions.
      if (seenLocationKeys.size > 2000) {
        const first = seenLocationKeys.values().next().value;
        if (first !== undefined) seenLocationKeys.delete(first);
      }
      callbacks.onLocationUpdate?.({
        employeeId: docId,
        employeeName: String(data.name ?? data.employeeName ?? ""),
        lat,
        lng,
        status: getStatus(data),
        geofenceName: data.geofenceName ? String(data.geofenceName) : undefined,
        lastSeen,
        batteryLevel: data.batteryLevel === undefined ? null : toNumber(data.batteryLevel),
      });
    };

    for (const cid of companyIdVariants) {
      const locationsQuery = query(base, where("company_id", "==", cid), limit(500));
      const unsubLocations = onSnapshot(
        locationsQuery,
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "removed") return;
            emitLocation(change.doc.id, change.doc.data() as Record<string, unknown>);
          });
        },
        (error) => {
          console.warn("[realtime] locations listener error:", error);
        }
      );
      unsubscribers.push(unsubLocations);
      attached++;
    }
  }

  if (callbacks.onAttendanceCheckIn) {
    const attendanceBase = collection(db, "attendance");
    const attendanceQuery = query(
      attendanceBase,
      where("company_id", "==", companyId),
      orderBy("checkInTime", "desc"),
      limit(50)
    );
    const unsubAttendance = onSnapshot(
      attendanceQuery,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type !== "added" || !callbacks.onAttendanceCheckIn) return;
          const data = change.doc.data() as Record<string, unknown>;
          const checkInTime = data.checkInTime;
          if (!checkInTime) return;
          callbacks.onAttendanceCheckIn({
            employeeId: String(data.employeeId ?? change.doc.id),
            employeeName: String(data.employeeName ?? ""),
            checkInTime: String(checkInTime),
          });
        });
      },
      (error) => {
        console.warn("[realtime] attendance listener error:", error);
      }
    );
    unsubscribers.push(unsubAttendance);
    attached++;
  }

  if (callbacks.onAnomalyDetected || callbacks.onGeofenceBreach) {
    const notifBase = collection(db, "notifications");
    const notifQuery = query(
      notifBase,
      where("company_id", "==", companyId),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    const unsubNotifications = onSnapshot(
      notifQuery,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type !== "added") return;
          const data = change.doc.data() as Record<string, unknown>;
          if (data.type === "anomaly_detected" && callbacks.onAnomalyDetected) {
            callbacks.onAnomalyDetected({
              employeeId: data.employeeId ? String(data.employeeId) : undefined,
              details: String(data.details ?? data.message ?? ""),
            });
          }
          if (data.type === "geofence_breach" && callbacks.onGeofenceBreach) {
            callbacks.onGeofenceBreach({
              employeeId: data.employeeId ? String(data.employeeId) : undefined,
              employeeName: String(data.employeeName ?? ""),
              geofenceName: String(data.geofenceName ?? ""),
            });
          }
        });
      },
      (error) => {
        console.warn("[realtime] notifications listener error:", error);
      }
    );
    unsubscribers.push(unsubNotifications);
    attached++;
  }

  if (attached > 0) {
    connectionCount += 1;
  }

  return () => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
    if (attached > 0) connectionCount = Math.max(0, connectionCount - 1);
  };
}
