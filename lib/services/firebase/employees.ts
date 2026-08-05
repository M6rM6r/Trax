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
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    const companyId = getCompanyId();
    // Defense in depth: never return another tenant's employee even if rules slip.
    if (
      companyId &&
      data.company_id !== null &&
      data.company_id !== undefined &&
      String(data.company_id) !== String(companyId)
    ) {
      return null;
    }
    return mapEmployee(snapshot.id, data);
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

      // Never persist plaintext passwords in Firestore. Auth credentials live in Firebase Auth only.
      const assignedGeofence = employee.geofenceId ?? null;
      const reference = await addDoc(collection(database, "employees"), {
        ...employeeData,
        geofenceId: assignedGeofence,
        assigned_geofence_id: assignedGeofence,
        ...(authUser ? { authUid: authUser.uid } : {}),
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

      return mapEmployee(reference.id, { ...employeeData, id: reference.id });
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

  async update(id: string, employee: Partial<Employee> & { password?: string }): Promise<void> {
    await ensureAuth();
    const database = requireDb();
    // Never write credentials into employee documents.
    const { password: _password, ...rest } = employee as Partial<Employee> & { password?: string };
    void _password;

    const payload = cleanPayload({ ...rest }) as Record<string, unknown>;
    // Dual-write assignment fields so check-in + auth profile stay aligned.
    if ("geofenceId" in rest || "assigned_geofence_id" in (rest as object)) {
      const assigned =
        rest.geofenceId !== undefined
          ? (rest.geofenceId ?? null)
          : ((rest as { assigned_geofence_id?: string | null }).assigned_geofence_id ?? null);
      payload.geofenceId = assigned;
      payload.assigned_geofence_id = assigned;
    }
    delete payload.password;

    await updateDoc(
      doc(database, "employees", String(id)),
      payload as {
        [key: string]: import("firebase/firestore").FieldValue | Partial<unknown> | undefined;
      }
    );

    // Keep linked user profile geofence in sync when assignment changes.
    if ("geofenceId" in rest || "assigned_geofence_id" in (rest as object)) {
      try {
        const snap = await getDoc(doc(database, "employees", String(id)));
        const authUid = snap.exists() ? (snap.data().authUid as string | undefined) : undefined;
        if (authUid) {
          const assigned = (payload.geofenceId as string | null | undefined) ?? null;
          await updateDoc(doc(database, "users", authUid), {
            assigned_geofence_id: assigned,
            ...(rest.attendanceMode !== undefined
              ? { attendanceMode: rest.attendanceMode ?? null }
              : {}),
          });
        }
      } catch {
        // Non-fatal: employee doc is source of truth for check-in server path.
      }
    }
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
