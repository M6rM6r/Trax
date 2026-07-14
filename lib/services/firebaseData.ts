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
import { auth, db } from "@/lib/config/firebase";
import type {
  AttendanceRecord,
  Employee,
  Geofence,
  LiveTrackingEmployee,
} from "@/lib/types/trackingTypes";

function requireDb() {
  if (!db) throw new Error("Firebase Firestore is not configured");
  return db;
}

function toNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function mapEmployee(id: string, value: Record<string, unknown>): Employee {
  return {
    id: Number(value.id ?? id),
    name: String(value.name ?? ""),
    email: String(value.email ?? ""),
    phone: String(value.phone ?? ""),
    role: (value.role as Employee["role"]) ?? "employee",
    department: String(value.department ?? ""),
    avatar: (value.avatar as string | null | undefined) ?? null,
    geofenceId:
      value.geofenceId === null || value.geofenceId === undefined
        ? null
        : toNumber(value.geofenceId),
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
  };
}

function mapGeofence(id: string, value: Record<string, unknown>): Geofence {
  return {
    id: Number(value.id ?? id),
    name: String(value.name ?? ""),
    address: String(value.address ?? ""),
    lat: toNumber(value.lat),
    lng: toNumber(value.lng),
    radius: toNumber(value.radius),
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
    id: Number(value.id ?? id),
    employeeId: toNumber(value.employeeId),
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
        : toNumber(value.geofenceId),
    geofenceName: (value.geofenceName as string | null | undefined) ?? null,
    lateMinutes: toNumber(value.lateMinutes),
    workedHours: toNumber(value.workedHours),
    checkOutStatus: (value.checkOutStatus as AttendanceRecord["checkOutStatus"]) ?? null,
  };
}

export async function getFirebaseUserProfile(uid: string, email: string) {
  const database = requireDb();
  const direct = await getDoc(doc(database, "users", uid));
  if (direct.exists()) return direct.data();

  const byEmail = await getDocs(
    query(collection(database, "users"), where("email", "==", email), limit(1))
  );
  return byEmail.empty ? null : byEmail.docs[0].data();
}

