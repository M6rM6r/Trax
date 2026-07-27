import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import type { AttendanceRecord, Employee, Geofence } from "@/lib/types/trackingTypes";
import { defaultCompanySettings } from "@/lib/types/companySettings";
import { resolveEmployeeShift, evaluateCheckIn, calculateWorkedHours } from "@/lib/utils/shifts";
import { calculateDistance, GEOFENCE_DISTANCE_BUFFER_METERS } from "@/lib/utils/geo";
import {
  ensureAuth,
  getCompanyId,
  requireCompanyId,
  requireDb,
  mapAttendance,
  mapGeofence,
} from "./helpers";

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
    const filters: ReturnType<typeof where>[] = [where("company_id", "==", companyId)];
    if (employeeId !== null && employeeId !== undefined)
      filters.push(where("employeeId", "==", employeeId));
    if (dateRange?.from) filters.push(where("date", ">=", dateRange.from));
    if (dateRange?.to) filters.push(where("date", "<=", dateRange.to));
    try {
      const attendanceQuery = query(base, ...filters, limit(500));
      const snapshot = await getDocs(attendanceQuery);
      const records = snapshot.docs.map((item) => mapAttendance(item.id, item.data()));
      records.sort((a, b) => b.date.localeCompare(a.date));
      return records;
    } catch {
      // Composite index might not be deployed yet — fall back to simpler query
      const simpleFilters: ReturnType<typeof where>[] = [where("company_id", "==", companyId)];
      if (employeeId !== null && employeeId !== undefined)
        simpleFilters.push(where("employeeId", "==", employeeId));
      const fallbackQuery = query(base, ...simpleFilters, limit(500));
      const snapshot = await getDocs(fallbackQuery);
      let records = snapshot.docs.map((item) => mapAttendance(item.id, item.data()));
      if (dateRange?.from) records = records.filter((r) => r.date >= dateRange.from!);
      if (dateRange?.to) records = records.filter((r) => r.date <= dateRange.to!);
      records.sort((a, b) => b.date.localeCompare(a.date));
      return records;
    }
  },

  async checkIn(payload: {
    employeeId: string;
    employeeName?: string;
    lat: number;
    lng: number;
    geofenceId?: string | null;
    companySettings?: Record<string, unknown>;
    employee?: Pick<Employee, "attendanceMode" | "shiftOverride"> | null;
  }): Promise<AttendanceRecord> {
    const currentUser = await ensureAuth();
    const companyId = requireCompanyId();
    let geofence: Geofence | null = null;
    if (payload.geofenceId) {
      try {
        const geofenceDoc = await getDoc(doc(requireDb(), "geofences", String(payload.geofenceId)));
        if (geofenceDoc.exists()) {
          geofence = mapGeofence(geofenceDoc.id, geofenceDoc.data());
        }
      } catch {
        // Geofence lookup failed — proceed without geofence name
      }
    }

    const settings = {
      ...defaultCompanySettings,
      ...(payload.companySettings ?? {}),
    };

    const requireGeofence = Boolean(settings.requireGeofenceForCheckIn);
    const allowOutside = Boolean(settings.allowCheckInOutsideGeofence);

    if (geofence) {
      const dist = calculateDistance(payload.lat, payload.lng, geofence.lat, geofence.lng);
      const within = dist <= geofence.radius + GEOFENCE_DISTANCE_BUFFER_METERS;
      if (!within && requireGeofence && !allowOutside) {
        throw new Error("Check-in location is outside the allowed geofence area");
      }
    } else {
      if (payload.geofenceId) {
        if (requireGeofence && !allowOutside) {
          throw new Error("Geofence not found or inactive");
        }
      } else if (requireGeofence && !allowOutside) {
        const active = await getDocs(
          query(collection(requireDb(), "geofences"), where("active", "==", true), limit(1))
        );
        if (!active.empty) {
          throw new Error("Check-in requires a geofence and none was provided");
        }
      }
    }

    const now = new Date();
    const date = now.toLocaleDateString("sv-SE");
    const checkInTime = now.toTimeString().slice(0, 5);

    const { mode, shift, slot } = resolveEmployeeShift(
      payload.employee ?? {},
      settings as typeof defaultCompanySettings,
      now,
      null
    );
    const { status, lateMinutes } = evaluateCheckIn(checkInTime, shift);

    const existing = await getDocs(
      query(
        collection(requireDb(), "attendance"),
        where("employeeId", "==", payload.employeeId),
        where("date", "==", date),
        limit(1)
      )
    );
    const existingDoc = existing.docs[0];
    if (existingDoc) {
      const existingData = existingDoc.data();
      if (existingData.checkOutTime) {
        await updateDoc(existingDoc.ref, {
          checkInTime,
          checkInLat: payload.lat,
          checkInLng: payload.lng,
          geofenceId: payload.geofenceId ?? null,
          geofenceName: geofence?.name ?? null,
          status,
          lateMinutes,
          checkOutTime: null,
          checkOutLat: null,
          checkOutLng: null,
          checkOutStatus: null,
          workedHours: 0,
        });
        return mapAttendance(existingDoc.id, {
          ...existingData,
          checkInTime,
          checkInLat: payload.lat,
          checkInLng: payload.lng,
          status,
          lateMinutes,
          checkOutTime: null,
          workedHours: 0,
        });
      }
      return mapAttendance(existingDoc.id, existingData);
    }

    const reference = doc(collection(requireDb(), "attendance"));
    const record = {
      id: reference.id,
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
      geofenceId: payload.geofenceId,
      geofenceName: geofence?.name ?? null,
      lateMinutes,
      workedHours: 0,
      checkOutStatus: null,
      attendanceMode: mode,
      appliedShift: shift,
      shiftSlot: slot,
      createdAt: serverTimestamp(),
    } satisfies Record<string, unknown>;
    await setDoc(reference, record);
    return mapAttendance(reference.id, record);
  },

  async checkOut(employeeId: string): Promise<AttendanceRecord> {
    await ensureAuth();
    const today = new Date().toLocaleDateString("sv-SE");
    const snapshot = await getDocs(
      query(
        collection(requireDb(), "attendance"),
        where("employeeId", "==", employeeId),
        where("date", "==", today),
        limit(1)
      )
    );
    const openDoc = snapshot.docs.find((d) => !d.data().checkOutTime);
    if (!openDoc) throw new Error("No open attendance record");
    const current = mapAttendance(openDoc.id, openDoc.data());
    const checkOutTime = new Date().toTimeString().slice(0, 5);
    const workedHours = current.checkInTime
      ? calculateWorkedHours(current.checkInTime, checkOutTime)
      : 0;
    await updateDoc(openDoc.ref, {
      checkOutTime,
      status: "checked_out",
      checkOutStatus: "present",
      workedHours,
    });
    return {
      ...current,
      checkOutTime,
      status: "checked_out",
      checkOutStatus: "present",
      workedHours,
    };
  },
};
