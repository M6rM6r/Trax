import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * Validate attendance check-in against geofence, compute late minutes.
 */
export const onAttendanceWritten = functions.firestore
  .document("attendance/{attendanceId}")
  .onWrite(async (change, context) => {
    const after = change.after.data();
    if (!after) return; // Document deleted

    const attendanceId = context.params.attendanceId;

    // Only process new check-ins (no check-out time yet)
    if (after.checkOutTime) return;

    // Compute late minutes if check-in time is after shift start
    const checkInTime = after.checkInTime;
    const companyId = after.company_id;

    if (!checkInTime || !companyId) return;

    try {
      // Get company settings for shift start time
      const settingsDoc = await db.collection("company_settings").doc(companyId).get();
      const settings = settingsDoc.data();
      const shiftStart = settings?.shift_start ?? "09:00";

      const [startH, startM] = shiftStart.split(":").map(Number);
      const [checkH, checkM] = checkInTime.split(":").map(Number);
      const startMinutes = startH * 60 + startM;
      const checkMinutes = checkH * 60 + checkM;
      const lateMinutes = Math.max(0, checkMinutes - startMinutes);

      if (lateMinutes > 0) {
        await db
          .collection("attendance")
          .doc(attendanceId)
          .update({
            lateMinutes,
            status: lateMinutes > 15 ? "late" : "present",
          });
      }
    } catch (err) {
      functions.logger.error(`Failed to process attendance ${attendanceId}:`, err);
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
