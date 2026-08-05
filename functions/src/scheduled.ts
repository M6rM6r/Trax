import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { createNotification } from "./notifications";

const db = admin.firestore();
const messaging = admin.messaging();
const FCM_BATCH_SIZE = 500;

function getTimeInTimezone(timezone: string): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
}

/** YYYY-MM-DD in company timezone — never UTC server day. */
function getDateInTimezone(timezone: string, value: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone || "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function hoursBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let diff = eh * 60 + em - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60;
  return Number((diff / 60).toFixed(2));
}

async function sendToEmployeeTokens(companyId: string, title: string, body: string): Promise<void> {
  if (!companyId || !title.trim() || !body.trim()) return;
  try {
    const tokensSnap = await db
      .collection("fcm_tokens")
      .where("company_id", "==", companyId)
      .where("role", "==", "employee")
      .get();
    if (tokensSnap.empty) return;

    const tokens = tokensSnap.docs
      .map((doc) => doc.data().token as string | undefined)
      .filter((t): t is string => typeof t === "string" && t.length > 0);

    const basePayload = {
      notification: { title: title.trim(), body: body.trim() },
      data: { type: "check_in_reminder", company_id: companyId, click_action: "/check-in" },
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
        functions.logger.error("FCM reminder batch failed:", err);
      }
    }

    if (tokensToDelete.length > 0) {
      const cleanup = db.batch();
      tokensToDelete.forEach((ref) => cleanup.delete(ref));
      await cleanup.commit();
    }
  } catch (err) {
    functions.logger.error(`Failed to send reminders for ${companyId}:`, err);
  }
}

/**
 * Daily attendance summary — runs at 22:00 every day.
 * Aggregates today's attendance stats per company and stores in a summary doc.
 */
export const dailyAttendanceSummary = functions.pubsub
  .schedule("every day 22:00")
  .timeZone("Asia/Riyadh")
  .onRun(async () => {
    // Schedule is Asia/Riyadh — bucket attendance by Riyadh calendar day, not UTC.
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Riyadh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

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
        else if (data.status === "checked_out") {
          if ((data.lateMinutes ?? 0) > 0) late++;
          else present++;
        } else if (data.status === "absent") absent++;
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

      // Notify admins about the daily summary
      const companyName = companyDoc.data()?.name ?? "";
      await createNotification({
        companyId,
        targetRole: "company",
        type: "system",
        title: "تقرير الحضور اليومي",
        message: `${companyName ? companyName + " — " : ""}الحضور: ${present}، التأخير: ${late}، الغياب: ${absent} من ${total} موظف`,
        data: {
          date: today,
          total: String(total),
          present: String(present),
          late: String(late),
          absent: String(absent),
        },
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

/**
 * Auto checkout employees who are still checked-in past their company's auto-sign-out time.
 * Runs every 15 minutes in each company's configured timezone.
 */
export const autoCheckoutEmployees = functions.pubsub
  .schedule("every 15 minutes")
  .onRun(async () => {
    const settingsSnap = await db
      .collection("company_settings")
      .where("autoSignOutEnabled", "==", true)
      .get();

    for (const doc of settingsSnap.docs) {
      const settings = doc.data();
      const companyId = doc.id;
      const timezone = settings.timezone || "Asia/Riyadh";
      const autoSignOutTime = settings.autoSignOutTime;
      if (!autoSignOutTime) continue;

      const currentTime = getTimeInTimezone(timezone);
      if (currentTime < autoSignOutTime) continue;

      // Attendance rows are keyed by company-local calendar day.
      const today = getDateInTimezone(timezone);

      const openRecords = await db
        .collection("attendance")
        .where("company_id", "==", companyId)
        .where("date", "==", today)
        .where("checkOutTime", "==", null)
        .where("autoCheckedOut", "==", false)
        .get();

      const batch = db.batch();
      let count = 0;
      for (const record of openRecords.docs) {
        const data = record.data();
        const checkInTime = data.checkInTime;
        if (!checkInTime || checkInTime > autoSignOutTime) continue;
        const workedHours = hoursBetween(checkInTime, autoSignOutTime);
        batch.update(record.ref, {
          checkOutTime: autoSignOutTime,
          status: "checked_out",
          checkOutStatus: "present",
          workedHours,
          autoCheckedOut: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        count++;
        if (count % 500 === 0) {
          await batch.commit();
        }
      }
      if (count % 500 !== 0) {
        await batch.commit();
      }
      functions.logger.info(`Auto checked out ${count} employees for ${companyId}`);
    }
  });

/**
 * Send check-in reminders to employees at the configured reminder time.
 * Runs every 15 minutes in each company's configured timezone.
 */
export const checkInReminders = functions.pubsub.schedule("every 15 minutes").onRun(async () => {
  const settingsSnap = await db
    .collection("company_settings")
    .where("notificationsEnabled", "==", true)
    .where("checkInReminderEnabled", "==", true)
    .get();

  for (const doc of settingsSnap.docs) {
    const settings = doc.data();
    const companyId = doc.id;
    const timezone = settings.timezone || "Asia/Riyadh";
    const reminderTime = settings.checkInReminderTime;
    if (!reminderTime) continue;

    const currentTime = getTimeInTimezone(timezone);
    // Match within a 15-minute window so we don't miss the exact minute.
    if (currentTime < reminderTime || currentTime > addMinutes(reminderTime, 15)) continue;

    await sendToEmployeeTokens(companyId, "تذكير الحضور", "حان وقت تسجيل الحضور");
    await createNotification({
      companyId,
      targetRole: "employee",
      type: "reminder",
      title: "تذكير الحضور",
      message: "حان وقت تسجيل الحضور",
      data: { time: currentTime },
    });
    functions.logger.info(`Sent check-in reminders for ${companyId}`);
  }
});

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
