"use client";

import { io, type Socket } from "socket.io-client";
import { env } from "@/lib/config/env";
import { logger } from "@/lib/config/logger";

export type RealtimeEvent =
  | "employee:location_updated"
  | "attendance:checked_in"
  | "attendance:checked_out"
  | "anomaly:detected"
  | "geofence:breach";

interface RealtimeHandlers {
  onLocationUpdate?: (data: LocationUpdatePayload) => void;
  onAttendanceCheckIn?: (data: AttendancePayload) => void;
  onAttendanceCheckOut?: (data: AttendancePayload) => void;
  onAnomalyDetected?: (data: AnomalyPayload) => void;
  onGeofenceBreach?: (data: GeofenceBreachPayload) => void;
}

export interface LocationUpdatePayload {
  employeeId: number;
  employeeName: string;
  lat: number;
  lng: number;
  status: "inside_geofence" | "outside_geofence" | "offline";
  geofenceName: string | null;
  lastSeen: string;
  batteryLevel: number | null;
}

export interface AttendancePayload {
  employeeId: number;
  employeeName: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: string;
  geofenceName: string | null;
}

export interface AnomalyPayload {
  employeeId: number;
  isAnomaly: boolean;
  anomalyScore: number;
  details: string;
}

export interface GeofenceBreachPayload {
  employeeId: number;
  employeeName: string;
  geofenceName: string;
  distance: number;
  timestamp: string;
}

let socket: Socket | null = null;

function getSocket(): Socket | null {
  if (socket) return socket;

  const wsUrl = env.NEXT_PUBLIC_WS_URL;
  if (!wsUrl) {
    logger.warn("WebSocket URL not configured, real-time features disabled");
    return null;
  }

  socket = io(wsUrl, {
    transports: ["websocket"],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on("connect", () => {
    logger.info("WebSocket connected", { id: socket?.id });
  });

  socket.on("disconnect", (reason) => {
    logger.warn("WebSocket disconnected", { reason });
  });

  socket.on("connect_error", (error) => {
    logger.error("WebSocket connection error", { error: error.message });
  });

  return socket;
}

export function subscribeRealtimeEvents(handlers: RealtimeHandlers): () => void {
  const s = getSocket();
  if (!s) return () => {};

  const unsubscribers: Array<() => void> = [];

  if (handlers.onLocationUpdate) {
    const handler = (data: LocationUpdatePayload) => handlers.onLocationUpdate?.(data);
    s.on("employee:location_updated", handler);
    unsubscribers.push(() => s.off("employee:location_updated", handler));
  }

  if (handlers.onAttendanceCheckIn) {
    const handler = (data: AttendancePayload) => handlers.onAttendanceCheckIn?.(data);
    s.on("attendance:checked_in", handler);
    unsubscribers.push(() => s.off("attendance:checked_in", handler));
  }

  if (handlers.onAttendanceCheckOut) {
    const handler = (data: AttendancePayload) => handlers.onAttendanceCheckOut?.(data);
    s.on("attendance:checked_out", handler);
    unsubscribers.push(() => s.off("attendance:checked_out", handler));
  }

  if (handlers.onAnomalyDetected) {
    const handler = (data: AnomalyPayload) => handlers.onAnomalyDetected?.(data);
    s.on("anomaly:detected", handler);
    unsubscribers.push(() => s.off("anomaly:detected", handler));
  }

  if (handlers.onGeofenceBreach) {
    const handler = (data: GeofenceBreachPayload) => handlers.onGeofenceBreach?.(data);
    s.on("geofence:breach", handler);
    unsubscribers.push(() => s.off("geofence:breach", handler));
  }

  return () => unsubscribers.forEach((fn) => fn());
}

export function disconnectRealtime(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    logger.info("WebSocket disconnected and cleaned up");
  }
}

export function isRealtimeConnected(): boolean {
  return socket?.connected ?? false;
}
