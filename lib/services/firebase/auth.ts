import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { requireDb } from "./helpers";

async function resolveEmployeeProfile(
  profile: Record<string, unknown>,
  database: ReturnType<typeof requireDb>
) {
  const employeeId = (profile.employee_id ?? profile.employeeId) as string | number | undefined;
  if (!employeeId) return { profile, updates: {} as Record<string, unknown> };
  const employeeDoc = await getDoc(doc(database, "employees", String(employeeId)));
  if (!employeeDoc.exists()) return { profile, updates: {} as Record<string, unknown> };
  const data = employeeDoc.data() as Record<string, unknown>;
  const updates: Record<string, unknown> = {};
  if (profile["company_id"] === null || profile["company_id"] === undefined) {
    if (data["company_id"] !== null && data["company_id"] !== undefined) {
      updates["company_id"] = data["company_id"];
    }
  }
  if (
    (profile["assigned_geofence_id"] === null || profile["assigned_geofence_id"] === undefined) &&
    data["assigned_geofence_id"] !== null &&
    data["assigned_geofence_id"] !== undefined
  ) {
    updates["assigned_geofence_id"] = data["assigned_geofence_id"];
  }
  if (
    (profile["name"] === null || profile["name"] === undefined || profile["name"] === "") &&
    data["name"]
  ) {
    updates["name"] = data["name"];
  }
  if (Object.keys(updates).length > 0) {
    Object.assign(profile, updates);
  }
  return { profile, updates };
}

export async function getFirebaseUserProfile(uid: string, email: string) {
  const database = requireDb();
  const direct = await getDoc(doc(database, "users", uid));
  if (direct.exists()) {
    const profile = direct.data() as Record<string, unknown>;
    const resolved = await resolveEmployeeProfile(profile, database);
    if (resolved.updates && Object.keys(resolved.updates).length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateDoc(doc(database, "users", uid), resolved.updates as any).catch(() => undefined);
    }
    return resolved.profile;
  }

  const normalizedEmail = String(email ?? "")
    .trim()
    .toLowerCase();
  if (normalizedEmail) {
    const byEmail = await getDocs(
      query(collection(database, "users"), where("email", "==", normalizedEmail), limit(1))
    );
    if (!byEmail.empty) {
      const profile = byEmail.docs[0].data() as Record<string, unknown>;
      const resolved = await resolveEmployeeProfile(profile, database);
      const userDocId = byEmail.docs[0].id;
      if (resolved.updates && Object.keys(resolved.updates).length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateDoc(doc(database, "users", userDocId), resolved.updates as any).catch(
          () => undefined
        );
      }
      return resolved.profile;
    }
  }

  const employeeByUid = await getDocs(
    query(collection(database, "employees"), where("authUid", "==", uid), limit(1))
  );
  if (!employeeByUid.empty) {
    const doc = employeeByUid.docs[0];
    const data = doc.data() as Record<string, unknown>;
    return {
      ...data,
      employee_id: doc.id,
      id: data.id ?? doc.id,
      name: data.name ?? "",
      email: data.email ?? email ?? "",
      role: data.role ?? "employee",
      company_id: data.company_id ?? null,
      company_name: "",
      assigned_geofence_id: data.assigned_geofence_id ?? null,
    } as Record<string, unknown>;
  }

  if (normalizedEmail) {
    const employeeByEmail = await getDocs(
      query(collection(database, "employees"), where("email", "==", normalizedEmail), limit(1))
    );
    if (!employeeByEmail.empty) {
      const doc = employeeByEmail.docs[0];
      const data = doc.data() as Record<string, unknown>;
      return {
        ...data,
        employee_id: doc.id,
        id: data.id ?? doc.id,
        name: data.name ?? "",
        email: data.email ?? email ?? "",
        role: data.role ?? "employee",
        company_id: data.company_id ?? null,
        company_name: "",
        assigned_geofence_id: data.assigned_geofence_id ?? null,
      } as Record<string, unknown>;
    }
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
