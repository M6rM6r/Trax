"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultCompanySettings, type CompanySettings } from "@/lib/types/companySettings";

interface CompanySettingsState extends CompanySettings {
  loaded: boolean;
  setSettings: (settings: Partial<CompanySettings>) => void;
  resetSettings: () => void;
  setLoaded: () => void;
}

export const useCompanySettingsStore = create<CompanySettingsState>()(
  persist(
    (set) => ({
      ...defaultCompanySettings,
      loaded: false,
      setSettings: (settings) => set((state) => ({ ...state, ...settings })),
      resetSettings: () => set({ ...defaultCompanySettings, loaded: true }),
      setLoaded: () => set({ loaded: true }),
    }),
    {
      name: "company-settings",
      partialize: (state) => {
        const { loaded, setSettings, resetSettings, setLoaded, ...rest } = state;
        void loaded; void setSettings; void resetSettings; void setLoaded;
        return rest;
      },
    }
  )
);
