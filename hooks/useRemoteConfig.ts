"use client";

import { useState, useEffect, useCallback } from "react";
import { initializeRemoteConfig, FeatureFlags } from "@/lib/services/firebase/remoteConfig";

interface UseRemoteConfigReturn {
  ready: boolean;
  refresh: () => Promise<void>;
  flags: typeof FeatureFlags;
}

export function useRemoteConfig(): UseRemoteConfigReturn {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initializeRemoteConfig().then(() => setReady(true));
  }, []);

  const refresh = useCallback(async () => {
    setReady(false);
    await initializeRemoteConfig();
    setReady(true);
  }, []);

  return { ready, refresh, flags: FeatureFlags };
}
