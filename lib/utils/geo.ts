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

function isBareGeofenceIdLabel(
  name: string | null | undefined,
  geofenceId: string | number | null | undefined
): boolean {
  if (!name) return true;
  const n = String(name).trim();
  if (!n) return true;
  // "3404" style labels are ids, not human names.
  if (geofenceId !== null && geofenceId !== undefined && n === String(geofenceId)) return true;
  if (/^\d+$/.test(n)) return true;
  return false;
}

function geofenceNameById(
  geofences: Geofence[],
  id: string | number | null | undefined
): string | undefined {
  if (id === null || id === undefined || String(id).trim() === "") return undefined;
  const name = geofences.find((g) => String(g.id) === String(id))?.name;
  if (!name || isBareGeofenceIdLabel(name, id)) return undefined;
  return name;
}

/**
 * Attendance table / dashboard location label.
 *
 * Never invent a fence from nearest GPS — that shows zones the employee is
 * not assigned to (e.g. الضاحية / الواحة when assignment is elsewhere).
 *
 * Order:
 *  1. Punch stored geofenceId → roster name (check-in writes assigned fence)
 *  2. Punch stored geofenceName when it is a real label (not a bare id)
 *  3. Employee's currently assigned geofence (absents + legacy punches)
 */
export function resolveAttendanceLocation(
  record: Pick<
    AttendanceRecord,
    "geofenceId" | "geofenceName" | "checkInLat" | "checkInLng" | "employeeId"
  >,
  geofences: Geofence[],
  employees?: Employee[]
): string | undefined {
  const fromPunchId = geofenceNameById(geofences, record.geofenceId ?? null);
  if (fromPunchId) return fromPunchId;

  if (record.geofenceName && !isBareGeofenceIdLabel(record.geofenceName, record.geofenceId)) {
    return String(record.geofenceName).trim();
  }

  if (employees?.length) {
    const employee = employees.find((e) => String(e.id) === String(record.employeeId));
    const fromAssigned = geofenceNameById(geofences, employee?.geofenceId ?? null);
    if (fromAssigned) return fromAssigned;
  }

  return undefined;
}
