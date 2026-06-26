"use client";

import { AdminUser } from "@/lib/types/responseTypes";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "boss" | "employee";

interface AuthState {
  user: AdminUser | null;
  token: string | null;
  role: UserRole | null;
  companyId: number | null;
  companyName: string | null;
  setUser: (
    user: AdminUser,
    token: string,
    role?: UserRole,
    companyId?: number,
    companyName?: string
  ) => void;
  setRole: (role: UserRole) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      role: null,
      companyId: null,
      companyName: null,
      setUser: (user, token, role, companyId, companyName) =>
        set({
          user,
          token,
          role: role ?? null,
          companyId: companyId ?? null,
          companyName: companyName ?? null,
        }),
      setRole: (role) => set({ role }),
      clearUser: () =>
        set({ user: null, token: null, role: null, companyId: null, companyName: null }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        role: state.role,
        companyId: state.companyId,
        companyName: state.companyName,
      }),
    }
  )
);
