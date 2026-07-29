import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();
const messaging = admin.messaging();
const FCM_BATCH_SIZE = 500;

/**
 * Send FCM notification to admin tokens of a company.
 */
async function notifyAdmins(companyId: string, title: string, body: string): Promise<void> {
  if (!companyId || !title.trim() || !body.trim()) return;
  try {
    const tokensSnap = await db
      .collection("fcm_tokens")
      .where("company_id", "==", companyId)
      .where("role", "in", ["company", "mastermind"])
      .get();

    if (tokensSnap.empty) return;

    const tokens = tokensSnap.docs
      .map((doc) => doc.data().token as string | undefined)
      .filter((t): t is string => typeof t === "string" && t.length > 0);

    const basePayload = {
      notification: { title: title.trim(), body: body.trim() },
      data: { type: "attendance_alert", company_id: companyId, click_action: "/" },
    };

    const tokensToDelete: FirebaseFirestore.DocumentReference[] = [];
    for (let i = 0; i < tokens.length; i += FCM_BATCH_SIZE) {
      const chunk = tokens.slice(i, i + FCM_BATCH_SIZE);
      try {
        const response = await messaging.sendEachForMulticast({ ...basePayload, tokens: chunk });
        response.responses.forEach((resp, idx) => {
          if (resp.error) {
            const code = (resp.error as { code?: string }).code ?? "";
            if (
              code.includes("invalid-registration-token") ||
              code.includes("registration-token-not-registered") ||
              code.includes("messaging/invalid-argument")
            ) {
              const docId = tokensSnap.docs[i + idx]?.id;
              if (docId) tokensToDelete.push(db.collection("fcm_tokens").doc(docId));
            }
          }
        });
      } catch (err) {
        functions.logger.error("FCM admin notification batch failed:", err);
      }
    }

    if (tokensToDelete.length > 0) {
      const cleanup = db.batch();
      tokensToDelete.forEach((ref) => cleanup.delete(ref));
      await cleanup.commit();
    }
  } catch (err) {
    functions.logger.error(`Failed to notify admins for ${companyId}:`, err);
  }
}

/**
 * Validate attendance check-in against geofence, compute late minutes.
 * Also sends attendance / late alerts to admins if enabled in company settings.
 */
export const onAttendanceWritten = functions.firestore
  .document("attendance/{attendanceId}")
  .onWrite(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (!after) return; // Document deleted

    const attendanceId = context.params.attendanceId;
    const companyId = after.company_id;

    if (!companyId) return;

    const checkInTime = after.checkInTime;
    const isNewCheckIn = !before && !!checkInTime;
    const isManualCheckout = !!before && !before.checkOutTime && !!after.checkOutTime;

    try {
      // Fetch company settings once per invocation for alerts and backup late calculation.
      const settingsDoc = await db.collection("company_settings").doc(companyId).get();
      const settings = settingsDoc.data();

      // Backup late computation only if the client didn't set values
      // (e.g. legacy records or offline sync). Otherwise trust the client,
      // which already accounts for geofence-specific shifts and grace periods.
      const statusMissing = !after.status;
      const lateMissing = after.lateMinutes === undefined || after.lateMinutes === null;
      if (checkInTime && (statusMissing || lateMissing)) {
        const shiftStart = settings?.workStartTime ?? "08:00";
        const grace = Number(settings?.gracePeriodMinutes ?? 15);
        const threshold = Number(settings?.lateThresholdMinutes ?? 15);

        const [startH, startM] = String(shiftStart).split(":").map(Number);
        const [checkH, checkM] = String(checkInTime).split(":").map(Number);
        const startMinutes = startH * 60 + startM;
        const checkMinutes = checkH * 60 + checkM;
        const lateMinutes = Math.max(0, checkMinutes - startMinutes - grace);

        const update: Record<string, unknown> = { lateMinutes };
        if (statusMissing) {
          update.status = lateMinutes > threshold ? "late" : lateMinutes > 0 ? "late" : "present";
        }
        await db.collection("attendance").doc(attendanceId).update(update);
      }

      // Send admin alerts for new check-ins (not for auto check-outs)
      if (isNewCheckIn && !after.autoCheckedOut && settings?.notificationsEnabled) {
        const employeeName = after.employeeName || "موظف";
        const time = checkInTime || "";

        if (settings.attendanceAlertsEnabled) {
          await notifyAdmins(companyId, "تسجيل حضور", `${employeeName} سجل حضوراً عند ${time}`);
        }

        if (
          settings.lateAlertsEnabled &&
          (after.status === "late" || (after.lateMinutes ?? 0) > 0)
        ) {
          await notifyAdmins(
            companyId,
            "تأخر عن الحضور",
            `${employeeName} تأخر ${after.lateMinutes ?? 0} دقيقة`
          );
        }
      }

      // Send checkout confirmation to admins (skip auto-checkouts)
      if (
        isManualCheckout &&
        !after.autoCheckedOut &&
        settings?.notificationsEnabled &&
        settings?.attendanceAlertsEnabled
      ) {
        const employeeName = after.employeeName || "موظف";
        const time = after.checkOutTime || "";
        await notifyAdmins(companyId, "تسجيل انصراف", `${employeeName} سجل انصرافاً عند ${time}`);
      }
    } catch (err) {
      functions.logger.error(`Failed to process attendance ${attendanceId}:`, err);
    }
  });

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Detect geofence breaches from live location updates and alert admins.
 */
