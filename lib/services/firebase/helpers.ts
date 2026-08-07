import { onAuthStateChanged, type User } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  where,
  type QueryConstraint,
} from "firebase/firestore";
import { auth, db } from "@/lib/config/firebase";
import { useAuthStore } from "@/stores/useAuthStore";
import type { AttendanceRecord, Employee, Geofence, WorkShift } from "@/lib/types/trackingTypes";
import { evaluateCheckIn } from "@/lib/utils/shifts";

let lastSyncUid: string | null = null;
let lastSyncTime = 0;
const SYNC_THROTTLE_MS = 60_000;

async function syncUserDoc(user: User) {
  if (!db) return;
  const now = Date.now();
  if (lastSyncUid === user.uid && now - lastSyncTime < SYNC_THROTTLE_MS) return;
  lastSyncUid = user.uid;
  lastSyncTime = now;
  const { companyId, user: storeUser } = useAuthStore.getState();
  // Never merge role here — role is immutable under rules and must not race company→employee.
  // Only touch non-privileged presence fields + company_id when already known in the store.
  const payload: Record<string, unknown> = {
    name: storeUser?.name || user.displayName || null,
    email: storeUser?.email || user.email || null,
    lastSignIn: new Date().toISOString(),
  };
  if (companyId) payload.company_id = String(companyId);
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

export async function queryByCompanyId<T>(
  base: ReturnType<typeof collection>,
  extraFilters: ReturnType<typeof where>[],
  mapper: (id: string, data: Record<string, unknown>) => T,
  orderByConstraint?: ReturnType<typeof orderBy>
): Promise<T[]> {
  const cidStr = getCompanyId();
  if (!cidStr) return [];
  // Some legacy docs stored company_id as number — try both shapes (Windsurf pipeline).
  const cidNum = Number(cidStr);
  const isNumeric = String(cidNum) === cidStr;

  async function tryFetch(cid: string | number) {
    const constraints: QueryConstraint[] = [where("company_id", "==", cid), ...extraFilters];
    if (orderByConstraint) constraints.push(orderByConstraint);
    // Date-bounded attendance queries need headroom for multi-week person-day history.
    constraints.push(limit(2000));
    return getDocs(query(base, ...constraints));
  }

  // Try ordered query first; fall back to unordered if the index is missing
  try {
    let snap = await tryFetch(cidStr);
    if (snap.empty && isNumeric) {
      snap = await tryFetch(cidNum);
    }
    return snap.docs.map((item) => mapper(item.id, item.data() as Record<string, unknown>));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (
      message.includes("The query requires an index") ||
      message.includes("FAILED_PRECONDITION")
    ) {
      console.warn(
        "[queryByCompanyId] missing composite index, falling back to unordered fetch:",
        message
      );
      let snap = await getDocs(
        query(base, where("company_id", "==", cidStr), ...extraFilters, limit(2000))
      );
      if (snap.empty && isNumeric) {
        snap = await getDocs(
          query(base, where("company_id", "==", cidNum), ...extraFilters, limit(2000))
        );
      }
      return snap.docs.map((item) => mapper(item.id, item.data() as Record<string, unknown>));
    }
    throw err;
  }
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
    syncUserDoc(auth.currentUser);
    return auth.currentUser;
  }
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth!, async (user) => {
      unsubscribe();
      if (user) {
        syncUserDoc(user);
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
    // Company-admin recoverable credential (loginPassword preferred; legacy password from Admin SDK).
    // Not used for Auth — Firebase Auth holds the real hash. Employees never read this via rules alone.
    password: (() => {
      const plain =
        value.loginPassword ?? value.login_password ?? value.password ?? value.tempPassword;
      if (plain === null || plain === undefined) return undefined;
      const s = String(plain).trim();
      return s.length > 0 ? s : undefined;
    })(),
    attendanceMode: (value.attendanceMode as Employee["attendanceMode"]) ?? null,
    shiftOverride: (value.shiftOverride as Employee["shiftOverride"]) ?? null,
  };
}

export function mapGeofence(id: string, value: Record<string, unknown>): Geofence {
  const shifts =
    (value.shifts as
      | { defaultShift?: unknown; morningShift?: unknown; eveningShift?: unknown }
      | null
      | undefined) ?? null;
  return {
    id: String((value.id as string | number | undefined) ?? id),
    name: String(value.name ?? value.title ?? ""),
    address: String(value.address ?? value.location ?? ""),
    lat: toNumber(value.lat ?? value.latitude ?? value.centerLat),
    lng: toNumber(value.lng ?? value.longitude ?? value.centerLng),
    radius: (() => {
      const r = toNumber(value.radius ?? value.radiusMeters, 100);
      return Number.isFinite(r) && r > 0 ? r : 100;
    })(),
    color: String(value.color ?? "#10b981"),
    active: value.active !== false,
    employeesCount:
      value.employeesCount === null || value.employeesCount === undefined
        ? undefined
        : toNumber(value.employeesCount),
    shifts: shifts
      ? {
          defaultShift: mapShift(shifts.defaultShift) ?? defaultShift(),
          morningShift: mapShift(shifts.morningShift) ?? defaultShift("08:00", "12:00"),
          eveningShift: mapShift(shifts.eveningShift) ?? defaultShift("13:00", "17:00"),
        }
      : null,
  };
}

function defaultShift(startTime = "08:00", endTime = "17:00"): WorkShift {
  return {
    startTime,
    endTime,
    gracePeriodMinutes: 30,
    lateThresholdMinutes: 30,
  };
}

function mapShift(value: unknown): WorkShift | null {
  const s = value as Record<string, unknown> | null | undefined;
  if (!s) return null;
  const startTime = s.startTime ? String(s.startTime) : null;
  const endTime = s.endTime ? String(s.endTime) : null;
  if (!startTime || !endTime) return null;
  return {
    startTime,
    endTime,
    gracePeriodMinutes: toNumber(s.gracePeriodMinutes, 30),
    lateThresholdMinutes: toNumber(s.lateThresholdMinutes, 30),
  };
}

export function mapAttendance(id: string, value: Record<string, unknown>): AttendanceRecord {
  const storedStatus = (value.status as AttendanceRecord["status"]) ?? "absent";
  const checkOutTime = (value.checkOutTime as string | null | undefined) ?? null;
  const checkInTime = (value.checkInTime as string | null | undefined) ?? null;
  const appliedShift = (value.appliedShift as AttendanceRecord["appliedShift"]) ?? null;
  // Prefer values written at check-in (historical fact). Only backfill lateMinutes when
  // the field was never stored — do NOT re-score against live company settings.
  const derived = checkInTime && appliedShift ? evaluateCheckIn(checkInTime, appliedShift) : null;
  const hasStoredLate = value.lateMinutes !== null && value.lateMinutes !== undefined;
  const lateMinutes = hasStoredLate ? toNumber(value.lateMinutes) : (derived?.lateMinutes ?? 0);

  // Terminal checkout wins for status enum; lateMinutes still carry arrival lateness.
  const status: AttendanceRecord["status"] = (() => {
    if (checkOutTime || storedStatus === "checked_out") return "checked_out";
    if (!checkInTime && (storedStatus === "absent" || !storedStatus)) return "absent";
    if (storedStatus === "present" || storedStatus === "late" || storedStatus === "absent") {
      // Keep stored late/present; if legacy missing status but lateMinutes > 0 → late.
      if (storedStatus === "present" && lateMinutes > 0) return "late";
      return storedStatus;
    }
    if (lateMinutes > 0) return "late";
    if (derived) return derived.status;
    if (checkInTime) return "present";
    return storedStatus || "absent";
  })();

  return {
    id: String((value.id as string | number | undefined) ?? id),
    employeeId: String((value.employeeId as string | number | undefined) ?? ""),
    employeeName: String(value.employeeName ?? ""),
    date: String(value.date ?? ""),
    checkInTime,
    checkOutTime,
    status,
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
    lateMinutes,
    workedHours:
      value.workedHours === null || value.workedHours === undefined
        ? null
        : toNumber(value.workedHours),
    checkOutStatus: (value.checkOutStatus as AttendanceRecord["checkOutStatus"]) ?? null,
    expectedCheckoutTime:
      (value.expectedCheckoutTime as string | null | undefined) ??
      (value.appliedShift as { endTime?: string } | null | undefined)?.endTime ??
      null,
    earlyCheckout: Boolean(
      value.checkOutTime &&
      ((value.expectedCheckoutTime as string | null | undefined) ??
        (value.appliedShift as { endTime?: string } | null | undefined)?.endTime) &&
      (value.checkOutTime as string) <
        ((value.expectedCheckoutTime as string | null | undefined) ??
          (value.appliedShift as { endTime?: string } | null | undefined)?.endTime ??
          "")
    ),
    attendanceMode: (value.attendanceMode as AttendanceRecord["attendanceMode"]) ?? null,
    appliedShift: (value.appliedShift as AttendanceRecord["appliedShift"]) ?? null,
    shiftSlot: (value.shiftSlot as AttendanceRecord["shiftSlot"]) ?? null,
  };
}
