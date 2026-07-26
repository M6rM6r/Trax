import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * HTTP endpoint to serve Firestore bundles.
 * Clients fetch this on app load to get cached reference data,
 * reducing Firestore read costs.
 *
 * Usage: GET /serveBundle?name=reference-data&companyId=xxx
 */
export const serveBundle = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.set("Cache-Control", "public, max-age=3600, s-maxage=3600");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  const bundleName = req.query.name as string;
  const companyId = req.query.companyId as string;

  if (!bundleName) {
    res.status(400).send("Missing bundle name");
    return;
  }

  try {
    const bundleBuffer = db.bundle(bundleName);

    const namedQueries: Record<string, admin.firestore.Query> = {};

    if (bundleName === "reference-data") {
      if (companyId) {
        namedQueries["geofences"] = db
          .collection("geofences")
          .where("company_id", "==", companyId)
          .limit(50);

        namedQueries["employees"] = db
          .collection("employees")
          .where("company_id", "==", companyId)
          .limit(500);
      }
    } else if (bundleName === "company-staff" && companyId) {
      namedQueries["employees"] = db
        .collection("employees")
        .where("company_id", "==", companyId)
        .limit(500);

      namedQueries["users"] = db
        .collection("users")
        .where("company_id", "==", companyId)
        .limit(100);
    } else if (bundleName === "geofences" && companyId) {
      namedQueries["geofences"] = db
        .collection("geofences")
        .where("company_id", "==", companyId)
        .limit(50);
    }

    const snapshotPromises = Object.entries(namedQueries).map(async ([name, q]) => {
      const snap = await q.get();
      return { name, snap };
    });

    const snapshots = await Promise.all(snapshotPromises);

    // Build bundle
    for (const { name, snap } of snapshots) {
      bundleBuffer.add(name, snap);
    }

    const bundleData = bundleBuffer.build();
    res.set("Content-Type", "application/octet-stream");
    res.status(200).send(Buffer.from(bundleData));
  } catch (err) {
    functions.logger.error("Bundle generation failed:", err);
    res.status(500).send("Failed to generate bundle");
  }
});
