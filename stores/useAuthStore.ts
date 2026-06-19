"use client";

import { AdminUser } from "@/lib/types/responseTypes";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  user: AdminUser | null;
  token: string | null;
  setUser: (user: AdminUser, token: string) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUser: (user, token) => set({ user, token }),
      clearUser: () => set({ user: null, token: null }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
