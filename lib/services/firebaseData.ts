import {
  addDoc,
  collection,
  deleteDoc,
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
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth, db, secondaryAuth } from "@/lib/config/firebase";
import type {
  AttendanceRecord,
  Employee,
  Geofence,
  LiveTrackingEmployee,
} from "@/lib/types/trackingTypes";
import type { DashboardTrendsSchema } from "@/lib/schemas/dashboard.schema";
import { resolveEmployeeShift, evaluateCheckIn, calculateWorkedHours } from "@/lib/utils/shifts";
import { defaultCompanySettings } from "@/lib/types/companySettings";

function requireDb() {
  if (!db) throw new Error("Firebase Firestore is not configured");
  return db;
}

async function ensureAuth(): Promise<User> {
  if (!auth) throw new Error("Firebase Auth is not configured");
  if (auth.currentUser) return auth.currentUser;
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth!, (user) => {
      unsubscribe();
      if (user) resolve(user);
      else reject(new Error("AUTH_EXPIRED"));
    });
  });
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function mapEmployee(id: string, value: Record<string, unknown>): Employee {
  return {
    id: (value.id as string | number | undefined) ?? id,
    name: String(value.name ?? ""),
    email: String(value.email ?? ""),
    phone: String(value.phone ?? ""),
    role: (value.role as Employee["role"]) ?? "employee",
    department: String(value.department ?? ""),
    avatar: (value.avatar as string | null | undefined) ?? null,
    geofenceId:
      value.geofenceId === null || value.geofenceId === undefined
        ? null
        : (value.geofenceId as string | number),
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
    attendanceMode: (value.attendanceMode as Employee["attendanceMode"]) ?? null,
    shiftOverride: (value.shiftOverride as Employee["shiftOverride"]) ?? null,
  };
}

