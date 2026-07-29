import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import type { Geofence } from "@/lib/types/trackingTypes";
import {
  ensureAuth,
  getCompanyId,
  requireCompanyId,
  requireDb,
  cleanPayload,
  mapGeofence,
  queryByCompanyId,
} from "./helpers";

export const geofencesApi = {
  async list(): Promise<Geofence[]> {
    try {
      await ensureAuth();
    } catch {
      return [];
    }
    const companyId = getCompanyId();
    if (!companyId) return [];
    const geofences = await queryByCompanyId(collection(requireDb(), "geofences"), [], mapGeofence);
    return geofences.filter(
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
      ...cleanPayload(geofence as Record<string, unknown>),
      company_id: requireCompanyId(),
      createdAt: serverTimestamp(),
    });
    return mapGeofence(reference.id, { ...geofence, id: reference.id });
  },

  async update(id: string, geofence: Partial<Geofence>): Promise<void> {
    await ensureAuth();
    await updateDoc(
      doc(requireDb(), "geofences", String(id)),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cleanPayload(geofence as Record<string, unknown>) as any
    );
  },

  async delete(id: string): Promise<void> {
    await ensureAuth();
    await updateDoc(doc(requireDb(), "geofences", String(id)), { active: false });
  },
};
