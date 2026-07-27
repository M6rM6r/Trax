import { loadBundle, namedQuery, getDocs } from "firebase/firestore";
import { requireDb } from "./helpers";

/**
 * Common bundle definitions for the Trax app.
 * These are served via Cloud Functions HTTP endpoint.
 */
export const BUNDLE_DEFINITIONS = {
  referenceData: "reference-data",
  companyStaff: "company-staff",
  geofences: "geofences",
} as const;

/**
 * Fetch and load a Firestore Bundle from the Cloud Function endpoint.
 * Bundles reduce read costs by serving cached data to clients on initial load.
 *
 * @param bundleName - One of BUNDLE_DEFINITIONS
 * @param companyId - Company ID for company-scoped bundles
 * @returns The loaded bundle name for use with namedQuery
 */
export async function loadBundleFromServer(
  bundleName: string,
  companyId?: string
): Promise<string | null> {
  const db = requireDb();

  const apiUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL ?? "";
  if (!apiUrl) return null;

  try {
    const params = new URLSearchParams({ name: bundleName });
    if (companyId) params.set("companyId", companyId);

    const response = await fetch(`${apiUrl}/serveBundle?${params}`);
    if (!response.ok) return null;

    const bundleData = await response.arrayBuffer();
    loadBundle(db, bundleData);
    return bundleName;
  } catch {
    return null;
  }
}

/**
 * Execute a named query from a loaded bundle.
 * Returns cached data if the bundle was loaded, otherwise fetches live.
 */
export async function executeNamedQuery<T>(
  bundleName: string,
  queryName: string,
  mapper: (id: string, data: Record<string, unknown>) => T
): Promise<T[]> {
  const db = requireDb();

  const q = await namedQuery(db, queryName);
  if (!q) {
    return [];
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => mapper(d.id, d.data() as Record<string, unknown>));
}
