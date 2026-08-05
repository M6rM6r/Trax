import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { cleanPayload, requireDb } from "./helpers";

function normalizeId(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (!s || s === "null" || s === "undefined") return null;
  return s;
}

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
      updates["company_id"] = String(data["company_id"]);
    }
  }
  const empFence = data["assigned_geofence_id"] ?? data["geofenceId"] ?? data["geofence_id"];
  if (
    (profile["assigned_geofence_id"] === null || profile["assigned_geofence_id"] === undefined) &&
    empFence !== null &&
    empFence !== undefined
  ) {
    updates["assigned_geofence_id"] = String(empFence);
  }
  if (data["name"] && profile["name"] !== data["name"]) {
    updates["name"] = data["name"];
  }
  if (Object.keys(updates).length > 0) {
    Object.assign(profile, updates);
  }
  return { profile, updates };
}

function profileFromEmployeeSnap(
  employeeSnap: { id: string; data: () => Record<string, unknown> },
  authEmail: string
): Record<string, unknown> {
  const data = employeeSnap.data();
  const companyId = normalizeId(data.company_id);
  const assignedGeofence = normalizeId(
    data.assigned_geofence_id ?? data.geofenceId ?? data.geofence_id
  );
  return {
    ...data,
    employee_id: employeeSnap.id,
    id: data.id ?? employeeSnap.id,
    name: data.name ?? "",
    email: authEmail,
    role: "employee",
    company_id: companyId,
    company_name: "",
    assigned_geofence_id: assignedGeofence,
  };
}

function backfillUserFromEmployee(
  database: ReturnType<typeof requireDb>,
  uid: string,
  employeeSnap: { id: string; data: () => Record<string, unknown> },
  authEmail: string
) {
  const data = employeeSnap.data();
  const companyId = normalizeId(data.company_id);
  const assignedGeofence = normalizeId(
    data.assigned_geofence_id ?? data.geofenceId ?? data.geofence_id
  );
  void setDoc(
    doc(database, "users", uid),
    cleanPayload({
      employee_id: employeeSnap.id,
      company_id: companyId,
      assigned_geofence_id: assignedGeofence,
      name: data.name ?? "",
      email: authEmail,
      role: "employee",
    }),
    { merge: true }
  ).catch(() => undefined);
}

/**
 * Resolve Trax profile.
 * 1) users/{uid} wins for company + mastermind
 * 2) employees by authUid for staff
 * 3) employees by email only when user doc is missing
 */
export async function getFirebaseUserProfile(uid: string, email: string) {
  const database = requireDb();
  const authEmail = String(email ?? "")
    .trim()
    .toLowerCase();

  const direct = await getDoc(doc(database, "users", uid));
  if (direct.exists()) {
    const raw = direct.data() as Record<string, unknown>;
    const storedRole = String(raw.role ?? "")
      .trim()
      .toLowerCase();

    if (storedRole === "company" || storedRole === "mastermind") {
      return {
        ...raw,
        email: authEmail || String(raw.email ?? ""),
        role: storedRole,
        company_id: normalizeId(
          raw.company_id ?? (raw.company as { id?: unknown } | undefined)?.id
        ),
        employee_id: normalizeId(raw.employee_id),
      } as Record<string, unknown>;
    }

    if (storedRole === "employee" || raw.employee_id) {
      const resolved = await resolveEmployeeProfile({ ...raw }, database);
      if (resolved.updates && Object.keys(resolved.updates).length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateDoc(doc(database, "users", uid), resolved.updates as any).catch(() => undefined);
      }
      resolved.profile.email = authEmail || String(resolved.profile.email ?? "");
      resolved.profile.role = "employee";
      resolved.profile.company_id = normalizeId(resolved.profile.company_id);
      resolved.profile.employee_id = normalizeId(
        resolved.profile.employee_id ?? resolved.profile.employeeId
      );
      return resolved.profile;
    }

    const byUid = await getDocs(
      query(collection(database, "employees"), where("authUid", "==", uid), limit(1))
    );
    if (!byUid.empty) {
      const snap = byUid.docs[0];
      backfillUserFromEmployee(database, uid, snap, authEmail);
      return profileFromEmployeeSnap(snap, authEmail);
    }

    return {
      ...raw,
      email: authEmail || String(raw.email ?? ""),
      role: storedRole || "company",
      company_id: normalizeId(raw.company_id ?? (raw.company as { id?: unknown } | undefined)?.id),
    } as Record<string, unknown>;
  }

  const employeeByUid = await getDocs(
    query(collection(database, "employees"), where("authUid", "==", uid), limit(1))
  );
  if (!employeeByUid.empty) {
    const snap = employeeByUid.docs[0];
    backfillUserFromEmployee(database, uid, snap, authEmail);
    return profileFromEmployeeSnap(snap, authEmail);
  }

  if (authEmail) {
    const employeeByEmail = await getDocs(
      query(collection(database, "employees"), where("email", "==", authEmail), limit(1))
    );
    if (!employeeByEmail.empty) {
      const snap = employeeByEmail.docs[0];
      backfillUserFromEmployee(database, uid, snap, authEmail);
      return profileFromEmployeeSnap(snap, authEmail);
    }
  }

  return null;
}
