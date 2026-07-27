import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import type { LiveTrackingEmployee } from "@/lib/types/trackingTypes";
import { ensureAuth, requireCompanyId, requireDb, toNumber } from "./helpers";

function mapLocationDoc(id: string, data: Record<string, unknown>): LiveTrackingEmployee {
  return {
    id: String(data.employeeId ?? id),
    name: String(data.name ?? ""),
    lat: toNumber(data.lat),
    lng: toNumber(data.lng),
    status: (data.status as LiveTrackingEmployee["status"]) ?? "offline",
    geofenceName: (data.geofenceName as string | null | undefined) ?? null,
    lastSeen: String(data.lastSeen ?? ""),
    batteryLevel:
      data.batteryLevel === null || data.batteryLevel === undefined
        ? null
        : toNumber(data.batteryLevel),
  };
}

export const trackingApi = {
  async live(): Promise<LiveTrackingEmployee[]> {
    await ensureAuth();
    const companyId = requireCompanyId();
    const base = collection(requireDb(), "locations");
    const snapshot = await getDocs(query(base, where("company_id", "==", companyId), limit(500)));
    const items = snapshot.docs.map((item) =>
      mapLocationDoc(item.id, item.data() as Record<string, unknown>)
    );
    items.sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
    return items;
  },

  onSnapshotLive(
    onUpdate: (items: LiveTrackingEmployee[]) => void,
    onError: (error: Error) => void
  ): () => void {
    let unsub: (() => void) | null = null;

    (async () => {
      try {
        await ensureAuth();
        const companyId = requireCompanyId();
        const base = collection(requireDb(), "locations");
        const q = query(base, where("company_id", "==", companyId), limit(500));
        unsub = onSnapshot(
          q,
          (snapshot) => {
            const items = snapshot.docs.map((item) =>
              mapLocationDoc(item.id, item.data() as Record<string, unknown>)
            );
            items.sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
            onUpdate(items);
          },
          (error) => onError(error instanceof Error ? error : new Error(String(error)))
        );
      } catch (error) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    })();

    return () => {
      if (unsub) unsub();
    };
  },

  async update(employeeId: string, data: Record<string, unknown>): Promise<void> {
    const currentUser = await ensureAuth();
    await setDoc(
      doc(requireDb(), "locations", String(employeeId)),
      {
        ownerUid: currentUser.uid,
        company_id: requireCompanyId(),
        employeeId,
        ...data,
        lastSeen: new Date().toISOString(),
      },
      { merge: true }
    );
  },
};
