"use client";

import { onSnapshot, collection, query, where, orderBy } from "firebase/firestore";
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

let connected = false;

function getStatus(
  data: Record<string, unknown>
): "inside_geofence" | "outside_geofence" | "offline" {
  const lastSeen = new Date(String(data.lastSeen ?? new Date().toISOString())).getTime();
  const isStale = Number.isNaN(lastSeen) ? false : Date.now() - lastSeen > 5 * 60 * 1000;
  if (isStale) return "offline";
  if (data.isInsideGeofence === false) return "outside_geofence";
  return "inside_geofence";
}

export function isRealtimeConnected(): boolean {
  return connected;
}

export function subscribeRealtimeEvents(callbacks: RealtimeCallbacks): () => void {
  const unsubscribers: (() => void)[] = [];
  const companyId = getCompanyId();

  if (!db || !companyId) {
    return () => undefined;
  }

  connected = true;

  const base = collection(db, "locations");
  const locationsQuery = query(base, where("company_id", "==", companyId));
  const unsubLocations = onSnapshot(
    locationsQuery,
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "removed") return;
        const data = change.doc.data() as Record<string, unknown>;
        if (callbacks.onLocationUpdate) {
          callbacks.onLocationUpdate({
            employeeId: change.doc.id,
            employeeName: String(data.name ?? data.employeeName ?? ""),
            lat: toNumber(data.lat ?? data.currentLat ?? data.latitude),
            lng: toNumber(data.lng ?? data.currentLng ?? data.longitude),
            status: getStatus(data),
            geofenceName: data.geofenceName ? String(data.geofenceName) : undefined,
            lastSeen: String(data.lastSeen ?? new Date().toISOString()),
            batteryLevel: data.batteryLevel === undefined ? null : toNumber(data.batteryLevel),
          });
        }
      });
    },
    (error) => {
      console.warn("[realtime] locations listener error:", error);
      connected = false;
    }
  );
  unsubscribers.push(unsubLocations);

  const attendanceBase = collection(db, "attendance");
  const attendanceQuery = query(
    attendanceBase,
    where("company_id", "==", companyId),
    orderBy("checkInTime", "desc")
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
      connected = false;
    }
  );
  unsubscribers.push(unsubAttendance);

  const notifBase = collection(db, "notifications");
  const notifQuery = query(
    notifBase,
    where("company_id", "==", companyId),
    orderBy("createdAt", "desc")
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
      connected = false;
    }
  );
  unsubscribers.push(unsubNotifications);

  return () => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
    connected = false;
  };
}