export const onLocationWritten = functions.firestore
  .document("locations/{locationId}")
  .onWrite(async (change, context) => {
    const after = change.after.data();
    if (!after) return; // Document deleted

    const before = change.before.data();
    const companyId = after.company_id;
    const employeeId = after.employeeId || context.params.locationId;
    if (!companyId || !employeeId) return;

    try {
      const settingsDoc = await db.collection("company_settings").doc(companyId).get();
      const settings = settingsDoc.data();
      if (!settings?.notificationsEnabled || !settings?.geofenceBreachAlertsEnabled) return;

      // Find the employee's assigned geofence from their user doc
      const userSnap = await db
        .collection("users")
        .where("employee_id", "==", employeeId)
        .limit(1)
        .get();
      if (userSnap.empty) return;
      const userData = userSnap.docs[0].data();
      const geofenceId = userData.assigned_geofence_id;
      if (!geofenceId) return;

      const geofenceDoc = await db.collection("geofences").doc(String(geofenceId)).get();
      if (!geofenceDoc.exists) return;
      const geofence = geofenceDoc.data()!;

      const lat = after.lat;
      const lng = after.lng;
      if (
        lat === undefined ||
        lng === undefined ||
        geofence.lat === undefined ||
        geofence.lng === undefined
      )
        return;
      const distance = calculateDistance(lat, lng, geofence.lat, geofence.lng);
      const isOutside = distance > (geofence.radius || 0);
      const wasOutside = before?.outsideGeofence === true;

      const locationRef = db.collection("locations").doc(context.params.locationId);
      if (isOutside && !wasOutside) {
        await locationRef.update({ outsideGeofence: true });
        await notifyAdmins(
          companyId,
          "خروج من النطاق الجغرافي",
          `${after.name || employeeId} خرج من ${geofence.name || "النطاق المخصص"}`
        );
      } else if (!isOutside && wasOutside) {
        await locationRef.update({ outsideGeofence: false });
      }
    } catch (err) {
      functions.logger.error(`Failed to process location ${context.params.locationId}:`, err);
    }
  });

/**
 * Sync auth custom claims when employee role changes.
 */
export const onEmployeeWritten = functions.firestore
  .document("employees/{employeeId}")
  .onWrite(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (!after) return; // Document deleted

    // Only act on role changes
    if (before && before.role === after.role) return;

    const employeeId = context.params.employeeId;

    try {
      // Find the auth user associated with this employee
      const users = await db
        .collection("users")
        .where("employee_id", "==", employeeId)
        .limit(1)
        .get();

      if (users.empty) return;

      const userDoc = users.docs[0];
      const role = after.role ?? "employee";

      // Update custom claims
      await admin.auth().setCustomUserClaims(userDoc.id, { role });

      // Update role in user profile
      await db.collection("users").doc(userDoc.id).update({ role });

      functions.logger.info(
        `Synced role "${role}" for employee ${employeeId} (user ${userDoc.id})`
      );
    } catch (err) {
      functions.logger.error(`Failed to sync role for employee ${employeeId}:`, err);
    }
  });

/**
 * Cascade delete all sub-collections when a company is deleted.
 */
export const onCompanyDeleted = functions.firestore
  .document("companies/{companyId}")
  .onDelete(async (snap, context) => {
    const companyId = context.params.companyId;

    const collections = ["employees", "geofences", "attendance", "locations", "company_settings"];

    for (const collectionName of collections) {
      const docs = await db.collection(collectionName).where("company_id", "==", companyId).get();

      const batch = db.batch();
      docs.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();

      functions.logger.info(
        `Deleted ${docs.size} documents from ${collectionName} for company ${companyId}`
      );
    }

    // Also clean up users assigned to this company
    const users = await db.collection("users").where("company_id", "==", companyId).get();

    const userBatch = db.batch();
    users.docs.forEach((doc) => {
      userBatch.update(doc.ref, {
        company_id: null,
        company_name: null,
        employee_id: null,
        assigned_geofence_id: null,
      });
    });
    await userBatch.commit();

    functions.logger.info(`Disassociated ${users.size} users from company ${companyId}`);
  });