function mapGeofence(id: string, value: Record<string, unknown>): Geofence {
  return {
    id: (value.id as string | number | undefined) ?? id,
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

function mapAttendance(id: string, value: Record<string, unknown>): AttendanceRecord {
  return {
    id: (value.id as string | number | undefined) ?? id,
    employeeId: (value.employeeId as string | number | undefined) ?? "",
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
      value.geofenceId === null || value.geofenceId === undefined
        ? null
        : (value.geofenceId as string | number),
    geofenceName: (value.geofenceName as string | null | undefined) ?? null,
    lateMinutes: toNumber(value.lateMinutes),
    workedHours: toNumber(value.workedHours),
    checkOutStatus: (value.checkOutStatus as AttendanceRecord["checkOutStatus"]) ?? null,
    attendanceMode: (value.attendanceMode as AttendanceRecord["attendanceMode"]) ?? null,
    appliedShift: (value.appliedShift as AttendanceRecord["appliedShift"]) ?? null,
    shiftSlot: (value.shiftSlot as AttendanceRecord["shiftSlot"]) ?? null,
  };
}

export async function getFirebaseUserProfile(uid: string, email: string) {
  const database = requireDb();
  const direct = await getDoc(doc(database, "users", uid));
  if (direct.exists()) return direct.data();

  const normalizedEmail = String(email ?? "")
    .trim()
    .toLowerCase();
  if (normalizedEmail) {
    const byEmail = await getDocs(
      query(collection(database, "users"), where("email", "==", email), limit(1))
    );
    if (!byEmail.empty) return byEmail.docs[0].data();

    // Fallback for case-mismatched email or alternate storage formats.
    const allUsers = await getDocs(collection(database, "users"));
    const matched = allUsers.docs.find((item) => {
      const userEmail = String(item.data().email ?? "")
        .trim()
        .toLowerCase();
      return userEmail === normalizedEmail;
    });
    if (matched) return matched.data();
  }

  return null;
}

export async function getFirebaseUserProfileFromApi(idToken: string) {
  if (!idToken || typeof window === "undefined") return null;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
  try {
    const response = await fetch(`${apiUrl.replace(/\/$/, "")}/auth/firebase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_token: idToken }),
    });

    if (!response.ok) return null;
    const payload = await response.json();
    if (!payload?.success || !payload?.data?.user) return null;

    return {
      ...payload.data.user,
      company_name: payload.data.company?.name ?? payload.data.user.company_name,
    };
  } catch {
    return null;
  }
}

export const firebaseData = {
  employees: {
    async list(): Promise<Employee[]> {
      await ensureAuth();
      const snapshot = await getDocs(query(collection(requireDb(), "employees"), orderBy("name")));
      return snapshot.docs.map((item) => mapEmployee(item.id, item.data()));
    },
    async getById(id: string | number): Promise<Employee | null> {
      await ensureAuth();
      const snapshot = await getDoc(doc(requireDb(), "employees", String(id)));
      return snapshot.exists() ? mapEmployee(snapshot.id, snapshot.data()) : null;
    },
    async create(employee: Omit<Employee, "id"> & { password?: string }): Promise<Employee> {
      await ensureAuth();
      const { password, ...employeeData } = employee;
      let authUid: string | null = null;

      if (password && secondaryAuth) {
        // Use secondary app instance so creating the employee doesn't sign out the admin
        const cred = await createUserWithEmailAndPassword(secondaryAuth, employee.email, password);
        authUid = cred.user.uid;
      }

      const reference = await addDoc(collection(requireDb(), "employees"), {
        ...employeeData,
        ...(authUid ? { authUid } : {}),
        createdAt: serverTimestamp(),
      });
      const employeeDocId = reference.id;

      if (authUid) {
        await setDoc(doc(requireDb(), "users", authUid), {
          name: employee.name,
          email: employee.email,
          role: employee.role ?? "employee",
          company_id: (employee as Record<string, unknown>).company_id ?? 1,
          employee_id: employeeDocId,
          assigned_geofence_id: employee.geofenceId ?? null,
          attendanceMode: employee.attendanceMode ?? null,
          createdAt: serverTimestamp(),
        });
      }

      return mapEmployee(reference.id, { ...employeeData, id: reference.id });
    },
    async update(id: string | number, employee: Partial<Employee>): Promise<void> {
      await ensureAuth();
      await updateDoc(doc(requireDb(), "employees", String(id)), employee);
    },
    async delete(id: string | number): Promise<void> {
      await ensureAuth();
      await deleteDoc(doc(requireDb(), "employees", String(id)));
    },
    async resetPassword(email: string): Promise<void> {
      if (!auth) throw new Error("Firebase Auth not configured");
      await sendPasswordResetEmail(auth, email);
    },
  },
  geofences: {
    async list(): Promise<Geofence[]> {
      await ensureAuth();
      const snapshot = await getDocs(collection(requireDb(), "geofences"));
      return snapshot.docs
        .map((item) => mapGeofence(item.id, item.data()))
        .filter(
          (geofence) =>
            geofence.active &&
            geofence.lat >= -90 &&
            geofence.lat <= 90 &&
            geofence.lng >= -180 &&
            geofence.lng <= 180
        );
    },
    async create(geofence: Omit<Geofence, "id">): Promise<Geofence> {
      await ensureAuth();
      const reference = await addDoc(collection(requireDb(), "geofences"), {
        ...geofence,
        createdAt: serverTimestamp(),
      });
      return mapGeofence(reference.id, { ...geofence, id: reference.id });
    },
    async update(id: string | number, geofence: Partial<Geofence>): Promise<void> {
      await ensureAuth();
      await updateDoc(doc(requireDb(), "geofences", String(id)), geofence);
    },
    async delete(id: string | number): Promise<void> {
      await ensureAuth();
      await updateDoc(doc(requireDb(), "geofences", String(id)), { active: false });
    },
  },
  attendance: {
    async list(employeeId?: string | number): Promise<AttendanceRecord[]> {
      await ensureAuth();
      const base = collection(requireDb(), "attendance");
      const attendanceQuery =
        employeeId === null || employeeId === undefined
          ? query(base, orderBy("date", "desc"), limit(500))
          : query(base, where("employeeId", "==", employeeId), orderBy("date", "desc"), limit(500));
      const snapshot = await getDocs(attendanceQuery);
      return snapshot.docs.map((item) => mapAttendance(item.id, item.data()));
    },
    async checkIn(payload: {
      employeeId: string | number;
      employeeName?: string;
      lat: number;
      lng: number;
      geofenceId: string | number;
      companySettings?: Record<string, unknown>;
      employee?: Pick<Employee, "attendanceMode" | "shiftOverride"> | null;
    }): Promise<AttendanceRecord> {
      const currentUser = await ensureAuth();
      let geofence: Geofence | null = null;
      try {
        const geofenceDoc = await getDoc(doc(requireDb(), "geofences", String(payload.geofenceId)));
        if (geofenceDoc.exists()) {
          geofence = mapGeofence(geofenceDoc.id, geofenceDoc.data());
        }
      } catch {
        // Geofence lookup failed — proceed without geofence name
      }

      // Resolve company settings with safe defaults
      const settings = {
        ...defaultCompanySettings,
        ...(payload.companySettings ?? {}),
      };

      const now = new Date();
      const date = now.toLocaleDateString("sv-SE"); // YYYY-MM-DD in local timezone
      const checkInTime = now.toTimeString().slice(0, 5);

      const { mode, shift, slot } = resolveEmployeeShift(
        payload.employee ?? {},
        settings as typeof defaultCompanySettings,
        now,
        null
      );
      const { status, lateMinutes } = evaluateCheckIn(checkInTime, shift);

      const reference = doc(collection(requireDb(), "attendance"));
      const record = {
        id: reference.id,
        ownerUid: currentUser.uid,
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
    async checkOut(employeeId: string | number): Promise<AttendanceRecord> {
      await ensureAuth();
      const today = new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD in local timezone
      const snapshot = await getDocs(
        query(
          collection(requireDb(), "attendance"),
          where("employeeId", "==", employeeId),
          where("date", "==", today),
          where("checkOutTime", "==", null),
          limit(1)
        )
      );
      const openDoc = snapshot.docs[0];
      if (!openDoc) throw new Error("No open attendance record");
      const item = openDoc;
      const current = mapAttendance(item.id, item.data());
      const checkOutTime = new Date().toTimeString().slice(0, 5);
      const workedHours = current.checkInTime
        ? calculateWorkedHours(current.checkInTime, checkOutTime)
        : 0;
      await updateDoc(item.ref, {
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
  },
  dashboard: {
    async getDashboardData(): Promise<{
      stats: import("@/lib/types/trackingTypes").DashboardStats;
      trends: DashboardTrendsSchema;
    }> {
      const [employees, attendance, geofences] = await Promise.all([
        firebaseData.employees.list(),
        firebaseData.attendance.list(),
        firebaseData.geofences.list(),
      ]);
      const today = new Date();
      const todayStr = today.toLocaleDateString("sv-SE");
      const todayRecords = attendance.filter((record) => record.date === todayStr);
      const presentToday = todayRecords.filter(
        (record) => record.status === "present" || record.status === "checked_out"
      ).length;
      const lateToday = todayRecords.filter((record) => record.status === "late").length;
      const checkedOutToday = todayRecords.filter(
        (record) => record.status === "checked_out"
      ).length;
      const worked = todayRecords.map((record) => record.workedHours).filter((hours) => hours > 0);
      const punctualBase = presentToday + lateToday;
      const checkInTimes = todayRecords
        .map((r) => r.checkInTime)
        .filter((t): t is string => t !== null && t !== undefined)
        .sort();
      const medianCheckIn =
        checkInTimes.length > 0 ? checkInTimes[Math.floor(checkInTimes.length / 2)] : "N/A";

      const stats = {
        totalEmployees: employees.length,
        activeEmployees: employees.filter((employee) => employee.status === "active").length,
        inactiveEmployees: employees.filter((employee) => employee.status === "inactive").length,
        presentToday,
        absentToday: Math.max(0, employees.length - todayRecords.length),
        lateToday,
        checkedOutToday,
        onTimeRate: punctualBase > 0 ? Number(((presentToday / punctualBase) * 100).toFixed(1)) : 0,
        avgCheckInTime: medianCheckIn,
        avgWorkedHours:
          worked.length > 0
            ? Number((worked.reduce((sum, hours) => sum + hours, 0) / worked.length).toFixed(1))
            : 0,
        totalGeofences: geofences.length,
        // Shift/seasonal breakdown
        fieldToday: todayRecords.filter((r) => r.attendanceMode === "field").length,
        officeToday: todayRecords.filter((r) => r.attendanceMode === "office_two_shift").length,
        hourlyToday: todayRecords.filter((r) => r.attendanceMode === "hourly").length,
      };

      const dayNames = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
      const weeklyData: {
        day: string;
        present: number;
        late: number;
        absent: number;
        avgWorkedHours: number;
      }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString("sv-SE");
        const dayRecords = attendance.filter((r) => r.date === dateStr);
        const present = dayRecords.filter(
          (r) => r.status === "present" || r.status === "checked_out"
        ).length;
        const late = dayRecords.filter((r) => r.status === "late").length;
        const absent = Math.max(0, employees.length - dayRecords.length);
        const dayWorked = dayRecords.map((r) => r.workedHours).filter((h) => h > 0);
        weeklyData.push({
          day: dayNames[d.getDay()],
          present,
          late,
          absent,
          avgWorkedHours:
            dayWorked.length > 0
              ? Number((dayWorked.reduce((s, h) => s + h, 0) / dayWorked.length).toFixed(1))
              : 0,
        });
      }
      const peakHoursData: { hour: string; count: number }[] = [];
      for (let h = 6; h <= 19; h++) {
        const count = attendance.filter((r) => {
          const checkInHour = parseInt(r.checkInTime?.split(":")[0] ?? "0", 10);
          return checkInHour === h;
        }).length;
        const label = h < 12 ? `${h}ص` : `${h - 12 === 0 ? 12 : h - 12}م`;
        peakHoursData.push({ hour: label, count });
      }

      const trends: DashboardTrendsSchema = {
        weeklyData,
        peakHoursData,
        employeeGrowth: 0,
        presentChange: 0,
        lateChange: 0,
        absentChange: 0,
        onTimeRateChange: 0,
      };

      return { stats, trends };
    },
  },
  tracking: {
    async live(): Promise<LiveTrackingEmployee[]> {
      await ensureAuth();
      const snapshot = await getDocs(
        query(collection(requireDb(), "locations"), orderBy("lastSeen", "desc"), limit(500))
      );
      return snapshot.docs.map((item) => ({
        id: (item.data().employeeId ?? item.id) as string | number,
        name: String(item.data().name ?? ""),
        lat: toNumber(item.data().lat),
        lng: toNumber(item.data().lng),
        status: (item.data().status as LiveTrackingEmployee["status"]) ?? "offline",
        geofenceName: (item.data().geofenceName as string | null | undefined) ?? null,
        lastSeen: String(item.data().lastSeen ?? ""),
        batteryLevel:
          item.data().batteryLevel === null || item.data().batteryLevel === undefined
            ? null
            : toNumber(item.data().batteryLevel),
      }));
    },
    async update(employeeId: string | number, data: Record<string, unknown>): Promise<void> {
      const currentUser = await ensureAuth();
      await setDoc(
        doc(requireDb(), "locations", String(employeeId)),
        {
          ownerUid: currentUser.uid,
          employeeId,
          ...data,
          lastSeen: new Date().toISOString(),
        },
        { merge: true }
      );
    },
  },
  companies: {
    async list(): Promise<{ id: string; name: string; plan: string; industry: string }[]> {
      await ensureAuth();
      const snapshot = await getDocs(collection(requireDb(), "companies"));
      return snapshot.docs.map((item) => ({
        id: item.id,
        name: String(item.data().name ?? ""),
        plan: String(item.data().plan ?? "trial"),
        industry: String(item.data().industry ?? ""),
      }));
    },
    async register(data: {
      company_name: string;
      industry: string;
      admin_name: string;
      admin_email: string;
      admin_password: string;
    }): Promise<{ companyId: string; uid: string }> {
      throw new Error(
        "Company self-registration is disabled. Please contact MasterMind to create your company."
      );
    },
    async getSettings(): Promise<Record<string, unknown> | null> {
      const user = await ensureAuth();
      const ref = doc(requireDb(), "company_settings", user.uid);
      const snapshot = await getDoc(ref);
      return snapshot.exists() ? snapshot.data() : null;
    },
    async saveSettings(settings: Record<string, unknown>): Promise<void> {
      const user = await ensureAuth();
      const ref = doc(requireDb(), "company_settings", user.uid);
      await setDoc(ref, { ...settings, updatedAt: serverTimestamp() }, { merge: true });
    },
  },
};
