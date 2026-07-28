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
  if (data["name"] && profile["name"] !== data["name"]) {
    updates["name"] = data["name"];
  }
  if (Object.keys(updates).length > 0) {
    Object.assign(profile, updates);
  }
  return { profile, updates };
}

export async function getFirebaseUserProfile(uid: string, email: string) {
  const database = requireDb();
  const authEmail = String(email ?? "")
    .trim()
    .toLowerCase();

  // A matching employee record is the source of truth for employee accounts.
  const employeeByUid = await getDocs(
    query(collection(database, "employees"), where("authUid", "==", uid), limit(1))
  );
  let employeeSnap = employeeByUid.empty ? null : employeeByUid.docs[0];

  if (!employeeSnap && authEmail) {
    const employeeByEmail = await getDocs(
      query(collection(database, "employees"), where("email", "==", authEmail), limit(1))
    );
    if (!employeeByEmail.empty) {
      employeeSnap = employeeByEmail.docs[0];
    }
  }

  if (employeeSnap) {
    const data = employeeSnap.data() as Record<string, unknown>;
    return {
      ...data,
      employee_id: employeeSnap.id,
      id: data.id ?? employeeSnap.id,
      name: data.name ?? "",
      email: authEmail,
      role: "employee",
      company_id: data.company_id ?? null,
      company_name: "",
      assigned_geofence_id: data.assigned_geofence_id ?? null,
    } as Record<string, unknown>;
  }

  const direct = await getDoc(doc(database, "users", uid));
  if (direct.exists()) {
    const profile = direct.data() as Record<string, unknown>;
    const resolved = await resolveEmployeeProfile(profile, database);
    if (resolved.updates && Object.keys(resolved.updates).length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateDoc(doc(database, "users", uid), resolved.updates as any).catch(() => undefined);
    }
    resolved.profile.email = authEmail;
    resolved.profile.role = resolved.profile.employee_id
      ? "employee"
      : resolved.profile.role === "employee"
        ? "employee"
        : "company";
    return resolved.profile;
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
