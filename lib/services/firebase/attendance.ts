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
import { companiesApi } from "./companies";
import { employeesApi } from "./employees";
import { geofencesApi } from "./geofences";

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

    // Recompute status/late/worked from the latest company settings + employee + geofence,
    // so the dashboard and notifications always reflect the current rules rather than
    // whatever shift was cached on the record at check-in time.
    try {
      const [settingsRaw, employees, geofences] = await Promise.all([
        companiesApi.getSettings(),
        employeesApi.list(),
        geofencesApi.list(),
      ]);
      const settings = { ...defaultCompanySettings, ...(settingsRaw ?? {}) } as CompanySettings;
      const employeeMap = new Map(employees.map((e) => [String(e.id), e]));
      const geofenceMap = new Map(geofences.map((g) => [String(g.id), g]));

      records = records.map((record) => {
        if (!record.checkInTime) return record;

        const employee = employeeMap.get(record.employeeId) ?? {
          attendanceMode: record.attendanceMode,
          shiftOverride: null,
        };
        const geofence = record.geofenceId ? geofenceMap.get(record.geofenceId) : null;
        const recordDate = new Date(`${record.date}T${record.checkInTime}`);
        const { shift } = resolveEmployeeShift(
          employee,
          settings,
          recordDate,
          record.shiftSlot,
          geofence?.shifts ?? null
        );

        const evalResult = evaluateCheckIn(record.checkInTime, shift);
        const next: AttendanceRecord = {
          ...record,
          status: evalResult.status,
          lateMinutes: evalResult.lateMinutes,
          appliedShift: shift,
        };

        if (record.checkOutTime) {
          next.expectedCheckoutTime =
            settings.checkoutTimeRangeEnabled && settings.checkoutStartTime
              ? settings.checkoutStartTime
              : (shift.endTime ?? null);
          next.workedHours = calculateWorkedHours(record.checkInTime, record.checkOutTime);
          next.earlyCheckout = Boolean(
            next.expectedCheckoutTime && record.checkOutTime < next.expectedCheckoutTime
          );
        }

        return next;
      });
    } catch (err) {
      console.warn("[attendance.list] failed to recompute records:", err);
    }

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

    const requireGeofence = Boolean(settings.requireGeofenceForCheckIn);
    const allowOutside = Boolean(settings.allowCheckInOutsideGeofence);

    // Load employee to enforce the assigned geofence, falling back to payload data when offline.
    let employee: Employee | null = null;
    try {
      employee = await employeesApi.getById(payload.employeeId);
    } catch {
      employee = null;
    }
    const assignedGeofenceId = payload.employee?.geofenceId ?? employee?.geofenceId ?? null;
    const requestedGeofenceId = assignedGeofenceId ?? payload.geofenceId ?? null;

    let geofence: Geofence | null = null;
    if (requestedGeofenceId) {
      try {
        const geofenceDoc = await getDoc(
          doc(requireDb(), "geofences", String(requestedGeofenceId))
        );
        if (geofenceDoc.exists()) {
          const raw = geofenceDoc.data() as Record<string, unknown>;
          const candidate = mapGeofence(geofenceDoc.id, raw);
          if (
            candidate.active !== false &&
            String(raw.company_id ?? candidate.id) === String(companyId) &&
            (!assignedGeofenceId || String(candidate.id) === String(assignedGeofenceId))
          ) {
            geofence = candidate;
          }
        }
      } catch {
        // Geofence lookup failed
      }
    }

    if (!geofence && !assignedGeofenceId) {
      try {
        const companyGeofencesRaw = await queryByCompanyId(
          collection(requireDb(), "geofences"),
          [where("active", "==", true)],
          mapGeofence
        );
        const companyGeofences = companyGeofencesRaw.filter(
          (g) => Number.isFinite(g.radius) && g.radius > 0
        );
        geofence =
          companyGeofences.find(
            (g) =>
              calculateDistance(payload.lat, payload.lng, g.lat, g.lng) <=
              g.radius + GEOFENCE_DISTANCE_BUFFER_METERS + gpsAccuracy
          ) ?? null;
      } catch {
        // proceed without geofence
      }
    }

    if (geofence) {
      const dist = calculateDistance(payload.lat, payload.lng, geofence.lat, geofence.lng);
      const within = dist <= geofence.radius + GEOFENCE_DISTANCE_BUFFER_METERS + gpsAccuracy;
      if (!within && requireGeofence && !allowOutside) {
        throw new Error("Check-in location is outside the allowed geofence area");
      }
    } else if (requireGeofence && !allowOutside) {
      if (assignedGeofenceId) {
        throw new Error("Assigned geofence not found or inactive");
      }
      const activeSnap = await getDocs(
        query(
          collection(requireDb(), "geofences"),
          where("company_id", "==", companyId),
          where("active", "==", true),
          limit(50)
        )
      );
      const hasValid = activeSnap.docs.some((d) => {
        const r = d.get("radius") ?? d.get("radiusMeters");
        const n = typeof r === "number" ? r : Number(r);
        return Number.isFinite(n) && n > 0;
      });
      if (hasValid) {
        throw new Error("Check-in requires a geofence and none was provided");
      }
    }

    const now = payload.checkInTimestamp ? new Date(payload.checkInTimestamp) : new Date();
    const date = now.toLocaleDateString("sv-SE");
    const checkInTime = now.toTimeString().slice(0, 5);

    const { mode, shift, slot } = resolveEmployeeShift(
      employee ?? payload.employee ?? {},
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
        const record = mapAttendance(existingDoc.id, {
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
        return record;
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
