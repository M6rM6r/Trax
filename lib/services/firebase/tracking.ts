import { collection, doc, getDocs, limit, query, setDoc, where } from "firebase/firestore";
import type { LiveTrackingEmployee } from "@/lib/types/trackingTypes";
import { ensureAuth, requireCompanyId, requireDb, toNumber } from "./helpers";

export const trackingApi = {
  async live(): Promise<LiveTrackingEmployee[]> {
    await ensureAuth();
    const companyId = requireCompanyId();
    const base = collection(requireDb(), "locations");
    const snapshot = await getDocs(query(base, where("companyId", "==", companyId), limit(500)));
    const items = snapshot.docs.map((item) => ({
      id: String(item.data().employeeId ?? item.id),
      name: String(item.data().name ?? ""),
      lat: toNumber(item.data().lat),
      lng: toNumber(item.data().lng),
      status: (item.data().status as LiveTrackingEmployee["status"]) ?? "offline",
      geofenceName: (item.data().geofenceName as string | null | undefined) ?? null,
      lastSeen: String(item.data().lastSeen ?? ""),
      batteryLevel:
        item.data().batteryLevel === null || item.data().batteryLevel === undefined
          ? null
          : toNumber(item.data().batteryLevel),
    }));
    items.sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
    return items;
  },

  async update(employeeId: string, data: Record<string, unknown>): Promise<void> {
    const currentUser = await ensureAuth();
    await setDoc(
      doc(requireDb(), "locations", String(employeeId)),
      {
        ownerUid: currentUser.uid,
        companyId: requireCompanyId(),
        employeeId,
        ...data,
        lastSeen: new Date().toISOString(),
      },
      { merge: true }
    );
  },
};
