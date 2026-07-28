"use client";

import { AdminUser } from "@/lib/types/responseTypes";
import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";

export type UserRole = "company" | "employee";

const STORAGE_NAME = "auth-storage";
const REMEMBER_KEY = `${STORAGE_NAME}-remember`;

function getRememberFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(REMEMBER_KEY) === "true";
  } catch {
    return false;
  }
}

function setRememberFlag(value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REMEMBER_KEY, String(value));
  } catch {}
}

const authStorage: StateStorage = {
  getItem: (name) => {
    if (typeof window === "undefined") return null;
    const storage = getRememberFlag() ? localStorage : sessionStorage;
    try {
      return storage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    if (typeof window === "undefined") return;
    let remember = false;
    try {
      remember = JSON.parse(value)?.state?.rememberMe === true;
    } catch {}
    setRememberFlag(remember);
    const storage = remember ? localStorage : sessionStorage;
    try {
      storage.setItem(name, value);
    } catch {}
  },
  removeItem: (name) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(name);
      sessionStorage.removeItem(name);
      localStorage.removeItem(REMEMBER_KEY);
    } catch {}
  },
};

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
    (set) => ({
      user: null,
      token: null,
      role: null,
      companyId: null,
      companyName: null,
      rememberMe: false,
      setUser: (user, token, role, companyId, companyName) => {
        const normalizedRole: UserRole | null =
          role === "employee" ? "employee" : role ? "company" : null;
        set({
          user,
          token,
          role: normalizedRole,
          companyId: companyId ?? null,
          companyName: companyName ?? null,
        });
      },
      setRole: (role) => set({ role }),
      setRememberMe: (rememberMe) => set({ rememberMe }),
      clearUser: () => {
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
      name: STORAGE_NAME,
      storage: createJSONStorage(() => authStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        role: state.role,
        companyId: state.companyId,
        companyName: state.companyName,
        rememberMe: state.rememberMe,
      }),
    }
  )
);
