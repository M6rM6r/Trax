"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCompanySettingsStore } from "@/stores/useCompanySettingsStore";
import { useCompanySettings } from "@/hooks/useApi";
import { defaultCompanySettings } from "@/lib/types/companySettings";

export default function CompanySettingsLoader() {
  const user = useAuthStore((s) => s.user);
  const setSettings = useCompanySettingsStore((s) => s.setSettings);
  const setLoaded = useCompanySettingsStore((s) => s.setLoaded);
  const { data: firestoreSettings } = useCompanySettings({ enabled: !!user });

  useEffect(() => {
    if (!user) return;

    if (firestoreSettings) {
      const merged = { ...defaultCompanySettings };
      for (const key of Object.keys(
        defaultCompanySettings
      ) as (keyof typeof defaultCompanySettings)[]) {
        if (key in firestoreSettings && firestoreSettings[key] !== undefined) {
          (merged as Record<string, unknown>)[key] = firestoreSettings[key];
        }
      }
      setSettings(merged);
    } else {
      setSettings(defaultCompanySettings);
    }
    setLoaded();
  }, [user, firestoreSettings, setSettings, setLoaded]);

  return null;
}
