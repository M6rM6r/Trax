"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

interface PreloadConfig {
  pattern: string;
  loader: () => Promise<unknown>;
}

const preloadConfigs: PreloadConfig[] = [
  {
    pattern: "/live-map",
    loader: () => import("ol"),
  },
  {
    pattern: "/attendance",
    loader: () => import("@/lib/utils/exportUtils"),
  },
  {
    pattern: "/geofences",
    loader: () => import("ol"),
  },
];

export function useResourcePreload() {
  const pathname = usePathname();

  useEffect(() => {
    const config = preloadConfigs.find((c) => pathname.includes(c.pattern));
    if (!config) return;

    config.loader().catch(() => {});
  }, [pathname]);
}
