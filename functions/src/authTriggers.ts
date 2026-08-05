import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * Auto-create Firestore profile document when a new user signs up.
 * Assigns default role and company association.
 */
export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  const email = user.email ?? "";
  const uid = user.uid;

  // Check if profile already exists (created by mastermind or register flow)
  const existing = await db.collection("users").doc(uid).get();
  if (existing.exists) {
    functions.logger.info(`User profile already exists for ${uid}, skipping auto-create`);
    return;
  }

  // Brief wait: client self-register / MasterMind createCompany often write the
  // authoritative users/{uid} doc right after Auth create. Avoid racing them with
  // a default employee profile (role/company_id are client-immutable under rules).
  await new Promise((r) => setTimeout(r, 2500));
  const again = await db.collection("users").doc(uid).get();
  if (again.exists) {
    functions.logger.info(`User profile appeared for ${uid} after wait, skipping auto-create`);
    return;
  }

  // Create minimal profile — company assignment happens during registration
  // merge:true so a late client write of company admin is not fully clobbered if both race.
  await db
    .collection("users")
    .doc(uid)
    .set(
      {
        name: user.displayName ?? email.split("@")[0] ?? "User",
        email: email.toLowerCase(),
        role: "employee",
        employee_id: null,
        assigned_geofence_id: null,
        company_id: null,
        company_name: null,
        permissions: [],
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        profile_image: "",
      },
      { merge: true }
    );

  functions.logger.info(`Created user profile for ${uid}`);
});

/**
 * Cascade cleanup when a user is deleted from Firebase Auth.
 * Archives their profile data and cleans up references.
 */
export const onUserDeleted = functions.auth.user().onDelete(async (user) => {
  const uid = user.uid;

  // Archive profile to deleted_users collection
  const profile = await db.collection("users").doc(uid).get();
  if (profile.exists) {
    await db
      .collection("deleted_users")
      .doc(uid)
      .set({
        ...profile.data(),
        deleted_at: admin.firestore.FieldValue.serverTimestamp(),
        deleted_reason: "auth_user_deleted",
      });
    await db.collection("users").doc(uid).delete();
  }

  // Clean up attendance records
  const attendance = await db.collection("attendance").where("ownerUid", "==", uid).get();
  const batch = db.batch();
  attendance.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();

  functions.logger.info(`Cleaned up user ${uid}`);
});
