import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  sendPasswordResetEmail,
  type User,
} from "firebase/auth";
import { auth, secondaryAuth } from "@/lib/config/firebase";
import type { Employee } from "@/lib/types/trackingTypes";
import {
  ensureAuth,
  getCompanyId,
  requireCompanyId,
  requireDb,
  cleanPayload,
  mapEmployee,
  queryByCompanyId,
} from "./helpers";

export const employeesApi = {
  async list(): Promise<Employee[]> {
    try {
      await ensureAuth();
    } catch {
      return [];
    }
    const companyId = getCompanyId();
    if (!companyId) return [];
    const base = collection(requireDb(), "employees");
    const employees = await queryByCompanyId(base, [], mapEmployee);
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
    const database = requireDb();
    const companyId = requireCompanyId();
    const { password, ...employeeData } = employee;
    let authUser: User | null = null;
    let employeeDocId: string | null = null;

    try {
      if (password && secondaryAuth) {
        const credential = await createUserWithEmailAndPassword(
          secondaryAuth,
          employee.email,
          password
        );
        authUser = credential.user;
      }

      const reference = await addDoc(collection(database, "employees"), {
        ...employeeData,
        ...(authUser ? { authUid: authUser.uid } : {}),
        ...(password ? { password } : {}),
        company_id: companyId,
        createdAt: serverTimestamp(),
      });
      employeeDocId = reference.id;

      if (authUser) {
        await setDoc(doc(database, "users", authUser.uid), {
          name: employee.name,
          email: employee.email,
          role: "employee",
          company_id: companyId,
          employee_id: employeeDocId,
          assigned_geofence_id: employee.geofenceId ?? null,
          attendanceMode: employee.attendanceMode ?? null,
          createdAt: serverTimestamp(),
        });
      }

      return mapEmployee(reference.id, { ...employeeData, password, id: reference.id });
    } catch (error) {
      if (employeeDocId) {
        await deleteDoc(doc(database, "employees", employeeDocId)).catch(() => undefined);
      }
      if (authUser) {
        await deleteUser(authUser).catch(() => undefined);
      }
      throw error;
    }
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
