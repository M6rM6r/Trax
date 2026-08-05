"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useAuthStore } from "@/stores/useAuthStore";

export default function AppPreloader() {
  const router = useRouter();
  const role = useAuthStore((s) => s.role);

  useEffect(() => {
    if (role === "employee") {
      router.prefetch("/check-in");
      return;
    }
    if (role === "company" || role === "mastermind") {
      router.prefetch("/employees");
      router.prefetch("/attendance");
      router.prefetch("/geofences");
      router.prefetch("/settings/company");
    }
  }, [router, role]);

  return null;
}
