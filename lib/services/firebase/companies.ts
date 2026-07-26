import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { requireCompanyId, requireDb, ensureAuth, cleanPayload } from "./helpers";

export const companiesApi = {
  async list(): Promise<{ id: string; name: string; plan: string; industry: string }[]> {
    await ensureAuth();
    const snapshot = await getDocs(collection(requireDb(), "companies"));
    return snapshot.docs.map((item) => ({
      id: item.id,
      name: String(item.data().name ?? ""),
      plan: String(item.data().plan ?? "trial"),
      industry: String(item.data().industry ?? ""),
    }));
  },

  async register(_data: {
    company_name: string;
    industry: string;
    admin_name: string;
    admin_email: string;
    admin_password: string;
  }): Promise<{ companyId: string; uid: string }> {
    throw new Error(
      "Company self-registration is disabled. Please contact MasterMind to create your company."
    );
  },

  async getSettings(): Promise<Record<string, unknown> | null> {
    const cid = requireCompanyId();
    const ref = doc(requireDb(), "company_settings", String(cid));
    const snapshot = await getDoc(ref);
    return snapshot.exists() ? snapshot.data() : null;
  },

  async saveSettings(settings: Record<string, unknown>): Promise<void> {
    const cid = requireCompanyId();
    const ref = doc(requireDb(), "company_settings", String(cid));
    await setDoc(ref, { ...cleanPayload(settings), updatedAt: serverTimestamp() }, { merge: true });
  },
};
