import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/config/firebase";
import { useAuthStore } from "@/stores/useAuthStore";
import type { AttendanceRecord, Employee, Geofence } from "@/lib/types/trackingTypes";

async function syncUserDoc(user: User) {
  if (!db) return;
  const { companyId, role, user: storeUser } = useAuthStore.getState();
  const payload: Record<string, unknown> = {
    name: storeUser?.name || user.displayName || null,
    email: storeUser?.email || user.email || null,
    lastSignIn: new Date().toISOString(),
  };
  if (companyId) payload.company_id = String(companyId);
  if (role) payload.role = role;
  try {
    await setDoc(doc(db, "users", user.uid), cleanPayload(payload), { merge: true });
  } catch (e) {
    console.warn("[ensureAuth] failed to sync user doc:", e);
  }
}

export function getCompanyId(): string | null {
  const companyId = useAuthStore.getState().companyId;
  return companyId === null ? null : String(companyId);
}

export function cleanPayload<T extends Record<string, unknown>>(payload: T): T {
  const cleaned = { ...payload };
  for (const key of Object.keys(cleaned)) {
    if (cleaned[key] === undefined) {
      delete cleaned[key];
    }
  }
  return cleaned as T;
}

export function requireCompanyId(): string {
  const companyId = getCompanyId();
  if (companyId === null) throw new Error("NO_COMPANY");
  return companyId;
}

export function requireDb() {
  if (!db) throw new Error("Firebase Firestore is not configured");
  return db;
}

export async function ensureAuth(): Promise<User> {
  if (!auth) throw new Error("Firebase Auth is not configured");
  if (auth.currentUser) {
    await syncUserDoc(auth.currentUser);
    return auth.currentUser;
  }
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth!, async (user) => {
      unsubscribe();
      if (user) {
        await syncUserDoc(user);
        resolve(user);
      } else reject(new Error("AUTH_EXPIRED"));
    });
  });
}

export function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function mapEmployee(id: string, value: Record<string, unknown>): Employee {
  return {
    id: String((value.id as string | number | undefined) ?? id),
    name: String(value.name ?? ""),
    email: String(value.email ?? ""),
    phone: String(value.phone ?? ""),
    role: (value.role as Employee["role"]) ?? "employee",
    department: String(value.department ?? ""),
    avatar: (value.avatar as string | null | undefined) ?? null,
    geofenceId:
      value.geofenceId !== null && value.geofenceId !== undefined
        ? String(value.geofenceId)
        : value.assigned_geofence_id !== null && value.assigned_geofence_id !== undefined
          ? String(value.assigned_geofence_id)
          : null,
    status: value.status === "inactive" ? "inactive" : "active",
    currentLat:
      value.currentLat === null || value.currentLat === undefined
        ? null
        : toNumber(value.currentLat),
    currentLng:
      value.currentLng === null || value.currentLng === undefined
        ? null
        : toNumber(value.currentLng),
    lastSeen: (value.lastSeen as string | null | undefined) ?? null,
    batteryLevel:
      value.batteryLevel === null || value.batteryLevel === undefined
        ? null
        : toNumber(value.batteryLevel),
    employeeNumber: (value.employeeNumber as string | null | undefined) ?? null,
    password: (value.password as string | undefined) ?? undefined,
    attendanceMode: (value.attendanceMode as Employee["attendanceMode"]) ?? null,
    shiftOverride: (value.shiftOverride as Employee["shiftOverride"]) ?? null,
  };
}

export function mapGeofence(id: string, value: Record<string, unknown>): Geofence {
  return {
    id: String((value.id as string | number | undefined) ?? id),
    name: String(value.name ?? value.title ?? ""),
    address: String(value.address ?? value.location ?? ""),
    lat: toNumber(value.lat ?? value.latitude ?? value.centerLat),
    lng: toNumber(value.lng ?? value.longitude ?? value.centerLng),
    radius: toNumber(value.radius ?? value.radiusMeters, 100),
    color: String(value.color ?? "#10b981"),
    active: value.active !== false,
    employeesCount:
      value.employeesCount === null || value.employeesCount === undefined
        ? undefined
        : toNumber(value.employeesCount),
  };
}

export function mapAttendance(id: string, value: Record<string, unknown>): AttendanceRecord {
  return {
    id: String((value.id as string | number | undefined) ?? id),
    employeeId: String((value.employeeId as string | number | undefined) ?? ""),
    employeeName: String(value.employeeName ?? ""),
    date: String(value.date ?? ""),
    checkInTime: (value.checkInTime as string | null | undefined) ?? null,
    checkOutTime: (value.checkOutTime as string | null | undefined) ?? null,
    status: (value.status as AttendanceRecord["status"]) ?? "absent",
    checkInLat:
      value.checkInLat === null || value.checkInLat === undefined
        ? null
        : toNumber(value.checkInLat),
    checkInLng:
      value.checkInLng === null || value.checkInLng === undefined
        ? null
        : toNumber(value.checkInLng),
    checkOutLat:
      value.checkOutLat === null || value.checkOutLat === undefined
        ? null
        : toNumber(value.checkOutLat),
    checkOutLng:
      value.checkOutLng === null || value.checkOutLng === undefined
        ? null
        : toNumber(value.checkOutLng),
    geofenceId:
      value.geofenceId === null || value.geofenceId === undefined ? null : String(value.geofenceId),
    geofenceName: (value.geofenceName as string | null | undefined) ?? null,
    lateMinutes: toNumber(value.lateMinutes),
    workedHours: toNumber(value.workedHours),
    checkOutStatus: (value.checkOutStatus as AttendanceRecord["checkOutStatus"]) ?? null,
    attendanceMode: (value.attendanceMode as AttendanceRecord["attendanceMode"]) ?? null,
    appliedShift: (value.appliedShift as AttendanceRecord["appliedShift"]) ?? null,
    shiftSlot: (value.shiftSlot as AttendanceRecord["shiftSlot"]) ?? null,
  };
}
