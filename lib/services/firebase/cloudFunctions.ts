import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/config/firebase";
import { getCompanyId } from "./helpers";

function requireFunctions() {
  if (!functions) throw new Error("Firebase Functions is not configured");
  return functions;
}

export const cloudFunctionsApi = {
  async exportAttendance(
    startDate: string,
    endDate: string
  ): Promise<{ csv: string; count: number }> {
    const fn = httpsCallable(requireFunctions(), "exportAttendance");
    const companyId = getCompanyId();
    if (!companyId) throw new Error("NO_COMPANY");
    const result = await fn({ companyId, startDate, endDate });
    const data = result.data as { success: boolean; data: { csv: string; count: number } };
    return data.data;
  },

  async bulkCreateEmployees(
    employees: Array<{
      name: string;
      email: string;
      phone?: string;
      department?: string;
      geofenceId?: string;
      employeeNumber?: string;
    }>
  ): Promise<{ created: string[]; count: number }> {
    const fn = httpsCallable(requireFunctions(), "bulkCreateEmployees");
    const companyId = getCompanyId();
    if (!companyId) throw new Error("NO_COMPANY");
    const result = await fn({ companyId, employees });
    const data = result.data as { success: boolean; data: { created: string[]; count: number } };
    return data.data;
  },

  async sendCompanyNotification(
    title: string,
    body: string
  ): Promise<{ sent: number; failed: number }> {
    const fn = httpsCallable(requireFunctions(), "sendCompanyNotification");
    const companyId = getCompanyId();
    if (!companyId) throw new Error("NO_COMPANY");
    const result = await fn({ companyId, title, body });
    const data = result.data as { success: boolean; data: { sent: number; failed: number } };
    return data.data;
  },

  async analyzeRetention(features: Record<string, unknown>): Promise<Record<string, unknown>> {
    const fn = httpsCallable(requireFunctions(), "analyzeRetention");
    const companyId = getCompanyId();
    if (!companyId) throw new Error("NO_COMPANY");
    const result = await fn({ companyId, features });
    const data = result.data as { success: boolean; data: Record<string, unknown> };
    return data.data;
  },
};
