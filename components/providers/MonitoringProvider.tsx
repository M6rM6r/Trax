"use client";

import { useEffect } from "react";
import { errorMonitor } from "@/lib/monitoring/errorMonitor";
import { perfMonitor } from "@/lib/monitoring/perfMonitor";

export function MonitoringProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    errorMonitor.init();
    perfMonitor.init();
  }, []);

  return <>{children}</>;
}
