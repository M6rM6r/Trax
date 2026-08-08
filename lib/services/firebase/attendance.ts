import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import type { AttendanceRecord, Employee, Geofence } from "@/lib/types/trackingTypes";
import { defaultCompanySettings, type CompanySettings } from "@/lib/types/companySettings";
import { resolveEmployeeShift, evaluateCheckIn, calculateWorkedHours } from "@/lib/utils/shifts";
import { isInsideAssignedGeofence, resolveAssignedGeofenceId } from "@/lib/utils/assignedGeofence";
import {
  ensureAuth,
  getCompanyId,
  requireCompanyId,
  requireDb,
  mapAttendance,
  mapGeofence,
  queryByCompanyId,
} from "./helpers";
import { employeesApi } from "./employees";

/** In-flight mutex so offline replay + UI cannot double-submit the same punch. */
const attendanceOpLocks = new Map<string, Promise<unknown>>();

async function withAttendanceLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = attendanceOpLocks.get(key) ?? Promise.resolve();
  let release!: () => void;
  const gate = new Promise<void>((r) => {
    release = r;
  });
  const held = prev.then(() => gate);
  attendanceOpLocks.set(
    key,
    held.catch(() => undefined)
  );
  await prev.catch(() => undefined);
  try {
    return await fn();
  } finally {
    release();
    if (attendanceOpLocks.get(key) === held) {
      attendanceOpLocks.delete(key);
    }
  }
}

