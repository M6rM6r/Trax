import type { AttendanceRecord, Employee, Geofence } from "@/lib/types/trackingTypes";

/**
 * Pure Haversine distance in meters.
 * All inputs are WGS84 lat/lng in decimal degrees.
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const GEOFENCE_DISTANCE_BUFFER_METERS = 50;

export function resolveAttendanceLocation(
  record: Pick<
    AttendanceRecord,
    "geofenceId" | "geofenceName" | "checkInLat" | "checkInLng" | "employeeId"
  >,
  geofences: Geofence[],
  employees?: Employee[]
): string | undefined {
  const isJustId =
    record.geofenceName &&
    /^\d+$/.test(String(record.geofenceName)) &&
    String(record.geofenceName) === String(record.geofenceId);

  if (record.geofenceName && !isJustId) return record.geofenceName;

  if (record.geofenceId) {
    const byId = geofences.find((g) => String(g.id) === String(record.geofenceId))?.name;
    if (byId) return byId;
  }

  if (employees?.length) {
    const employee = employees.find((e) => String(e.id) === String(record.employeeId));
    if (employee?.geofenceId) {
      const byAssigned = geofences.find((g) => String(g.id) === String(employee.geofenceId))?.name;
      if (byAssigned) return byAssigned;
    }
  }

  if (
    record.checkInLat !== null &&
    record.checkInLat !== undefined &&
    record.checkInLng !== null &&
    record.checkInLng !== undefined &&
    geofences.length > 0
  ) {
    const lat = Number(record.checkInLat);
    const lng = Number(record.checkInLng);
    const validGeofences = geofences.filter(
      (g) =>
        typeof g.lat === "number" &&
        typeof g.lng === "number" &&
        typeof g.radius === "number" &&
        g.radius > 0
    );
    if (validGeofences.length > 0) {
      const [nearest] = validGeofences.sort(
        (a, b) =>
          calculateDistance(lat, lng, a.lat, a.lng) - calculateDistance(lat, lng, b.lat, b.lng)
      );
      const dist = calculateDistance(lat, lng, nearest.lat, nearest.lng);
      if (dist <= nearest.radius + GEOFENCE_DISTANCE_BUFFER_METERS) {
        return nearest.name;
      }
    }
  }

  return undefined;
}
