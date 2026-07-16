"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCompanySettingsStore } from "@/stores/useCompanySettingsStore";
import { useCompanySettings } from "@/hooks/useApi";
import { defaultCompanySettings } from "@/lib/types/companySettings";

export default function CompanySettingsLoader() {
  const { user, role } = useAuthStore();
  const { setSettings, setLoaded } = useCompanySettingsStore();
  const isAdmin = role === "boss" || role === "manager";
  const { data: firestoreSettings } = useCompanySettings({ enabled: isAdmin });

  useEffect(() => {
    if (!user) return;
    if (!isAdmin) {
      setSettings(defaultCompanySettings);
      setLoaded();
      return;
    }

    if (firestoreSettings) {
      const merged = { ...defaultCompanySettings };
      for (const key of Object.keys(defaultCompanySettings) as (keyof typeof defaultCompanySettings)[]) {
        if (key in firestoreSettings && firestoreSettings[key] !== undefined) {
          (merged as Record<string, unknown>)[key] = firestoreSettings[key];
        }
      }
      setSettings(merged);
    } else {
      setSettings(defaultCompanySettings);
    }
    setLoaded();
  }, [user, isAdmin, firestoreSettings, setSettings, setLoaded]);

  return null;
}
