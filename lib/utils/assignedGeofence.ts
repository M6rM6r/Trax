import type { Geofence } from "@/lib/types/trackingTypes";
import { calculateDistance, GEOFENCE_DISTANCE_BUFFER_METERS } from "@/lib/utils/geo";

/**
 * Employees may only check in at their assigned work location.
 * Company-wide "any geofence" matching is intentionally disallowed.
 */
export function resolveAssignedGeofenceId(
  serverEmployeeGeofenceId?: string | null,
  payloadEmployeeGeofenceId?: string | null
): string | null {
  // Server employee record is authoritative; payload is offline fallback only when server is unavailable.
  const raw = serverEmployeeGeofenceId ?? payloadEmployeeGeofenceId ?? null;
  if (raw === null || raw === undefined) return null;
  const id = String(raw).trim();
  if (!id || id === "null" || id === "undefined") return null;
  return id;
}

export function assertClientAssignedCheckInAllowed(input: {
  assignedGeofenceId: string | null;
  allowedGeofencesCount: number;
  isWithinAssignedGeofence: boolean;
  hasLocation: boolean;
}): { ok: true } | { ok: false; reason: "no_location" | "no_assignment" | "outside_assigned" } {
  if (!input.hasLocation) return { ok: false, reason: "no_location" };
  if (!input.assignedGeofenceId || input.allowedGeofencesCount === 0) {
    return { ok: false, reason: "no_assignment" };
  }
  if (!input.isWithinAssignedGeofence) return { ok: false, reason: "outside_assigned" };
  return { ok: true };
}

export function isInsideAssignedGeofence(
  lat: number,
  lng: number,
  geofence: Pick<Geofence, "lat" | "lng" | "radius">,
  gpsAccuracy = 0
): boolean {
  const accuracy = Number.isFinite(gpsAccuracy) && gpsAccuracy > 0 ? gpsAccuracy : 0;
  const radius = Number.isFinite(geofence.radius) && geofence.radius > 0 ? geofence.radius : 0;
  if (radius <= 0) return false;
  const dist = calculateDistance(lat, lng, geofence.lat, geofence.lng);
  return dist <= radius + GEOFENCE_DISTANCE_BUFFER_METERS + accuracy;
}
