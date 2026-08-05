"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { canRoleAccessPath, homePathForRole, isPublicPath } from "@/lib/utils/roleAccess";

/**
 * Global client gate: after Zustand rehydrate + known role, bounce wrong-role URLs.
 * Roles: mastermind | company | employee only.
 */
export default function RoleGate({ children }: { children: React.ReactNode }) {
  const role = useAuthStore((s) => s.role);
  const token = useAuthStore((s) => s.token);
  const pathname = usePathname();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!pathname) return;
    if (isPublicPath(pathname)) return;
    if (!token || !role) return;

    if (!canRoleAccessPath(role, pathname)) {
      const home = homePathForRole(role);
      if (home !== pathname) {
        router.replace(home);
      }
    }
  }, [hydrated, role, token, pathname, router]);

  return <>{children}</>;
}
