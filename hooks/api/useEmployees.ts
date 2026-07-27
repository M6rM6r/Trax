"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { firebaseData } from "@/lib/services/firebaseData";
import type { Employee, AttendanceMode } from "@/lib/types/trackingTypes";
import { useAuthStore } from "@/stores/useAuthStore";
import { queryKeys } from "./queryKeys";

export function useEmployees(options?: { enabled?: boolean }) {
  const companyId = useAuthStore((state) => state.companyId);

  return useQuery<Employee[]>({
    queryKey: [...queryKeys.employees, companyId ?? "unassigned"],
    enabled: Boolean(companyId) && (options?.enabled ?? true),
    staleTime: 30 * 1000,
    queryFn: async (): Promise<Employee[]> => {
      return firebaseData.employees.list();
    },
  });
}

export function useInactiveEmployees() {
  const companyId = useAuthStore((state) => state.companyId);

  return useQuery<Employee[]>({
    queryKey: [...queryKeys.employeesInactive, companyId ?? "unassigned"],
    enabled: Boolean(companyId),
    queryFn: async (): Promise<Employee[]> => {
      const employees = await firebaseData.employees.list();
      return employees.filter((employee) => employee.status === "inactive");
    },
  });
}

export function useEmployeesByMode(mode: AttendanceMode) {
  const companyId = useAuthStore((state) => state.companyId);

  return useQuery<Employee[]>({
    queryKey: [...queryKeys.employees, companyId ?? "unassigned", "mode", mode],
    enabled: Boolean(companyId),
    staleTime: 30 * 1000,
    queryFn: async (): Promise<Employee[]> => {
      const employees = await firebaseData.employees.list();
      return employees.filter(
        (e) => e.attendanceMode === mode || (!e.attendanceMode && mode === "field")
      );
    },
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (employee: Omit<Employee, "id"> & { password?: string }) => {
      return firebaseData.employees.create(employee);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.employees });
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
      qc.invalidateQueries({ queryKey: queryKeys.employees });
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
      qc.invalidateQueries({ queryKey: queryKeys.employees });
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
      if (email) {
        await firebaseData.employees.resetPassword(email);
        return { id };
      }
      throw new Error("Employee email is required to reset password");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.employees });
    },
  });
}
