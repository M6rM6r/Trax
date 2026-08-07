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
  // persist API is client-only; SSR must not touch useAuthStore.persist
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const api = useAuthStore.persist;
    if (!api) {
      setHydrated(true);
      return;
    }
    const unsub = api.onFinishHydration(() => setHydrated(true));
    if (api.hasHydrated()) setHydrated(true);
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

  // Hold protected shells until auth rehydrate finishes — prevents one-frame wrong-role flash.
  if (!hydrated && pathname && !isPublicPath(pathname)) {
    return (
      <div
        className="min-h-[40vh] flex items-center justify-center"
        aria-busy="true"
        aria-label="Loading"
      >
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
