import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as crypto from "crypto";

const db = admin.firestore();
const messaging = admin.messaging();
const auth = admin.auth();

const FCM_BATCH_SIZE = 500;

function generatePassword(length = 12): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function requireCompanyAdmin(
  context: { auth?: { uid?: string } },
  companyId: string
): Promise<void> {
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required");
  }
  const userDoc = await db.collection("users").doc(uid).get();
  const userData = userDoc.data();
  if (
    !userData ||
    String(userData.company_id) !== String(companyId) ||
    userData.role !== "company"
  ) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only company admins can perform this action"
    );
  }
}

/**
 * Export attendance data as CSV for a given company and date range.
 */
export const exportAttendance = functions.https.onCall(async (data, context) => {
  const { companyId, startDate, endDate } = data as {
    companyId: string;
    startDate: string;
    endDate: string;
  };

  if (!companyId || !startDate || !endDate) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "companyId, startDate, and endDate are required"
    );
  }

  await requireCompanyAdmin(context, companyId);

  try {
    let snapshot: FirebaseFirestore.QuerySnapshot;

    try {
      // Fast path: composite index on (company_id, date) is available.
      snapshot = await db
        .collection("attendance")
        .where("company_id", "==", companyId)
        .where("date", ">=", startDate)
        .where("date", "<=", endDate)
        .orderBy("date", "desc")
        .get();
    } catch (indexErr) {
      const errMessage = String((indexErr as { message?: string }).message ?? indexErr);

      if (!errMessage.toLowerCase().includes("requires an index")) {
        throw indexErr;
      }

      functions.logger.warn(
        "[exportAttendance] missing composite index, falling back to in-memory filtering",
        { companyId, startDate, endDate, error: errMessage }
      );

      // Fallback: single-field query on company_id, then filter/sort in memory.
      snapshot = await db.collection("attendance").where("company_id", "==", companyId).get();
    }

    const filtered = snapshot.docs
      .map((doc) => doc.data())
      .filter((d) => typeof d.date === "string" && d.date >= startDate && d.date <= endDate)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));

    const headers = [
      "employeeName",
      "date",
      "checkInTime",
      "checkOutTime",
      "status",
      "lateMinutes",
      "workedHours",
      "geofenceName",
    ];

    const rows = filtered.map((d) => [
      d.employeeName ?? "",
      d.date ?? "",
      d.checkInTime ?? "",
      d.checkOutTime ?? "",
      d.status ?? "",
      String(d.lateMinutes ?? 0),
      String(d.workedHours ?? 0),
      d.geofenceName ?? "",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    return { success: true, data: { csv, count: filtered.length } };
  } catch (err) {
    functions.logger.error("[exportAttendance] failed:", err);
    const message = err instanceof Error ? err.message : String(err);
    throw new functions.https.HttpsError("internal", `Export failed: ${message}`);
  }
});

/**
 * Bulk create employees with Firebase Auth accounts in a single batch.
 */
