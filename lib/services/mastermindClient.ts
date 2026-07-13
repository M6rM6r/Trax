import { httpClient } from "./httpClient";

function mastermindHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = sessionStorage.getItem("mastermind_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
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
  id: number;
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
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface CompanyDetailEmployee {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
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
  login: (idToken: string) =>
    httpClient.post<{ success: boolean; message?: string; data?: { email: string; role: string } }>(
      "/mastermind/login",
      { id_token: idToken }
    ),

  dashboard: () =>
    httpClient.get<{ success: boolean; data: MastermindDashboard }>("/mastermind/dashboard", {
      headers: mastermindHeaders(),
    }),

  companies: (params?: {
    search?: string;
    plan?: string;
    status?: string;
    per_page?: number;
    page?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.plan) query.set("plan", params.plan);
    if (params?.status) query.set("status", params.status);
    if (params?.per_page) query.set("per_page", String(params.per_page));
    if (params?.page) query.set("page", String(params.page));
    const qs = query.toString();
    return httpClient.get<{
      success: boolean;
      data: MastermindCompany[];
      meta: Record<string, unknown>;
    }>(`/mastermind/companies${qs ? `?${qs}` : ""}`, { headers: mastermindHeaders() });
  },

  createCompany: (payload: Partial<MastermindCompany>) =>
    httpClient.post<{
      success: boolean;
      message?: string;
      data: {
        company: MastermindCompany;
        admin: { name: string; email: string; role: string; password: string };
      };
    }>("/mastermind/companies", payload, { headers: mastermindHeaders() }),

  company: (id: number) =>
    httpClient.get<{ success: boolean; data: CompanyDetail }>(`/mastermind/companies/${id}`, {
      headers: mastermindHeaders(),
    }),

  updateCompany: (id: number, payload: Partial<MastermindCompany>) =>
    httpClient.patch<{ success: boolean; message?: string; data: MastermindCompany }>(
      `/mastermind/companies/${id}`,
      payload,
      { headers: mastermindHeaders() }
    ),

  deleteCompany: (id: number) =>
    httpClient.delete<{ success: boolean; message?: string }>(`/mastermind/companies/${id}`, {
      headers: mastermindHeaders(),
    }),

  reports: () =>
    httpClient.get<{ success: boolean; data: ReportsData }>("/mastermind/reports", {
      headers: mastermindHeaders(),
    }),
};
