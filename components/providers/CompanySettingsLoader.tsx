"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCompanySettingsStore } from "@/stores/useCompanySettingsStore";
import { useCompanySettings } from "@/hooks/useApi";
import { defaultCompanySettings } from "@/lib/types/companySettings";
import { getEffectiveDefaultShift } from "@/lib/utils/shifts";

function mergeCompanySettings(firestoreSettings: Record<string, unknown> | null | undefined) {
  const merged = { ...defaultCompanySettings };
  if (!firestoreSettings) return merged;
  for (const key of Object.keys(
    defaultCompanySettings
  ) as (keyof typeof defaultCompanySettings)[]) {
    if (key in firestoreSettings && firestoreSettings[key] !== undefined) {
      (merged as Record<string, unknown>)[key] = firestoreSettings[key];
    }
  }
  merged.defaultShift = getEffectiveDefaultShift(merged);
  return merged;
}

export default function CompanySettingsLoader() {
  const user = useAuthStore((s) => s.user);
  const companyId = useAuthStore((s) => s.companyId);
  const {
    data: firestoreSettings,
    isFetched,
    isError,
  } = useCompanySettings({ enabled: Boolean(user && companyId) });
  const lastAppliedKey = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      lastAppliedKey.current = null;
      return;
    }

    // Keep previous company settings until the new company query settles.
    if (!companyId || (!isFetched && !isError)) return;

    const payloadKey = `${user.id}:${companyId}:${JSON.stringify(firestoreSettings ?? null)}`;
    if (lastAppliedKey.current === payloadKey) return;

    const store = useCompanySettingsStore.getState();
    store.setSettings(mergeCompanySettings(firestoreSettings));
    store.setLoaded();
    lastAppliedKey.current = payloadKey;
  }, [user, companyId, firestoreSettings, isFetched, isError]);

  return null;
}