export const bulkCreateEmployees = functions.https.onCall(async (data, context) => {
  const { companyId, employees } = data as {
    companyId: string;
    employees: Array<{
      name: string;
      email: string;
      phone?: string;
      department?: string;
      geofenceId?: string;
      employeeNumber?: string;
    }>;
  };

  if (!companyId || !Array.isArray(employees) || employees.length === 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "companyId and a non-empty employees array are required"
    );
  }

  await requireCompanyAdmin(context, companyId);

  const companyDoc = await db.collection("companies").doc(companyId).get();
  const companyName = companyDoc.data()?.name ?? "";
  const created: { id: string; email: string; password: string }[] = [];
  const failed: { email: string; reason: string }[] = [];

  for (const emp of employees) {
    const email = normalizeEmail(emp.email);
    const name = emp.name?.trim() || email.split("@")[0];

    if (!email || !email.includes("@")) {
      failed.push({ email: emp.email, reason: "Invalid email" });
      continue;
    }

    const password = generatePassword();
    const employeeRef = db.collection("employees").doc();
    const employeeId = employeeRef.id;

    try {
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: name,
      });

      const batch = db.batch();
      batch.set(employeeRef, {
        name,
        email,
        phone: emp.phone ?? "",
        department: emp.department ?? "",
        geofenceId: emp.geofenceId || null,
        employeeNumber: emp.employeeNumber ?? null,
        company_id: companyId,
        company_name: companyName,
        authUid: userRecord.uid,
        status: "active",
        currentLat: null,
        currentLng: null,
        lastSeen: null,
        batteryLevel: null,
        attendanceMode: null,
        shiftOverride: null,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });

      batch.set(db.collection("users").doc(userRecord.uid), {
        name,
        email,
        role: "employee",
        company_id: companyId,
        company_name: companyName,
        employee_id: employeeId,
        assigned_geofence_id: emp.geofenceId || null,
        attendanceMode: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await batch.commit();
      created.push({ id: employeeId, email, password });
    } catch (err) {
      functions.logger.error(`Failed to create employee ${email}:`, err);
      failed.push({ email, reason: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  return {
    success: true,
    data: { created, createdIds: created.map((c) => c.id), failed, count: created.length },
  };
});

/**
 * Send a notification to all employees of a company via FCM with token cleanup.
 */
export const sendCompanyNotification = functions.https.onCall(async (data, context) => {
  const { companyId, title, body, targetRole } = data as {
    companyId: string;
    title: string;
    body: string;
    targetRole?: "employee" | "company" | "all";
  };

  if (!companyId || !title?.trim() || !body?.trim()) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "companyId, title, and body are required"
    );
  }

  await requireCompanyAdmin(context, companyId);

  const role = targetRole ?? "employee";
  let tokensQuery: FirebaseFirestore.Query = db
    .collection("fcm_tokens")
    .where("company_id", "==", companyId);
  if (role !== "all") {
    tokensQuery = tokensQuery.where("role", "==", role);
  }
  const tokensSnapshot = await tokensQuery.get();

  if (tokensSnapshot.empty) {
    return { success: true, data: { sent: 0, failed: 0 } };
  }

  const allTokens = tokensSnapshot.docs
    .map((doc) => doc.data().token as string | undefined)
    .filter((t): t is string => typeof t === "string" && t.length > 0);

  let totalSent = 0;
  let totalFailed = 0;
  const tokensToDelete: FirebaseFirestore.DocumentReference[] = [];
  const basePayload = {
    notification: { title: title.trim(), body: body.trim() },
    data: {
      type: "company_announcement",
      company_id: companyId,
      click_action: "/",
    },
  };

  for (let i = 0; i < allTokens.length; i += FCM_BATCH_SIZE) {
    const chunk = allTokens.slice(i, i + FCM_BATCH_SIZE);
    try {
      const response = await messaging.sendEachForMulticast({ ...basePayload, tokens: chunk });
      totalSent += response.successCount;
      totalFailed += response.failureCount;

      response.responses.forEach((resp, idx) => {
        if (resp.error) {
          const code = (resp.error as { code?: string }).code ?? "";
          const shouldDelete =
            code.includes("invalid-registration-token") ||
            code.includes("registration-token-not-registered") ||
            code.includes("messaging/invalid-argument");
          if (shouldDelete) {
            const docId = tokensSnapshot.docs[i + idx]?.id;
            if (docId) tokensToDelete.push(db.collection("fcm_tokens").doc(docId));
          }
        }
      });
    } catch (err) {
      functions.logger.error("FCM batch send failed:", err);
      totalFailed += chunk.length;
    }
  }

  if (tokensToDelete.length > 0) {
    const cleanupBatch = db.batch();
    for (const ref of tokensToDelete) cleanupBatch.delete(ref);
    await cleanupBatch.commit();
  }

  return {
    success: true,
    data: { sent: totalSent, failed: totalFailed },
  };
});

async function requireMastermind(context: { auth?: { uid?: string } }): Promise<void> {
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required");
  }
  const userDoc = await db.collection("users").doc(uid).get();
  const userData = userDoc.data();
  if (!userData || userData.role !== "mastermind") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only Mastermind admins can perform this action"
    );
  }
}

export const createCompany = functions.https.onCall(async (data, context) => {
  const { name, industry, admin_email, admin_name, admin_password, plan, maxEmployees } = data as {
    name: string;
    industry?: string;
    admin_email: string;
    admin_name?: string;
    admin_password: string;
    plan?: string;
    maxEmployees?: number;
  };

  if (!name?.trim() || !admin_email?.trim() || !admin_password) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "name, admin_email, and admin_password are required"
    );
  }

  await requireMastermind(context);

  const email = normalizeEmail(admin_email);
  let userRecord;
  try {
    userRecord = await auth.createUser({
      email,
      password: admin_password,
      displayName: admin_name?.trim() || email.split("@")[0],
    });
  } catch (err: any) {
    if (err.code === "auth/email-already-exists") {
      throw new functions.https.HttpsError("already-exists", "Admin email already in use");
    }
    throw err;
  }

  const companyRef = db.collection("companies").doc();
  const companyId = companyRef.id;
  const adminName = admin_name?.trim() || email.split("@")[0];

  const batch = db.batch();
  batch.set(companyRef, {
    id: companyId,
    name: name.trim(),
    industry: industry?.trim() ?? "",
    plan: plan?.trim() ?? "trial",
    maxEmployees: maxEmployees ?? 10,
    active: true,
    ownerId: userRecord.uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  batch.set(db.collection("users").doc(userRecord.uid), {
    id: userRecord.uid,
    name: adminName,
    email,
    role: "company",
    company_id: companyId,
    company_name: name.trim(),
    company: { id: companyId, name: name.trim() },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return {
    success: true,
    data: { companyId, adminUid: userRecord.uid, email, adminPassword: admin_password },
  };
});

/**
 * Set a new password for an employee.
 */
export const setEmployeePassword = functions.https.onCall(async (data, context) => {
  const { employeeId, password } = data as { employeeId: string; password: string };

  if (!employeeId || !password || password.length < 8) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "employeeId and a password of at least 8 characters are required"
    );
  }

  const empDoc = await db.collection("employees").doc(employeeId).get();
  if (!empDoc.exists) {
    throw new functions.https.HttpsError("not-found", "Employee not found");
  }

  const empData = empDoc.data() as
    | { company_id?: string | number; authUid?: string; email?: string }
    | undefined;
  if (!empData || !empData.email) {
    throw new functions.https.HttpsError("not-found", "Employee data is incomplete");
  }

  await requireCompanyAdmin(context, String(empData.company_id ?? ""));

  let authUid = empData.authUid;
  if (!authUid) {
    try {
      const userRecord = await auth.getUserByEmail(empData.email);
      authUid = userRecord.uid;
    } catch {
      throw new functions.https.HttpsError("not-found", "No auth user for this employee");
    }
  }

  await auth.updateUser(authUid, { password });
  await db.collection("employees").doc(employeeId).update({ password });

  return { success: true, data: { employeeId } };
});
