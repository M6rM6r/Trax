"use client";

import { AdminUser } from "@/lib/types/responseTypes";
import { clearTraxSessionCookie, setTraxSessionCookie } from "@/lib/auth/sessionCookie";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type UserRole = "company" | "employee" | "mastermind";

interface AuthState {
  user: AdminUser | null;
  token: string | null;
  role: UserRole | null;
  companyId: string | null;
  companyName: string | null;
  rememberMe: boolean;
  setUser: (
    user: AdminUser,
    token: string,
    role?: string,
    companyId?: string,
    companyName?: string
  ) => void;
  setRole: (role: UserRole) => void;
  setRememberMe: (rememberMe: boolean) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      role: null,
      companyId: null,
      companyName: null,
      rememberMe: false,
      setUser: (user, token, role, companyId, companyName) => {
        const normalizedRole: UserRole | null =
          role === "employee"
            ? "employee"
            : role === "mastermind"
              ? "mastermind"
              : role
                ? "company"
                : null;
        const cid =
          companyId === null ||
          companyId === undefined ||
          companyId === "" ||
          companyId === "null" ||
          companyId === "undefined"
            ? null
            : String(companyId);
        set({
          user,
          token,
          role: normalizedRole,
          companyId: cid,
          companyName: companyName ?? null,
        });
        setTraxSessionCookie(get().rememberMe);
      },
      setRole: (role) => set({ role }),
      setRememberMe: (rememberMe) => set({ rememberMe }),
      clearUser: () => {
        clearTraxSessionCookie();
        set({
          user: null,
          token: null,
          role: null,
          companyId: null,
          companyName: null,
          rememberMe: false,
        });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // Restore middleware cookie after hard refresh when Zustand rehydrates.
        if (state?.token) {
          setTraxSessionCookie(state.rememberMe);
        }
      },
    }
  )
);
