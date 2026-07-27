/**
 * One-time migration script: rename `companyId` → `company_id` on existing
 * Firestore documents in the `attendance` and `locations` collections.
 *
 * Usage:
 *   node scripts/migrate-company-id-field.js
 *
 * Requires FIREBASE_SERVICE_ACCOUNT env var or service account key file.
 */
const admin = require("firebase-admin");

// Try to use service account from env, otherwise use application default credentials
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

if (serviceAccount) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} else {
  admin.initializeApp();
}

const db = admin.firestore();
const BATCH_SIZE = 400;

async function migrateCollection(collectionName) {
  console.log(`\nMigrating collection: ${collectionName}`);
  const snapshot = await db.collection(collectionName).get();
  console.log(`  Found ${snapshot.size} documents`);

  let migrated = 0;
  let skipped = 0;
  let batch = db.batch();
  let batchCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    // Skip if already has company_id or doesn't have companyId
    if (data.company_id !== undefined) {
      skipped++;
      continue;
    }
    if (data.companyId === undefined || data.companyId === null) {
      skipped++;
      continue;
    }

    // Copy companyId → company_id and delete the old field
    batch.update(doc.ref, {
      company_id: data.companyId,
      companyId: admin.firestore.FieldValue.delete(),
    });
    batchCount++;
    migrated++;

    if (batchCount >= BATCH_SIZE) {
      await batch.commit();
      console.log(`  Committed batch of ${batchCount}`);
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
    console.log(`  Committed final batch of ${batchCount}`);
  }

  console.log(`  Done: ${migrated} migrated, ${skipped} skipped`);
  return migrated;
}

async function main() {
  console.log("Starting field migration: companyId → company_id");

  const totalMigrated =
    (await migrateCollection("attendance")) +
    (await migrateCollection("locations"));

  console.log(`\nMigration complete. Total documents migrated: ${totalMigrated}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
