import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "@/lib/config/firebase";
import { requireCompanyId, requireDb, ensureAuth, cleanPayload } from "./helpers";

export const companiesApi = {
  async list(): Promise<{ id: string; name: string; plan: string; industry: string }[]> {
    await ensureAuth();
    const snapshot = await getDocs(query(collection(requireDb(), "companies"), limit(1000)));
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
    if (!auth) throw new Error("Firebase Auth is not configured");
    if (!db) throw new Error("Firebase Firestore is not configured");

    const credential = await createUserWithEmailAndPassword(
      auth,
      _data.admin_email,
      _data.admin_password
    );
    const user = credential.user;
    await updateProfile(user, { displayName: _data.admin_name });

    const companyRef = doc(collection(db, "companies"));
    const companyId = companyRef.id;

    await setDoc(companyRef, {
      id: companyId,
      name: _data.company_name,
      industry: _data.industry,
      plan: "trial",
      maxEmployees: 10,
      active: true,
      ownerId: user.uid,
      createdAt: serverTimestamp(),
    });

    const userDoc = {
      id: user.uid,
      company_id: companyId,
      name: _data.admin_name,
      email: _data.admin_email,
      role: "company",
      company_name: _data.company_name,
      company: { id: companyId, name: _data.company_name },
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, "users", user.uid), cleanPayload(userDoc));

    return { companyId, uid: user.uid };
  },

  async getSettings(): Promise<Record<string, unknown> | null> {
    await ensureAuth();
    const cid = requireCompanyId();
    const ref = doc(requireDb(), "company_settings", String(cid));
    const snapshot = await getDoc(ref);
    return snapshot.exists() ? snapshot.data() : null;
  },

  async saveSettings(settings: Record<string, unknown>): Promise<void> {
    await ensureAuth();
    const cid = requireCompanyId();
    const ref = doc(requireDb(), "company_settings", String(cid));
    await setDoc(ref, { ...cleanPayload(settings), updatedAt: serverTimestamp() }, { merge: true });
  },
};
