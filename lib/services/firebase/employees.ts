import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth, secondaryAuth } from "@/lib/config/firebase";
import type { Employee } from "@/lib/types/trackingTypes";
import { ensureAuth, getCompanyId, requireCompanyId, requireDb, cleanPayload, mapEmployee } from "./helpers";

export const employeesApi = {
  async list(): Promise<Employee[]> {
    try { await ensureAuth(); } catch { return []; }
    const companyId = getCompanyId();
    if (!companyId) return [];
    const base = collection(requireDb(), "employees");
    const snapshot = await getDocs(query(base, where("company_id", "==", companyId)));
    const employees = snapshot.docs.map((item) => mapEmployee(item.id, item.data()));
    employees.sort((a, b) => a.name.localeCompare(b.name));
    return employees;
  },

  async getById(id: string): Promise<Employee | null> {
    await ensureAuth();
    const snapshot = await getDoc(doc(requireDb(), "employees", String(id)));
    return snapshot.exists() ? mapEmployee(snapshot.id, snapshot.data()) : null;
  },

  async create(employee: Omit<Employee, "id"> & { password?: string }): Promise<Employee> {
    await ensureAuth();
    const { password, ...employeeData } = employee;
    let authUid: string | null = null;

    if (password && secondaryAuth) {
      const cred = await createUserWithEmailAndPassword(secondaryAuth, employee.email, password);
      authUid = cred.user.uid;
    }

    const reference = await addDoc(collection(requireDb(), "employees"), {
      ...employeeData,
      ...(authUid ? { authUid } : {}),
      company_id: requireCompanyId(),
      createdAt: serverTimestamp(),
    });
    const employeeDocId = reference.id;

    if (authUid) {
      await setDoc(doc(requireDb(), "users", authUid), {
        name: employee.name,
        email: employee.email,
        role: employee.role ?? "employee",
        company_id: requireCompanyId(),
        employee_id: employeeDocId,
        assigned_geofence_id: employee.geofenceId ?? null,
        attendanceMode: employee.attendanceMode ?? null,
        createdAt: serverTimestamp(),
      });
    }

    return mapEmployee(reference.id, { ...employeeData, id: reference.id });
  },

  async update(id: string, employee: Partial<Employee>): Promise<void> {
    await ensureAuth();
    await updateDoc(doc(requireDb(), "employees", String(id)), cleanPayload(employee));
  },

  async delete(id: string): Promise<void> {
    await ensureAuth();
    await deleteDoc(doc(requireDb(), "employees", String(id)));
  },

  async resetPassword(email: string): Promise<void> {
    if (!auth) throw new Error("Firebase Auth not configured");
    await sendPasswordResetEmail(auth, email);
  },
};
