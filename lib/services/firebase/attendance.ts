import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
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
    // Status/lateMinutes written at check-in are authoritative historical facts.
    // Do not re-fetch employees/geofences/settings and rewrite history on every list —
    // that caused a 3x Firestore stampede on dashboard + attendance pages.
    let records = await queryByCompanyId(
      base,
      extraFilters,
      mapAttendance,
      orderBy("date", "desc")
    );

    if (dateRange?.from || dateRange?.to) {
      records = records.filter((record) => {
        if (dateRange.from && record.date < dateRange.from) return false;
        if (dateRange.to && record.date > dateRange.to) return false;
        return true;
      });
    }

    records.sort((a, b) => b.date.localeCompare(a.date));
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
    const existingSnap = await getDoc(reference);
    if (existingSnap.exists()) {
      const existingData = existingSnap.data();
      // Day is terminal after checkout — do not reopen / wipe checkout.
      if (existingData.checkOutTime) {
        throw new Error("ALREADY_CHECKED_OUT");
      }
      if (existingData.checkInTime) {
        return mapAttendance(existingSnap.id, existingData);
      }
    }

    const record = {
      id: docId,
      ownerUid: currentUser.uid,
      company_id: companyId,
      employeeId: payload.employeeId,
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
    await setDoc(reference, record);
    const mappedRecord = mapAttendance(reference.id, record);
    return mappedRecord;
  },

  async checkOut(
    employeeId: string,
    companySettings?: Partial<CompanySettings>,
    checkOutTimestamp?: number
  ): Promise<AttendanceRecord> {
    await ensureAuth();
    const checkoutCompanyId = requireCompanyId();
    const checkoutNow = checkOutTimestamp ? new Date(checkOutTimestamp) : new Date();
    const { formatCompanyDate, formatCompanyTime, DEFAULT_COMPANY_TIMEZONE } =
      await import("@/lib/utils/companyDate");
    const { attendanceDocId } = await import("@/lib/utils/companyDate");
    const checkoutTz =
      (companySettings as { timezone?: string } | null | undefined)?.timezone ||
      DEFAULT_COMPANY_TIMEZONE;
    const today = formatCompanyDate(checkoutNow, checkoutTz);
    const checkOutTime = formatCompanyTime(checkoutNow, checkoutTz);

    // Prefer deterministic doc; fall back to legacy random-id rows.
    const preferredRef = doc(
      requireDb(),
      "attendance",
      attendanceDocId(checkoutCompanyId, employeeId, today)
    );
    let targetRef = preferredRef;
    let currentData: Record<string, unknown> | null = null;
    const preferredSnap = await getDoc(preferredRef);
    if (preferredSnap.exists()) {
      currentData = preferredSnap.data() as Record<string, unknown>;
    } else {
      const snapshot = await getDocs(
        query(
          collection(requireDb(), "attendance"),
          where("company_id", "==", checkoutCompanyId),
          where("employeeId", "==", employeeId),
          where("date", "==", today),
          limit(5)
        )
      );
      const openDoc = snapshot.docs.find((d) => !d.data().checkOutTime && d.data().checkInTime);
      if (!openDoc) throw new Error("No open attendance record");
      targetRef = openDoc.ref;
      currentData = openDoc.data() as Record<string, unknown>;
    }

    if (!currentData?.checkInTime) throw new Error("No open attendance record");
    if (currentData.checkOutTime) throw new Error("ALREADY_CHECKED_OUT");

    const current = mapAttendance(targetRef.id, currentData);
    const workedHours = current.checkInTime
      ? calculateWorkedHours(current.checkInTime, checkOutTime)
      : 0;

    const expectedCheckoutTime =
      companySettings?.checkoutTimeRangeEnabled && companySettings?.checkoutStartTime
        ? companySettings.checkoutStartTime
        : (current.appliedShift?.endTime ?? null);
    // Compare via minutes so overnight shifts don't lie on string compare.
    const { parseTimeToMinutes } = await import("@/lib/utils/shifts");
    const earlyCheckout = Boolean(
      expectedCheckoutTime &&
      Number.isFinite(parseTimeToMinutes(checkOutTime)) &&
      Number.isFinite(parseTimeToMinutes(expectedCheckoutTime)) &&
      parseTimeToMinutes(checkOutTime) < parseTimeToMinutes(expectedCheckoutTime)
    );

    await updateDoc(targetRef, {
      checkOutTime,
      status: "checked_out",
      checkOutStatus: "present",
      workedHours,
      expectedCheckoutTime,
      earlyCheckout,
    });
    const updatedRecord: AttendanceRecord = {
      ...current,
      checkOutTime,
      status: "checked_out",
      checkOutStatus: "present",
      workedHours,
      expectedCheckoutTime,
      earlyCheckout,
    };
    return updatedRecord;
  },
};
