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
    let mounted = true;
    initializeRemoteConfig()
      .then(() => {
        if (mounted) setReady(true);
      })
      .catch(() => {
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setReady(false);
    try {
      await initializeRemoteConfig();
    } catch {
      // ignore — still mark ready so UI doesn't hang
    }
    setReady(true);
  }, []);

  return { ready, refresh, flags: FeatureFlags };
}
