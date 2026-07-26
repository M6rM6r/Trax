import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * Export attendance data as CSV for a given company and date range.
 */
export const exportAttendance = functions.https.onCall(async (request) => {
  const { companyId, startDate, endDate } = request.data as {
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

  // Verify caller belongs to this company
  if (request.auth?.uid) {
    const userDoc = await db.collection("users").doc(request.auth.uid).get();
    const userCompanyId = userDoc.data()?.company_id;
    if (userCompanyId !== companyId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "You do not have access to this company's data"
      );
    }
  }

  const attendance = await db
    .collection("attendance")
    .where("company_id", "==", companyId)
    .where("date", ">=", startDate)
    .where("date", "<=", endDate)
    .orderBy("date", "desc")
    .get();

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

  const rows = attendance.docs.map((doc) => {
    const d = doc.data();
    return [
      d.employeeName ?? "",
      d.date ?? "",
      d.checkInTime ?? "",
      d.checkOutTime ?? "",
      d.status ?? "",
      String(d.lateMinutes ?? 0),
      String(d.workedHours ?? 0),
      d.geofenceName ?? "",
    ];
  });

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return { success: true, data: { csv, count: attendance.size } };
});

/**
 * Bulk create employees in a single transaction.
 */
export const bulkCreateEmployees = functions.https.onCall(async (request) => {
  const { companyId, employees } = request.data as {
    companyId: string;
    employees: Array<{
      name: string;
      email: string;
      phone?: string;
      department?: string;
      role?: string;
      geofenceId?: string;
      employeeNumber?: string;
    }>;
  };

  if (!companyId || !employees?.length) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "companyId and employees array are required"
    );
  }

  // Verify caller belongs to this company
  if (request.auth?.uid) {
    const userDoc = await db.collection("users").doc(request.auth.uid).get();
    const userCompanyId = userDoc.data()?.company_id;
    if (userCompanyId !== companyId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "You do not have access to this company"
      );
    }
  }

  const batch = db.batch();
  const created: string[] = [];

  for (const emp of employees) {
    const ref = db.collection("employees").doc();
    batch.set(ref, {
      name: emp.name,
      email: emp.email.toLowerCase(),
      phone: emp.phone ?? "",
      department: emp.department ?? "",
      role: emp.role ?? "employee",
      geofenceId: emp.geofenceId ?? null,
      employeeNumber: emp.employeeNumber ?? null,
      company_id: companyId,
      status: "active",
      currentLat: null,
      currentLng: null,
      lastSeen: null,
      batteryLevel: null,
      attendanceMode: null,
      shiftOverride: null,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    created.push(ref.id);
  }

  await batch.commit();

  return { success: true, data: { created, count: created.length } };
});

/**
 * Send a notification to all employees of a company via FCM.
 */
export const sendCompanyNotification = functions.https.onCall(async (request) => {
  const { companyId, title, body } = request.data as {
    companyId: string;
    title: string;
    body: string;
  };

  if (!companyId || !title || !body) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "companyId, title, and body are required"
    );
  }

  // Verify caller is a manager of this company
  if (request.auth?.uid) {
    const userDoc = await db.collection("users").doc(request.auth.uid).get();
    const userData = userDoc.data();
    if (
      userData?.company_id !== companyId ||
      !["boss", "manager", "supervisor"].includes(userData?.role)
    ) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only managers can send company notifications"
      );
    }
  }

  // Get all FCM tokens for this company's employees
  const tokens = await db.collection("fcm_tokens").where("company_id", "==", companyId).get();

  if (tokens.empty) {
    return { success: true, data: { sent: 0 } };
  }

  const tokenList = tokens.docs.map((doc) => doc.data().token as string);

  // Send via FCM
  const message = {
    notification: { title, body },
    data: {
      type: "company_announcement",
      company_id: companyId,
    },
    tokens: tokenList,
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    return {
      success: true,
      data: {
        sent: response.successCount,
        failed: response.failureCount,
      },
    };
  } catch (err) {
    functions.logger.error("FCM send failed:", err);
    throw new functions.https.HttpsError("internal", "Failed to send notifications");
  }
});
