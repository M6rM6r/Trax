import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "@/lib/config/firebase";
import { requireCompanyId, requireDb, ensureAuth, cleanPayload } from "./helpers";

export type CompanyListItem = {
  id: string;
  name: string;
  plan: string;
  industry: string;
  contactPhone: string;
  adminEmail: string;
  adminName: string;
  ownerId: string;
  active: boolean;
  maxEmployees: number;
  signupSource: "self" | "mastermind" | "unknown";
  createdAt: string | null;
  employeeCount: number;
  geofenceCount: number;
};

function toIso(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toISOString();
  }
  if (typeof value === "object" && value !== null && "toDate" in value) {
    try {
      const d = (value as { toDate: () => Date }).toDate();
      return d.toISOString();
    } catch {
      return null;
    }
  }
  if (typeof value === "object" && value !== null && "seconds" in value) {
    const seconds = Number((value as { seconds: number }).seconds);
    if (Number.isFinite(seconds)) return new Date(seconds * 1000).toISOString();
  }
  return null;
}

async function countForCompany(collectionName: string, companyId: string): Promise<number> {
  const dbRef = requireDb();
  // Dual company_id string/number (legacy)
  try {
    const snap = await getCountFromServer(
      query(collection(dbRef, collectionName), where("company_id", "==", companyId))
    );
    const n = snap.data().count;
    if (n > 0) return n;
  } catch {
    // fall through
  }
  const asNum = Number(companyId);
  if (Number.isFinite(asNum) && String(asNum) === companyId) {
    try {
      const snap = await getCountFromServer(
        query(collection(dbRef, collectionName), where("company_id", "==", asNum))
      );
      return snap.data().count;
    } catch {
      return 0;
    }
  }
  return 0;
}

export const companiesApi = {
  async list(): Promise<CompanyListItem[]> {
    await ensureAuth();
    const snapshot = await getDocs(query(collection(requireDb(), "companies"), limit(1000)));
    const base = snapshot.docs.map((item) => {
      const d = item.data();
      const sourceRaw = String(d.signupSource ?? d.source ?? "").toLowerCase();
      const signupSource: CompanyListItem["signupSource"] =
        sourceRaw === "self" || sourceRaw === "self_signup"
          ? "self"
          : sourceRaw === "mastermind"
            ? "mastermind"
            : "unknown";
      return {
        id: item.id,
        name: String(d.name ?? ""),
        plan: String(d.plan ?? "trial"),
        industry: String(d.industry ?? ""),
        contactPhone: String(d.contactPhone ?? d.phone ?? d.contact_number ?? ""),
        adminEmail: String(d.adminEmail ?? d.admin_email ?? ""),
        adminName: String(d.adminName ?? d.admin_name ?? ""),
        ownerId: String(d.ownerId ?? ""),
        active: d.active !== false,
        maxEmployees: Number(d.maxEmployees ?? 10) || 10,
        signupSource,
        createdAt: toIso(d.createdAt ?? d.created_at),
        employeeCount: 0,
        geofenceCount: 0,
      } satisfies CompanyListItem;
    });

    const withCounts = await Promise.all(
      base.map(async (company) => {
        const [employeeCount, geofenceCount] = await Promise.all([
          countForCompany("employees", company.id),
          countForCompany("geofences", company.id),
        ]);
        return { ...company, employeeCount, geofenceCount };
      })
    );

    return withCounts.sort((a, b) => {
      const at = a.createdAt ? Date.parse(a.createdAt) : 0;
      const bt = b.createdAt ? Date.parse(b.createdAt) : 0;
      return bt - at;
    });
  },

  async register(data: {
    company_name: string;
    industry?: string;
    contact_phone: string;
    admin_name?: string;
    admin_email: string;
    admin_password: string;
  }): Promise<{ companyId: string; uid: string }> {
    if (!auth) throw new Error("Firebase Auth is not configured");
    if (!db) throw new Error("Firebase Firestore is not configured");

    const email = data.admin_email.trim().toLowerCase();
    const companyName = data.company_name.trim();
    const phone = data.contact_phone.trim();
    const adminName = (data.admin_name?.trim() || companyName || email.split("@")[0]).trim();
    const industry = (data.industry ?? "").trim();

    const credential = await createUserWithEmailAndPassword(auth, email, data.admin_password);
    const user = credential.user;
    await updateProfile(user, { displayName: adminName });

    const companyRef = doc(collection(db, "companies"));
    const companyId = companyRef.id;

    // Write users/{uid} FIRST so Auth onCreate trigger skips bootstrap employee profile
    // (role/company_id become immutable under Firestore rules once set).
    const userDoc = {
      id: user.uid,
      company_id: companyId,
      name: adminName,
      email,
      phone,
      role: "company",
      company_name: companyName,
      company: { id: companyId, name: companyName },
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, "users", user.uid), cleanPayload(userDoc));

    await setDoc(companyRef, {
      id: companyId,
      name: companyName,
      industry,
      contactPhone: phone,
      adminEmail: email,
      adminName,
      plan: "trial",
      maxEmployees: 10,
      active: true,
      ownerId: user.uid,
      signupSource: "self",
      createdAt: serverTimestamp(),
    });

    // Default empty company settings shell (company TZ pipeline)
    await setDoc(
      doc(db, "company_settings", companyId),
      {
        company_id: companyId,
        timezone: "Asia/Riyadh",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

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
