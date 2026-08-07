"use client";

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { firebaseData } from "@/lib/services/firebaseData";
import type { Employee, AttendanceMode } from "@/lib/types/trackingTypes";
import { useAuthStore } from "@/stores/useAuthStore";
import { queryKeys } from "./queryKeys";

export function useEmployees(options?: { enabled?: boolean }) {
  const companyId = useAuthStore((state) => state.companyId);
  const role = useAuthStore((state) => state.role);

  return useQuery<Employee[]>({
    queryKey: [...queryKeys.employees, companyId ?? "unassigned"],
    // Company admin roster only (command palette / dashboards). Staff use useEmployee(id).
    enabled: Boolean(companyId) && role === "company" && (options?.enabled ?? true),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
    queryFn: async (): Promise<Employee[]> => {
      return firebaseData.employees.list();
    },
  });
}

export function useEmployee(employeeId?: string | null, options?: { enabled?: boolean }) {
  const companyId = useAuthStore((state) => state.companyId);
  const role = useAuthStore((state) => state.role);

  return useQuery<Employee | null>({
    queryKey: [...queryKeys.employees, "byId", employeeId ?? "none", companyId ?? "unassigned"],
    // Company admin + own employee profile; skip for mastermind / logged-out shells.
    enabled:
      Boolean(companyId && employeeId) &&
      (role === "company" || role === "employee") &&
      (options?.enabled ?? true),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
    queryFn: async (): Promise<Employee | null> => {
      return firebaseData.employees.getById(employeeId!);
    },
  });
}

export function useInactiveEmployees() {
  const { data: employees = [], isLoading, isError, refetch } = useEmployees();
  const data = useMemo(
    () => employees.filter((employee) => employee.status === "inactive"),
    [employees]
  );
  return { data, isLoading, isError, refetch };
}

export function useEmployeesByMode(mode: AttendanceMode) {
  const { data: employees = [], isLoading, isError, refetch } = useEmployees();
  const data = useMemo(
    () =>
      employees.filter((e) => e.attendanceMode === mode || (!e.attendanceMode && mode === "field")),
    [employees, mode]
  );
  return { data, isLoading, isError, refetch };
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (employee: Omit<Employee, "id"> & { password?: string }) => {
      return firebaseData.employees.create(employee);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.employees, refetchType: "all" });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Employee> }) => {
      await firebaseData.employees.update(id, data);
      return firebaseData.employees.getById(id) as Promise<Employee>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.employees, refetchType: "all" });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await firebaseData.employees.delete(id);
      return { id };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.employees, refetchType: "all" });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useResetEmployeePassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      password,
      email,
    }: {
      id?: string;
      password?: string;
      email?: string;
    }) => {
      if (password && password.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }
      if (id && password) {
        // 1) Auth + Admin write of loginPassword (requires deployed setEmployeePassword CF).
        try {
          await firebaseData.cloudFunctions.setEmployeePassword({ employeeId: id, password });
        } catch (err) {
          const code =
            typeof err === "object" && err !== null && "code" in err
              ? String((err as { code?: string }).code)
              : "";
          const msg = err instanceof Error ? err.message : String(err);
          // CF missing / not deployed: still store company-visible password, then surface Auth gap.
          if (
            code.includes("not-found") ||
            code.includes("unimplemented") ||
            msg.toLowerCase().includes("not-found") ||
            msg.toLowerCase().includes("not found")
          ) {
            await firebaseData.employees.setCompanyVisiblePassword(id, password);
            throw new Error(
              "PASSWORD_SAVED_AUTH_PENDING: Password saved for company view, but login Auth was not updated. Deploy Cloud Functions (setEmployeePassword), then set the password once more."
            );
          }
          throw err;
        }
        // 2) Belt-and-suspenders client write so UI always has loginPassword even if Admin path lags.
        try {
          await firebaseData.employees.setCompanyVisiblePassword(id, password);
        } catch {
          // CF already wrote it; ignore client permission races.
        }
        return { id, password };
      }
      if (email) {
        await firebaseData.employees.resetPassword(email);
        return { id };
      }
      throw new Error("Employee id or email is required to reset password");
    },
    onSuccess: (result) => {
      if (result?.id && result && "password" in result && typeof result.password === "string") {
        const plain = result.password;
        qc.setQueriesData<Employee[]>({ queryKey: queryKeys.employees }, (old) => {
          if (!old) return old;
          return old.map((e) =>
            String(e.id) === String(result.id) ? { ...e, password: plain } : e
          );
        });
      }
      qc.invalidateQueries({ queryKey: queryKeys.employees, refetchType: "all" });
    },
  });
}
