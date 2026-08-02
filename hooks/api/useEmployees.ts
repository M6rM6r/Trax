"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { firebaseData } from "@/lib/services/firebaseData";
import type { Employee, AttendanceMode } from "@/lib/types/trackingTypes";
import { useAuthStore } from "@/stores/useAuthStore";
import { queryKeys } from "./queryKeys";

export function useEmployees(options?: { enabled?: boolean }) {
  const companyId = useAuthStore((state) => state.companyId);

  return useQuery<Employee[]>({
    queryKey: [...queryKeys.employees, companyId ?? "unassigned"],
    enabled: Boolean(companyId) && (options?.enabled ?? true),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
    queryFn: async (): Promise<Employee[]> => {
      return firebaseData.employees.list();
    },
  });
}

export function useEmployee(employeeId?: string | null) {
  const companyId = useAuthStore((state) => state.companyId);

  return useQuery<Employee | null>({
    queryKey: [...queryKeys.employees, "byId", employeeId ?? "none", companyId ?? "unassigned"],
    enabled: Boolean(companyId && employeeId),
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
  const { data: employees = [] } = useEmployees();

  return useMemo(
    () =>
      employees.filter((e) => e.attendanceMode === mode || (!e.attendanceMode && mode === "field")),
    [employees, mode]
  );
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
        await firebaseData.cloudFunctions.setEmployeePassword({ employeeId: id, password });
        return { id };
      }
      if (email) {
        await firebaseData.employees.resetPassword(email);
        return { id };
      }
      throw new Error("Employee id or email is required to reset password");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.employees, refetchType: "all" });
    },
  });
}
