"use client";

import { AdminUser } from "@/lib/types/responseTypes";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "boss" | "employee";

interface AuthState {
  user: AdminUser | null;
  token: string | null;
  role: UserRole | null;
  setUser: (user: AdminUser, token: string, role?: UserRole) => void;
  setRole: (role: UserRole) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      role: null,
      setUser: (user, token, role) => set({ user, token, role: role ?? null }),
      setRole: (role) => set({ role }),
      clearUser: () => set({ user: null, token: null, role: null }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user, token: state.token, role: state.role }),
    }
  )
);
