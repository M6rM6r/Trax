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
import { calculateDistance, GEOFENCE_DISTANCE_BUFFER_METERS } from "@/lib/utils/geo";
import {
  ensureAuth,
  getCompanyId,
  requireCompanyId,
  requireDb,
  mapAttendance,
  mapGeofence,
  queryByCompanyId,
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
    const extraFilters: ReturnType<typeof where>[] = [];
    if (employeeId) extraFilters.push(where("employeeId", "==", employeeId));
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
    employee?: Pick<Employee, "attendanceMode" | "shiftOverride"> | null;
    checkInTimestamp?: number;
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

    const gpsAccuracy =
      typeof payload.accuracy === "number" && Number.isFinite(payload.accuracy)
        ? Math.max(0, payload.accuracy)
        : 0;

    if (!geofence) {
      try {
        const companyGeofences = await queryByCompanyId(
          collection(requireDb(), "geofences"),
          [],
          mapGeofence
        );
        if (payload.geofenceId) {
          geofence =
            companyGeofences.find(
              (g) => g.active !== false && String(g.id) === String(payload.geofenceId)
            ) ?? null;
        }
        if (!geofence) {
          geofence =
            companyGeofences.find(
              (g) =>
                g.active !== false &&
                calculateDistance(payload.lat, payload.lng, g.lat, g.lng) <=
                  g.radius + GEOFENCE_DISTANCE_BUFFER_METERS + gpsAccuracy
            ) ?? null;
        }
      } catch {
        // proceed without geofence
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
      const within = dist <= geofence.radius + GEOFENCE_DISTANCE_BUFFER_METERS + gpsAccuracy;
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

    const now = payload.checkInTimestamp ? new Date(payload.checkInTimestamp) : new Date();
    const date = now.toLocaleDateString("sv-SE");
    const checkInTime = now.toTimeString().slice(0, 5);

    const { mode, shift, slot } = resolveEmployeeShift(
      payload.employee ?? {},
      settings as typeof defaultCompanySettings,
      now,
      null,
      geofence?.shifts
    );
    const { status, lateMinutes } = evaluateCheckIn(checkInTime, shift);

    const existing = await getDocs(
      query(
        collection(requireDb(), "attendance"),
        where("company_id", "==", companyId),
        where("employeeId", "==", payload.employeeId),
        where("date", "==", date),
        limit(1)
      )
    );
    const existingDoc = existing.docs[0];
    if (existingDoc) {
      const existingData = existingDoc.data();
      if (existingData.checkOutTime) {
        const resolvedGeofenceId = geofence?.id ?? payload.geofenceId ?? null;
        const resolvedGeofenceName = geofence?.name ?? null;
        await updateDoc(existingDoc.ref, {
          checkInTime,
          checkInLat: payload.lat,
          checkInLng: payload.lng,
          geofenceId: resolvedGeofenceId,
          geofenceName: resolvedGeofenceName,
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
          geofenceId: resolvedGeofenceId,
          geofenceName: resolvedGeofenceName,
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
      geofenceId: geofence?.id ?? payload.geofenceId ?? null,
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

  async checkOut(
    employeeId: string,
    companySettings?: Partial<CompanySettings>,
    checkOutTimestamp?: number
  ): Promise<AttendanceRecord> {
    await ensureAuth();
    const checkoutCompanyId = requireCompanyId();
    const checkoutNow = checkOutTimestamp ? new Date(checkOutTimestamp) : new Date();
    const today = checkoutNow.toLocaleDateString("sv-SE");
    const snapshot = await getDocs(
      query(
        collection(requireDb(), "attendance"),
        where("company_id", "==", checkoutCompanyId),
        where("employeeId", "==", employeeId),
        where("date", "==", today),
        limit(1)
      )
    );
    const openDoc = snapshot.docs.find((d) => !d.data().checkOutTime);
    if (!openDoc) throw new Error("No open attendance record");
    const current = mapAttendance(openDoc.id, openDoc.data());
    const checkOutTime = checkoutNow.toTimeString().slice(0, 5);
    const workedHours = current.checkInTime
      ? calculateWorkedHours(current.checkInTime, checkOutTime)
      : 0;

    const expectedCheckoutTime =
      companySettings?.checkoutTimeRangeEnabled && companySettings?.checkoutStartTime
        ? companySettings.checkoutStartTime
        : (current.appliedShift?.endTime ?? null);
    const earlyCheckout = Boolean(expectedCheckoutTime && checkOutTime < expectedCheckoutTime);

    await updateDoc(openDoc.ref, {
      checkOutTime,
      status: "checked_out",
      checkOutStatus: "present",
      workedHours,
      expectedCheckoutTime,
      earlyCheckout,
    });
    return {
      ...current,
      checkOutTime,
      status: "checked_out",
      checkOutStatus: "present",
      workedHours,
      expectedCheckoutTime,
      earlyCheckout,
    };
  },
};
