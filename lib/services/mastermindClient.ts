import { auth, db, secondaryAuth, secondaryDb } from "@/lib/config/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  signInWithEmailAndPassword,
  signOut,
  type UserCredential,
} from "firebase/auth";

function requireDb() {
  if (!db) throw new Error("Firebase Firestore is not configured");
  return db;
}

function requireMasterUid(): string {
  const uid = auth?.currentUser?.uid;
  const mastermindUid =
    typeof window === "undefined" ? null : sessionStorage.getItem("mastermind_uid");
  if (!uid || !mastermindUid || uid !== mastermindUid) {
    throw new Error("MasterMind session has expired. Sign in again as MasterMind.");
  }
  return uid;
}

function toIso(value: unknown): string {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toISOString();
  }
  return typeof value === "string" ? value : new Date(0).toISOString();
}

function mapCompany(id: string, data: Record<string, unknown>): MastermindCompany {
  return {
    id,
    name: String(data.name ?? ""),
    slug: String(data.slug ?? id),
    email: typeof data.email === "string" ? data.email : undefined,
    industry: typeof data.industry === "string" ? data.industry : undefined,
    phone: typeof data.phone === "string" ? data.phone : undefined,
    address: typeof data.address === "string" ? data.address : undefined,
    plan: String(data.plan ?? "trial"),
    max_employees: Number(data.max_employees ?? 10),
    active: data.active !== false,
    trial_ends_at: data.trial_ends_at ? toIso(data.trial_ends_at) : undefined,
    created_at: toIso(data.createdAt ?? data.created_at),
    users_count: Number(data.users_count ?? 0),
    employees_count: Number(data.employees_count ?? 0),
    geofences_count: Number(data.geofences_count ?? 0),
  };
}

async function companyCounts(
  companyId: string
): Promise<Pick<MastermindCompany, "users_count" | "employees_count" | "geofences_count">> {
  const database = requireDb();
  const [users, employees, geofences] = await Promise.all([
    getDocs(query(collection(database, "users"), where("company_id", "==", companyId))),
    getDocs(query(collection(database, "employees"), where("company_id", "==", companyId))),
    getDocs(query(collection(database, "geofences"), where("company_id", "==", companyId))),
  ]);

  return {
    users_count: users.size,
    employees_count: employees.size,
    geofences_count: geofences.size,
  };
}

