"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";

export default function AppPreloader() {
  const router = useRouter();

  useEffect(() => {
    router.prefetch("/employees");
    router.prefetch("/live-map");
    router.prefetch("/attendance");
    router.prefetch("/geofences");
    router.prefetch("/check-in");
  }, [router]);

  return null;
}
