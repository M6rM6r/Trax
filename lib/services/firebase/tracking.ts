import { collection, doc, onSnapshot, setDoc, query, where, limit } from "firebase/firestore";
import type { LiveTrackingEmployee } from "@/lib/types/trackingTypes";
import {
  ensureAuth,
  requireCompanyId,
  requireDb,
  toNumber,
  getCompanyId,
  queryByCompanyId,
} from "./helpers";

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
    const companyId = getCompanyId();
    if (!companyId) return [];
    const items = await queryByCompanyId(collection(requireDb(), "locations"), [], mapLocationDoc);
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
        const cidStr = getCompanyId();
        if (!cidStr) {
          onUpdate([]);
          return;
        }
        const cidNum = Number(cidStr);
        const isNumeric = String(cidNum) === cidStr;
        const base = collection(requireDb(), "locations");

        // Try string company_id first
        const q = query(base, where("company_id", "==", cidStr), limit(500));

        const setupListener = (queryToUse: ReturnType<typeof query>) => {
          unsub = onSnapshot(
            queryToUse,
            (snapshot) => {
              if (snapshot.empty && isNumeric && queryToUse === q) {
                // Fallback to number company_id
                const qNum = query(base, where("company_id", "==", cidNum), limit(500));
                if (unsub) unsub();
                setupListener(qNum);
                return;
              }
              const items = snapshot.docs.map((item) =>
                mapLocationDoc(item.id, item.data() as Record<string, unknown>)
              );
              items.sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
              onUpdate(items);
            },
            (error) => onError(error instanceof Error ? error : new Error(String(error)))
          );
        };
        setupListener(q);
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