export const firebaseData = {
  employees: {
    async list(): Promise<Employee[]> {
      const snapshot = await getDocs(query(collection(requireDb(), "employees"), orderBy("name")));
      return snapshot.docs.map((item) => mapEmployee(item.id, item.data()));
    },
    async getById(id: number): Promise<Employee | null> {
      const snapshot = await getDoc(doc(requireDb(), "employees", String(id)));
      return snapshot.exists() ? mapEmployee(snapshot.id, snapshot.data()) : null;
    },
    async create(employee: Omit<Employee, "id">): Promise<Employee> {
      const reference = await addDoc(collection(requireDb(), "employees"), {
        ...employee,
        createdAt: serverTimestamp(),
      });
      return mapEmployee(reference.id, { ...employee, id: reference.id });
    },
    async update(id: number, employee: Partial<Employee>): Promise<void> {
      await updateDoc(doc(requireDb(), "employees", String(id)), employee);
    },
    async delete(id: number): Promise<void> {
      await deleteDoc(doc(requireDb(), "employees", String(id)));
    },
  },
  geofences: {
    async list(): Promise<Geofence[]> {
      const snapshot = await getDocs(
        query(collection(requireDb(), "geofences"), where("active", "==", true))
      );
      return snapshot.docs.map((item) => mapGeofence(item.id, item.data()));
    },
    async create(geofence: Omit<Geofence, "id">): Promise<Geofence> {
      const reference = await addDoc(collection(requireDb(), "geofences"), {
        ...geofence,
        createdAt: serverTimestamp(),
      });
      return mapGeofence(reference.id, { ...geofence, id: reference.id });
    },
    async update(id: number, geofence: Partial<Geofence>): Promise<void> {
      await updateDoc(doc(requireDb(), "geofences", String(id)), geofence);
    },
    async delete(id: number): Promise<void> {
      await updateDoc(doc(requireDb(), "geofences", String(id)), { active: false });
    },
  },
  attendance: {
    async list(employeeId?: number): Promise<AttendanceRecord[]> {
      const base = collection(requireDb(), "attendance");
      const attendanceQuery =
        employeeId === null || employeeId === undefined
          ? query(base, orderBy("date", "desc"), limit(500))
          : query(base, where("employeeId", "==", employeeId), orderBy("date", "desc"), limit(500));
      const snapshot = await getDocs(attendanceQuery);
      return snapshot.docs.map((item) => mapAttendance(item.id, item.data()));
    },
    async checkIn(payload: {
      employeeId: number;
      lat: number;
      lng: number;
      geofenceId: number;
    }): Promise<AttendanceRecord> {
      const geofenceSnapshot = await getDoc(
        doc(requireDb(), "geofences", String(payload.geofenceId))
      );
      const geofence = geofenceSnapshot.exists()
        ? mapGeofence(geofenceSnapshot.id, geofenceSnapshot.data())
        : null;
      const now = new Date();
      const date = now.toISOString().slice(0, 10);
      const checkInTime = now.toTimeString().slice(0, 5);
      const reference = doc(collection(requireDb(), "attendance"));
      const record = {
        id: reference.id,
        ownerUid: auth?.currentUser?.uid ?? "",
        employeeId: payload.employeeId,
        employeeName: auth?.currentUser?.displayName ?? auth?.currentUser?.email ?? "",
        date,
        checkInTime,
        checkOutTime: null,
        status: "present",
        checkInLat: payload.lat,
        checkInLng: payload.lng,
        checkOutLat: null,
        checkOutLng: null,
        geofenceId: payload.geofenceId,
        geofenceName: geofence?.name ?? null,
        lateMinutes: 0,
        workedHours: 0,
        checkOutStatus: null,
        createdAt: serverTimestamp(),
      } satisfies Record<string, unknown>;
      await setDoc(reference, record);
      return mapAttendance(reference.id, record);
    },
    async checkOut(employeeId: number): Promise<AttendanceRecord> {
      const today = new Date().toISOString().slice(0, 10);
      const snapshot = await getDocs(
        query(
          collection(requireDb(), "attendance"),
          where("employeeId", "==", employeeId),
          where("date", "==", today),
          where("checkOutTime", "==", null),
          limit(1)
        )
      );
      if (snapshot.empty) throw new Error("No open attendance record");
      const item = snapshot.docs[0];
      const current = mapAttendance(item.id, item.data());
      const checkOutTime = new Date().toTimeString().slice(0, 5);
      await updateDoc(item.ref, { checkOutTime, status: "checked_out", checkOutStatus: "present" });
      return { ...current, checkOutTime, status: "checked_out", checkOutStatus: "present" };
    },
  },
  dashboard: {
    async stats(): Promise<{
      totalEmployees: number;
      activeEmployees: number;
      inactiveEmployees: number;
      presentToday: number;
      absentToday: number;
      lateToday: number;
      checkedOutToday: number;
      onTimeRate: number;
      avgCheckInTime: string;
      avgWorkedHours: number;
      totalGeofences: number;
    }> {
      const [employees, attendance, geofences] = await Promise.all([
        firebaseData.employees.list(),
        firebaseData.attendance.list(),
        firebaseData.geofences.list(),
      ]);
      const today = new Date().toISOString().slice(0, 10);
      const todayRecords = attendance.filter((record) => record.date === today);
      const presentToday = todayRecords.filter((record) => record.status === "present").length;
      const lateToday = todayRecords.filter((record) => record.status === "late").length;
      const checkedOutToday = todayRecords.filter(
        (record) => record.status === "checked_out"
      ).length;
      const worked = todayRecords.map((record) => record.workedHours).filter((hours) => hours > 0);
      const punctualBase = presentToday + lateToday;
      return {
        totalEmployees: employees.length,
        activeEmployees: employees.filter((employee) => employee.status === "active").length,
        inactiveEmployees: employees.filter((employee) => employee.status === "inactive").length,
        presentToday,
        absentToday: Math.max(0, employees.length - todayRecords.length),
        lateToday,
        checkedOutToday,
        onTimeRate: punctualBase > 0 ? Number(((presentToday / punctualBase) * 100).toFixed(1)) : 0,
        avgCheckInTime: todayRecords[0]?.checkInTime ?? "N/A",
        avgWorkedHours:
          worked.length > 0
            ? Number((worked.reduce((sum, hours) => sum + hours, 0) / worked.length).toFixed(1))
            : 0,
        totalGeofences: geofences.length,
      };
    },
  },
  tracking: {
    async live(): Promise<LiveTrackingEmployee[]> {
      const snapshot = await getDocs(
        query(collection(requireDb(), "locations"), orderBy("lastSeen", "desc"), limit(500))
      );
      return snapshot.docs.map((item) => ({
        id: toNumber(item.data().employeeId ?? item.id),
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
    async update(employeeId: number, data: Record<string, unknown>): Promise<void> {
      await setDoc(
        doc(requireDb(), "locations", String(employeeId)),
        {
          ownerUid: auth?.currentUser?.uid ?? "",
          employeeId,
          ...data,
          lastSeen: new Date().toISOString(),
        },
        { merge: true }
      );
    },
  },
};
