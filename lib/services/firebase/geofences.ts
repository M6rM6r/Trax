import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import type { Geofence } from "@/lib/types/trackingTypes";
import { ensureAuth, getCompanyId, requireCompanyId, requireDb, cleanPayload, mapGeofence } from "./helpers";

export const geofencesApi = {
  async list(): Promise<Geofence[]> {
    try { await ensureAuth(); } catch { return []; }
    const companyId = getCompanyId();
    if (!companyId) return [];
    const base = collection(requireDb(), "geofences");
    const snapshot = await getDocs(query(base, where("company_id", "==", companyId)));
    return snapshot.docs
      .map((item) => mapGeofence(item.id, item.data()))
      .filter(
        (geofence) =>
          geofence.active &&
          geofence.lat >= -90 &&
          geofence.lat <= 90 &&
          geofence.lng >= -180 &&
          geofence.lng <= 180
      );
  },

  async create(geofence: Omit<Geofence, "id">): Promise<Geofence> {
    await ensureAuth();
    const reference = await addDoc(collection(requireDb(), "geofences"), {
      ...geofence,
      company_id: requireCompanyId(),
      createdAt: serverTimestamp(),
    });
    return mapGeofence(reference.id, { ...geofence, id: reference.id });
  },

  async update(id: string, geofence: Partial<Geofence>): Promise<void> {
    await ensureAuth();
    await updateDoc(doc(requireDb(), "geofences", String(id)), cleanPayload(geofence));
  },

  async delete(id: string): Promise<void> {
    await ensureAuth();
    await updateDoc(doc(requireDb(), "geofences", String(id)), { active: false });
  },
};
