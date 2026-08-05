"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCompanySettingsStore } from "@/stores/useCompanySettingsStore";
import { useCompanySettings } from "@/hooks/useApi";
import { defaultCompanySettings } from "@/lib/types/companySettings";
import { getEffectiveDefaultShift } from "@/lib/utils/shifts";

export default function CompanySettingsLoader() {
  const user = useAuthStore((s) => s.user);
  const { data: firestoreSettings } = useCompanySettings({ enabled: !!user });
  const setOnce = useRef(false);
  const lastUserId = useRef<number | null>(null);

  useEffect(() => {
    const currentUserId = user?.id ?? null;
    if (!user || (setOnce.current && lastUserId.current === currentUserId)) return;

    const store = useCompanySettingsStore.getState();
    if (store.loaded && lastUserId.current === currentUserId) {
      setOnce.current = true;
      return;
    }

    const setSettings = store.setSettings;
    const setLoaded = store.setLoaded;

    if (firestoreSettings) {
      const merged = { ...defaultCompanySettings };
      for (const key of Object.keys(
        defaultCompanySettings
      ) as (keyof typeof defaultCompanySettings)[]) {
        if (key in firestoreSettings && firestoreSettings[key] !== undefined) {
          (merged as Record<string, unknown>)[key] = firestoreSettings[key];
        }
      }
      merged.defaultShift = getEffectiveDefaultShift(merged);
      setSettings(merged);
    } else {
      setSettings(defaultCompanySettings);
    }
    setLoaded();
    setOnce.current = true;
    lastUserId.current = currentUserId;
  }, [user, firestoreSettings]);

  return null;
}
