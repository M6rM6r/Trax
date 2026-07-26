import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * Daily attendance summary — runs at 22:00 every day.
 * Aggregates today's attendance stats per company and stores in a summary doc.
 */
export const dailyAttendanceSummary = functions.pubsub
  .schedule("every day 22:00")
  .timeZone("Asia/Riyadh")
  .onRun(async () => {
    const today = new Date().toISOString().split("T")[0];

    // Get all active companies
    const companies = await db.collection("companies").where("active", "==", true).get();

    const batch = db.batch();

    for (const companyDoc of companies.docs) {
      const companyId = companyDoc.id;

      // Query today's attendance for this company
      const attendance = await db
        .collection("attendance")
        .where("company_id", "==", companyId)
        .where("date", "==", today)
        .get();

      const total = attendance.size;
      let present = 0;
      let late = 0;
      let absent = 0;

      attendance.docs.forEach((doc) => {
        const data = doc.data();
        if (data.status === "present") present++;
        else if (data.status === "late") late++;
        else if (data.status === "absent") absent++;
      });

      // Store daily summary
      const summaryRef = db.collection("attendance_summaries").doc(`${companyId}_${today}`);
      batch.set(summaryRef, {
        company_id: companyId,
        date: today,
        total,
        present,
        late,
        absent,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
    functions.logger.info(`Daily attendance summary completed for ${companies.size} companies`);
  });

/**
 * Trial expiry check — runs daily at midnight.
 * Auto-disables companies whose trial has ended.
 */
export const checkTrialExpiry = functions.pubsub
  .schedule("every day 00:00")
  .timeZone("Asia/Riyadh")
  .onRun(async () => {
    const now = new Date().toISOString();

    const expiredTrials = await db
      .collection("companies")
      .where("plan", "==", "trial")
      .where("active", "==", true)
      .where("trial_ends_at", "<=", now)
      .get();

    const batch = db.batch();
    expiredTrials.docs.forEach((doc) => {
      batch.update(doc.ref, {
        active: false,
        deactivated_reason: "trial_expired",
        deactivated_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();

    functions.logger.info(`Deactivated ${expiredTrials.size} expired trials`);
  });

/**
 * Cleanup stale location data — runs every hour.
 * Deletes location documents older than 24 hours.
 */
export const cleanupStaleLocations = functions.pubsub
  .schedule("every 60 minutes")
  .onRun(async () => {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const stale = await db
      .collection("locations")
      .where("lastSeen", "<=", cutoff.toISOString())
      .limit(500)
      .get();

    const batch = db.batch();
    stale.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    functions.logger.info(`Cleaned up ${stale.size} stale location records`);
  });