export const attendanceApi = {
  async list(
    employeeId?: string,
    dateRange?: { from?: string; to?: string }
  ): Promise<AttendanceRecord[]> {
    try {
      await ensureAuth();
    } catch {
      return [];
    }
    const companyId = getCompanyId();
    if (!companyId) return [];
    const base = collection(requireDb(), "attendance");
    const extraFilters: ReturnType<typeof where>[] = [];
    if (employeeId) extraFilters.push(where("employeeId", "==", employeeId));
    // Push date bounds into Firestore when possible (cuts 500-doc client waste).
    // Field is `date` (YYYY-MM-DD). Composite index: company_id + date desc.
    // If index is missing, queryByCompanyId falls back to unordered + client filter below.
    if (dateRange?.from) extraFilters.push(where("date", ">=", dateRange.from));
    if (dateRange?.to) extraFilters.push(where("date", "<=", dateRange.to));
    // Status/lateMinutes written at check-in are authoritative historical facts.
    // Do not re-fetch employees/geofences/settings and rewrite history on every list —
    // that caused a 3x Firestore stampede on dashboard + attendance pages.
    let records = await queryByCompanyId(
      base,
      extraFilters,
      mapAttendance,
      orderBy("date", "desc")
    );

    // Defense in depth if unordered fallback returned extra days.
    if (dateRange?.from || dateRange?.to) {
      records = records.filter((record) => {
        if (dateRange.from && record.date < dateRange.from) return false;
        if (dateRange.to && record.date > dateRange.to) return false;
        return true;
      });
    }

    // Most recent first: day desc, then latest punch (checkout beats check-in).
    // Copy before sort — never mutate mapper output / shared refs.
    records = [...records].sort((a, b) => {
      const byDate = b.date.localeCompare(a.date);
      if (byDate !== 0) return byDate;
      const aAct = a.checkOutTime || a.checkInTime || "";
      const bAct = b.checkOutTime || b.checkInTime || "";
      return bAct.localeCompare(aAct);
    });
    return records;
  },

  async checkIn(payload: {
    employeeId: string;
    employeeName?: string;
    lat: number;
    lng: number;
    accuracy?: number;
    geofenceId?: string | null;
    companySettings?: Record<string, unknown>;
    employee?: Pick<Employee, "attendanceMode" | "shiftOverride" | "geofenceId"> | null;
    checkInTimestamp?: number;
  }): Promise<AttendanceRecord> {
    const companyIdEarly = requireCompanyId();
    const lockKey = `in:${companyIdEarly}:${String(payload.employeeId)}`;
    return withAttendanceLock(lockKey, () => this._checkInUnlocked(payload));
  },

  async _checkInUnlocked(payload: {
    employeeId: string;
    employeeName?: string;
    lat: number;
    lng: number;
    accuracy?: number;
    geofenceId?: string | null;
    companySettings?: Record<string, unknown>;
    employee?: Pick<Employee, "attendanceMode" | "shiftOverride" | "geofenceId"> | null;
    checkInTimestamp?: number;
  }): Promise<AttendanceRecord> {
    const currentUser = await ensureAuth();
    const companyId = requireCompanyId();
    const gpsAccuracy = payload.accuracy ?? 0;

    const settings = {
      ...defaultCompanySettings,
      ...(payload.companySettings ?? {}),
    };

    // Load employee to enforce assigned geofence. Server employee doc is authoritative.
    let employee: Employee | null = null;
    try {
      employee = await employeesApi.getById(payload.employeeId);
    } catch {
      employee = null;
    }

    // Prefer Firestore employee.geofenceId so clients cannot spoof a different location.
    const assignedGeofenceId = resolveAssignedGeofenceId(
      employee?.geofenceId,
      employee ? null : (payload.employee?.geofenceId ?? null)
    );

    if (!assignedGeofenceId) {
      throw new Error("EMPLOYEE_HAS_NO_ASSIGNED_GEOFENCE");
    }

    // Reject client-supplied geofence that does not match the assignment.
    if (
      payload.geofenceId !== null &&
      payload.geofenceId !== undefined &&
      String(payload.geofenceId).trim() !== "" &&
      String(payload.geofenceId) !== String(assignedGeofenceId)
    ) {
      throw new Error("CHECK_IN_GEOFENCE_MISMATCH");
    }

    let geofence: Geofence | null = null;
    try {
      const geofenceDoc = await getDoc(doc(requireDb(), "geofences", String(assignedGeofenceId)));
      if (geofenceDoc.exists()) {
        const raw = geofenceDoc.data() as Record<string, unknown>;
        const candidate = mapGeofence(geofenceDoc.id, raw);
        const ownsGeofence =
          raw.company_id !== null &&
          raw.company_id !== undefined &&
          String(raw.company_id) === String(companyId);
        if (candidate.active !== false && ownsGeofence) {
          geofence = candidate;
        }
      }
    } catch {
      geofence = null;
    }

    if (!geofence) {
      throw new Error("ASSIGNED_GEOFENCE_NOT_FOUND_OR_INACTIVE");
    }

    // Hard rule: physical presence inside the assigned geofence only.
    // Company flags cannot waive assignment-bound check-in.
    if (!isInsideAssignedGeofence(payload.lat, payload.lng, geofence, gpsAccuracy)) {
      throw new Error("Check-in location is outside the assigned geofence area");
    }

    const now = payload.checkInTimestamp ? new Date(payload.checkInTimestamp) : new Date();
    const { formatCompanyDate, formatCompanyTime, DEFAULT_COMPANY_TIMEZONE, attendanceDocId } =
      await import("@/lib/utils/companyDate");
    const tz =
      (settings as { timezone?: string } | null | undefined)?.timezone || DEFAULT_COMPANY_TIMEZONE;
    const date = formatCompanyDate(now, tz);
    const checkInTime = formatCompanyTime(now, tz);

    const { mode, shift, slot } = resolveEmployeeShift(
      employee ?? payload.employee ?? {},
      settings as typeof defaultCompanySettings,
      now,
      null,
      geofence?.shifts
    );
    const { status, lateMinutes } = evaluateCheckIn(checkInTime, shift);

    // One attendance doc per employee per company day (deterministic id — no double rows).
    const docId = attendanceDocId(companyId, payload.employeeId, date);
    const reference = doc(requireDb(), "attendance", docId);

    // Always write company_id as string so rules match stringified profile ids
    // and dual-type legacy docs (see firestore.rules companyIdsMatch).
    const record = {
      id: docId,
      ownerUid: currentUser.uid,
      company_id: String(companyId),
      employeeId: String(payload.employeeId),
      employeeName: payload.employeeName || currentUser.displayName || currentUser.email || "",
      date,
      checkInTime,
      checkOutTime: null,
      status,
      checkInLat: payload.lat,
      checkInLng: payload.lng,
      checkOutLat: null,
      checkOutLng: null,
      geofenceId: String(geofence.id),
      geofenceName: geofence.name ?? null,
      lateMinutes,
      workedHours: 0,
      checkOutStatus: null,
      attendanceMode: mode,
      appliedShift: shift,
      shiftSlot: slot,
      createdAt: serverTimestamp(),
    } satisfies Record<string, unknown>;

    // Atomic create-or-return so offline replay + double-tap cannot race two writers.
    const mapped = await runTransaction(requireDb(), async (tx) => {
      const snap = await tx.get(reference);
      if (snap.exists()) {
        const existingData = snap.data() as Record<string, unknown>;
        if (existingData.checkOutTime) {
          throw new Error("ALREADY_CHECKED_OUT");
        }
        if (existingData.checkInTime) {
          return mapAttendance(snap.id, existingData);
        }
      }
      tx.set(reference, record);
      return mapAttendance(reference.id, record);
    });
    return mapped;
  },

  async checkOut(
    employeeId: string,
    companySettings?: Partial<CompanySettings>,
    checkOutTimestamp?: number
  ): Promise<AttendanceRecord> {
    const checkoutCompanyId = requireCompanyId();
    const lockKey = `out:${checkoutCompanyId}:${String(employeeId)}`;
    return withAttendanceLock(lockKey, () =>
      this._checkOutUnlocked(employeeId, companySettings, checkOutTimestamp)
    );
  },

  async _checkOutUnlocked(
    employeeId: string,
    companySettings?: Partial<CompanySettings>,
    checkOutTimestamp?: number
  ): Promise<AttendanceRecord> {
    const currentUser = await ensureAuth();
    const checkoutCompanyId = requireCompanyId();
    const checkoutNow = checkOutTimestamp ? new Date(checkOutTimestamp) : new Date();
    const { formatCompanyDate, formatCompanyTime, DEFAULT_COMPANY_TIMEZONE, attendanceDocId } =
      await import("@/lib/utils/companyDate");
    const checkoutTz =
      (companySettings as { timezone?: string } | null | undefined)?.timezone ||
      DEFAULT_COMPANY_TIMEZONE;
    const today = formatCompanyDate(checkoutNow, checkoutTz);
    const checkOutTime = formatCompanyTime(checkoutNow, checkoutTz);
    const empId = String(employeeId);
    const db = requireDb();

    // Resolve open attendance doc with multiple strategies (legacy + rules-safe).
    let targetRef = doc(db, "attendance", attendanceDocId(checkoutCompanyId, empId, today));
    let currentData: Record<string, unknown> | null = null;

    try {
      const preferredSnap = await getDoc(targetRef);
      if (preferredSnap.exists()) {
        currentData = preferredSnap.data() as Record<string, unknown>;
      }
    } catch (e) {
      console.warn("[checkOut] preferred getDoc failed, trying queries:", e);
    }

    const isOpen = (d: Record<string, unknown>) => Boolean(d.checkInTime) && !d.checkOutTime;

    if (!currentData || !isOpen(currentData)) {
      // 1) ownerUid (works even when company_id filter is denied for staff)
      try {
        const byOwner = await getDocs(
          query(
            collection(db, "attendance"),
            where("ownerUid", "==", currentUser.uid),
            where("date", "==", today),
            limit(10)
          )
        );
        const open = byOwner.docs.find((d) => isOpen(d.data() as Record<string, unknown>));
        if (open) {
          targetRef = open.ref;
          currentData = open.data() as Record<string, unknown>;
        }
      } catch (e) {
        console.warn("[checkOut] ownerUid query failed:", e);
      }
    }

    if (!currentData || !isOpen(currentData)) {
      // 2) employeeId + company (string then number legacy)
      for (const cid of [checkoutCompanyId, Number(checkoutCompanyId)] as const) {
        if (cid === null || cid === undefined || (typeof cid === "number" && Number.isNaN(cid))) {
          continue;
        }
        if (typeof cid === "number" && String(cid) !== checkoutCompanyId) continue;
        try {
          const snap = await getDocs(
            query(
              collection(db, "attendance"),
              where("company_id", "==", cid),
              where("employeeId", "==", empId),
              where("date", "==", today),
              limit(10)
            )
          );
          const open = snap.docs.find((d) => isOpen(d.data() as Record<string, unknown>));
          if (open) {
            targetRef = open.ref;
            currentData = open.data() as Record<string, unknown>;
            break;
          }
        } catch (e) {
          console.warn("[checkOut] company+employee query failed:", e);
        }
      }
    }

    if (!currentData || !currentData.checkInTime) throw new Error("No open attendance record");
    if (currentData.checkOutTime) throw new Error("ALREADY_CHECKED_OUT");

    const expectedCheckoutTime =
      companySettings?.checkoutTimeRangeEnabled && companySettings?.checkoutStartTime
        ? companySettings.checkoutStartTime
        : ((currentData.appliedShift as { endTime?: string } | undefined)?.endTime ?? null);
    const { parseTimeToMinutes } = await import("@/lib/utils/shifts");

    // Atomic read-check-write: prevents double checkout races across tabs/devices.
    const result = await runTransaction(db, async (tx) => {
      const fresh = await tx.get(targetRef);
      if (!fresh.exists()) throw new Error("No open attendance record");
      const data = fresh.data() as Record<string, unknown>;
      if (!data.checkInTime) throw new Error("No open attendance record");
      if (data.checkOutTime) throw new Error("ALREADY_CHECKED_OUT");

      const current = mapAttendance(targetRef.id, data);
      const workedHours = current.checkInTime
        ? calculateWorkedHours(current.checkInTime, checkOutTime)
        : 0;
      const earlyCheckout = Boolean(
        expectedCheckoutTime &&
        Number.isFinite(parseTimeToMinutes(checkOutTime)) &&
        Number.isFinite(parseTimeToMinutes(expectedCheckoutTime)) &&
        parseTimeToMinutes(checkOutTime) < parseTimeToMinutes(expectedCheckoutTime)
      );

      // Identity fields (company_id / employeeId / date) are immutable at checkout.
      // Only fill missing ownerUid for rules ownership — never rewrite person-day keys.
      const patch: {
        checkOutTime: string;
        status: string;
        checkOutStatus: string;
        workedHours: number;
        expectedCheckoutTime: string | null;
        earlyCheckout: boolean;
        ownerUid?: string;
      } = {
        checkOutTime,
        status: "checked_out",
        checkOutStatus: "present",
        workedHours,
        expectedCheckoutTime,
        earlyCheckout,
      };
      if (data.ownerUid === null || data.ownerUid === undefined || data.ownerUid === "") {
        patch.ownerUid = currentUser.uid;
      }

      tx.update(targetRef, patch);
      return {
        ...current,
        checkOutTime,
        status: "checked_out" as const,
        checkOutStatus: "present" as const,
        workedHours,
        expectedCheckoutTime,
        earlyCheckout,
      };
    }).catch(async (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes("permission") ||
        msg.includes("PERMISSION") ||
        msg.includes("Missing or insufficient")
      ) {
        // Rules path sometimes allows merge when update fails on legacy docs.
        console.warn("[checkOut] transaction denied, retrying setDoc merge:", msg);
        const fresh = await getDoc(targetRef);
        if (!fresh.exists()) throw new Error("No open attendance record");
        const data = fresh.data() as Record<string, unknown>;
        if (!data.checkInTime) throw new Error("No open attendance record");
        if (data.checkOutTime) throw new Error("ALREADY_CHECKED_OUT");
        const current = mapAttendance(targetRef.id, data);
        const workedHours = current.checkInTime
          ? calculateWorkedHours(current.checkInTime, checkOutTime)
          : 0;
        const earlyCheckout = Boolean(
          expectedCheckoutTime &&
          Number.isFinite(parseTimeToMinutes(checkOutTime)) &&
          Number.isFinite(parseTimeToMinutes(expectedCheckoutTime)) &&
          parseTimeToMinutes(checkOutTime) < parseTimeToMinutes(expectedCheckoutTime)
        );
        // Merge fallback: outcome fields only — do not rewrite person-day identity.
        const patch = {
          checkOutTime,
          status: "checked_out",
          checkOutStatus: "present",
          workedHours,
          expectedCheckoutTime,
          earlyCheckout,
          ...(data.ownerUid === null || data.ownerUid === undefined || data.ownerUid === ""
            ? { ownerUid: currentUser.uid }
            : {}),
        };
        await setDoc(targetRef, patch, { merge: true });
        return {
          ...current,
          checkOutTime,
          status: "checked_out" as const,
          checkOutStatus: "present" as const,
          workedHours,
          expectedCheckoutTime,
          earlyCheckout,
        };
      }
      throw err;
    });

    return result;
  },
};
