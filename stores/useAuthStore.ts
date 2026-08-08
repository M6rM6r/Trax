"use client";

import { AdminUser } from "@/lib/types/responseTypes";
import { clearTraxSessionCookie, setTraxSessionCookie } from "@/lib/auth/sessionCookie";
import { normalizeUserRole } from "@/lib/utils/auth";
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

/** Prefer sessionStorage when Remember me is off so closing the browser ends the shell session. */
function authPersistStorage() {
  if (typeof window === "undefined") {
    return createJSONStorage(() => localStorage);
  }
  try {
    const sessionRaw = sessionStorage.getItem("auth-storage");
    if (sessionRaw) {
      return createJSONStorage(() => sessionStorage);
    }
    const localRaw = localStorage.getItem("auth-storage");
    if (localRaw) {
      try {
        const parsed = JSON.parse(localRaw) as { state?: { rememberMe?: boolean } };
        if (parsed?.state?.rememberMe === false) {
          sessionStorage.setItem("auth-storage", localRaw);
          localStorage.removeItem("auth-storage");
          return createJSONStorage(() => sessionStorage);
        }
      } catch {
        /* fall through */
      }
    }
  } catch {
    /* private mode */
  }
  return createJSONStorage(() => localStorage);
}

function migrateAuthPersistTarget(rememberMe: boolean) {
  if (typeof window === "undefined") return;
  try {
    const from = rememberMe ? sessionStorage : localStorage;
    const to = rememberMe ? localStorage : sessionStorage;
    const raw = from.getItem("auth-storage") ?? to.getItem("auth-storage");
    if (!raw) return;
    to.setItem("auth-storage", raw);
    from.removeItem("auth-storage");
  } catch {
    /* ignore */
  }
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
        // Single normalizer — unknown strings collapse to employee (deny-by-default).
        const normalizedRole: UserRole | null =
          role === null || role === undefined || role === "" ? null : normalizeUserRole(role);
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
        const remember = get().rememberMe;
        migrateAuthPersistTarget(remember);
        setTraxSessionCookie(remember);
      },
      setRole: (role) => set({ role }),
      setRememberMe: (rememberMe) => {
        set({ rememberMe });
        migrateAuthPersistTarget(rememberMe);
      },
      clearUser: () => {
        clearTraxSessionCookie();
        try {
          localStorage.removeItem("auth-storage");
          sessionStorage.removeItem("auth-storage");
        } catch {
          /* ignore */
        }
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
      storage: authPersistStorage(),
      onRehydrateStorage: () => (state) => {
        // Restore middleware cookie after hard refresh when Zustand rehydrates.
        if (state?.token) {
          setTraxSessionCookie(state.rememberMe);
        }
      },
    }
  )
);