async function listCompanies(): Promise<MastermindCompany[]> {
  const snapshot = await getDocs(query(collection(requireDb(), "companies"), limit(500)));
  const companies = await Promise.all(
    snapshot.docs.map(async (item) => ({
      ...mapCompany(item.id, item.data()),
      ...(await companyCounts(item.id)),
    }))
  );
  return companies.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

async function aggregateAttendance(companyIds: string[]): Promise<{
  attendanceToday: number;
  checkedOutToday: number;
  dailyMap: Map<string, { total: number; present: number; late: number; checked_out: number }>;
}> {
  const database = requireDb();
  const todayStr = new Date().toLocaleDateString("sv-SE");
  const thirtyDaysAgo = new Date(Date.now() - 29 * 86400000).toLocaleDateString("sv-SE");
  const dailyMap = new Map<
    string,
    { total: number; present: number; late: number; checked_out: number }
  >();
  let attendanceToday = 0;
  let checkedOutToday = 0;

  const results = await Promise.all(
    companyIds.map((cid) =>
      getDocs(
        query(
          collection(database, "attendance"),
          where("company_id", "==", cid),
          where("date", ">=", thirtyDaysAgo),
          where("date", "<=", todayStr)
        )
      ).catch(() => ({ docs: [] as { data: () => Record<string, unknown> }[] }))
    )
  );

  for (const snap of results) {
    for (const doc of snap.docs) {
      const d = doc.data() as Record<string, unknown>;
      const date = String(d.date ?? "");
      const status = String(d.status ?? "");
      if (!date) continue;

      if (date === todayStr) {
        attendanceToday++;
        if (status === "checked_out") checkedOutToday++;
      }

      const entry = dailyMap.get(date) ?? { total: 0, present: 0, late: 0, checked_out: 0 };
      entry.total++;
      if (status === "present" || status === "checked_out") entry.present++;
      if (status === "late") entry.late++;
      if (status === "checked_out") entry.checked_out++;
      dailyMap.set(date, entry);
    }
  }

  return { attendanceToday, checkedOutToday, dailyMap };
}

export interface MastermindStats {
  companies: number;
  activeCompanies: number;
  trialCompanies: number;
  users: number;
  employees: number;
  geofences: number;
  attendanceToday: number;
  checkedOutToday: number;
}

export interface MastermindCompany {
  id: string;
  name: string;
  slug: string;
  email?: string;
  industry?: string;
  phone?: string;
  address?: string;
  plan: string;
  max_employees: number;
  active: boolean;
  trial_ends_at?: string;
  created_at: string;
  users_count?: number;
  employees_count?: number;
  geofences_count?: number;
}

export interface MastermindDashboard {
  stats: MastermindStats;
  recentCompanies: MastermindCompany[];
}

export interface CompanyDetailUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface CompanyDetailEmployee {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface CompanyDetail {
  company: MastermindCompany & {
    users_count: number;
    employees_count: number;
    geofences_count: number;
  };
  recentEmployees: CompanyDetailEmployee[];
  users: CompanyDetailUser[];
}

export interface ReportsData {
  dailyAttendance: Array<{
    date: string;
    total: number;
    present: number;
    late: number;
    checked_out: number;
  }>;
  plans: Record<string, number>;
  topCompanies: MastermindCompany[];
  dateRange: { start: string; end: string };
}

export const mastermindClient = {
  async dashboard(): Promise<{ success: boolean; data: MastermindDashboard }> {
    const companies = await listCompanies();
    const companyIds = companies.map((c) => c.id);
    const { attendanceToday, checkedOutToday } = await aggregateAttendance(companyIds);
    const stats: MastermindStats = {
      companies: companies.length,
      activeCompanies: companies.filter((company) => company.active).length,
      trialCompanies: companies.filter((company) => company.plan === "trial").length,
      users: companies.reduce((total, company) => total + (company.users_count ?? 0), 0),
      employees: companies.reduce((total, company) => total + (company.employees_count ?? 0), 0),
      geofences: companies.reduce((total, company) => total + (company.geofences_count ?? 0), 0),
      attendanceToday,
      checkedOutToday,
    };
    return { success: true, data: { stats, recentCompanies: companies.slice(0, 5) } };
  },

  async companies(_params?: {
    per_page?: number;
    page?: number;
    search?: string;
    plan?: string;
    status?: string;
  }): Promise<{ success: boolean; data: MastermindCompany[]; meta: Record<string, unknown> }> {
    const companies = await listCompanies();
    return {
      success: true,
      data: companies,
      meta: { current_page: 1, last_page: 1, total: companies.length },
    };
  },

  async createCompany(
    payload: Partial<MastermindCompany> & {
      admin_name?: string;
      admin_email?: string;
      admin_password?: string;
      admin_role?: string;
    }
  ) {
    const database = requireDb();
    const ownerId = requireMasterUid();
    if (!secondaryAuth || !secondaryDb || !payload.admin_email || !payload.admin_password) {
      throw new Error("Firebase admin account provisioning is unavailable");
    }

    let credential: UserCredential;
    let createdAuthUser = false;
    try {
      credential = await createUserWithEmailAndPassword(
        secondaryAuth,
        payload.admin_email,
        payload.admin_password
      );
      createdAuthUser = true;
    } catch (error) {
      if ((error as { code?: string }).code !== "auth/email-already-in-use") throw error;
      credential = await signInWithEmailAndPassword(
        secondaryAuth,
        payload.admin_email,
        payload.admin_password
      );
      const profile = await getDoc(doc(secondaryDb, "users", credential.user.uid));
      if (profile.exists()) {
        throw new Error("This admin account is already assigned to a company");
      }
    }

    let companyRef: ReturnType<typeof doc> | null = null;
    try {
      companyRef = await addDoc(collection(database, "companies"), {
        name: payload.name ?? payload.email,
        slug: String(payload.name ?? payload.email ?? "company")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
        email: payload.email ?? null,
        industry: payload.industry ?? null,
        phone: payload.phone ?? null,
        address: payload.address ?? null,
        plan: payload.plan ?? "trial",
        max_employees: payload.max_employees ?? 10,
        active: payload.active !== false,
        ownerId,
        trial_ends_at:
          payload.plan === "trial" ? new Date(Date.now() + 14 * 86400000).toISOString() : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await setDoc(doc(secondaryDb, "users", credential.user.uid), {
        name: payload.admin_name ?? payload.admin_email,
        email: payload.admin_email,
        role: "company",
        company_id: companyRef.id,
        company_name: payload.name ?? payload.email,
        employee_id: null,
        assigned_geofence_id: null,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      if (companyRef) await deleteDoc(companyRef).catch(() => undefined);
      if (createdAuthUser) await deleteUser(credential.user).catch(() => undefined);
      throw error;
    } finally {
      await signOut(secondaryAuth).catch(() => undefined);
    }

    const companySnapshot = await getDoc(companyRef);
    return {
      success: true,
      data: {
        company: {
          ...mapCompany(companyRef.id, companySnapshot.data() ?? {}),
          ...(await companyCounts(companyRef.id)),
        },
        admin: {
          name: payload.admin_name ?? payload.admin_email,
          email: payload.admin_email,
          role: "company",
          password: payload.admin_password,
        },
      },
    };
  },

  async company(id: string): Promise<{ success: boolean; data: CompanyDetail }> {
    const companyId = String(id);
    const database = requireDb();
    const snapshot = await getDoc(doc(database, "companies", companyId));
    if (!snapshot.exists()) throw new Error("Company not found");
    const [employees, users, counts] = await Promise.all([
      getDocs(
        query(collection(database, "employees"), where("company_id", "==", companyId), limit(10))
      ),
      getDocs(query(collection(database, "users"), where("company_id", "==", companyId))),
      companyCounts(companyId),
    ]);
    return {
      success: true,
      data: {
        company: {
          ...mapCompany(snapshot.id, snapshot.data()),
          users_count: counts.users_count ?? 0,
          employees_count: counts.employees_count ?? 0,
          geofences_count: counts.geofences_count ?? 0,
        },
        recentEmployees: employees.docs.map((item) => {
          const data = item.data();
          return {
            id: item.id,
            name: String(data.name ?? ""),
            email: typeof data.email === "string" ? data.email : undefined,
            phone: typeof data.phone === "string" ? data.phone : undefined,
          };
        }),
        users: users.docs.map((item) => {
          const data = item.data();
          return {
            id: item.id,
            name: String(data.name ?? ""),
            email: String(data.email ?? ""),
            role: data.role === "employee" ? "employee" : "company",
          };
        }),
      },
    };
  },

  async updateCompany(id: string, payload: Partial<MastermindCompany>) {
    const companyRef = doc(requireDb(), "companies", String(id));
    await updateDoc(companyRef, { ...payload, updatedAt: serverTimestamp() });
    const snapshot = await getDoc(companyRef);
    return {
      success: true,
      data: {
        ...mapCompany(snapshot.id, snapshot.data() ?? {}),
        ...(await companyCounts(snapshot.id)),
      },
    };
  },

  async deleteCompany(id: string) {
    await deleteDoc(doc(requireDb(), "companies", String(id)));
    return { success: true };
  },

  async reports(): Promise<{ success: boolean; data: ReportsData }> {
    const companies = await listCompanies();
    const companyIds = companies.map((c) => c.id);
    const { dailyMap } = await aggregateAttendance(companyIds);
    const plans = companies.reduce<Record<string, number>>((totals, company) => {
      totals[company.plan] = (totals[company.plan] ?? 0) + 1;
      return totals;
    }, {});

    const dailyAttendance: ReportsData["dailyAttendance"] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toLocaleDateString("sv-SE");
      const entry = dailyMap.get(dateStr);
      dailyAttendance.push({
        date: dateStr,
        total: entry?.total ?? 0,
        present: entry?.present ?? 0,
        late: entry?.late ?? 0,
        checked_out: entry?.checked_out ?? 0,
      });
    }

    return {
      success: true,
      data: {
        dailyAttendance,
        plans,
        topCompanies: [...companies]
          .sort((a, b) => (b.employees_count ?? 0) - (a.employees_count ?? 0))
          .slice(0, 10),
        dateRange: {
          start: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
          end: new Date().toISOString().slice(0, 10),
        },
      },
    };
  },
};
