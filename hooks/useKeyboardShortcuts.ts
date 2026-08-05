"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  canRoleAccessPath,
  isCompanyRole,
  isEmployeeRole,
  isMastermindRole,
} from "@/lib/utils/roleAccess";

export function useKeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const role = useAuthStore((s) => s.role);

  useEffect(() => {
    let gPressed = false;
    let gTimer: ReturnType<typeof setTimeout> | null = null;

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("toggle-command-palette"));
        return;
      }

      if (e.key === "Escape") {
        document.querySelectorAll('[role="dialog"] [data-close]').forEach((el) => {
          (el as HTMLElement).click();
        });
        return;
      }

      if (isTyping) return;

      if (e.key === "g" && !gPressed) {
        gPressed = true;
        if (gTimer) clearTimeout(gTimer);
        gTimer = setTimeout(() => {
          gPressed = false;
        }, 1000);
        return;
      }

      if (gPressed) {
        const routes: Record<string, string> = {};
        if (isEmployeeRole(role)) {
          routes.c = "/check-in";
        } else if (isMastermindRole(role)) {
          routes.d = "/mastermind/companies";
          routes.c = "/mastermind/companies";
        } else if (isCompanyRole(role)) {
          routes.d = "/";
          routes.e = "/employees";
          routes.a = "/attendance";
          routes.m = "/live-map";
          routes.s = "/settings";
          routes.g = "/geofences";
        }
        const route = routes[e.key.toLowerCase()];
        if (route && canRoleAccessPath(role, route)) {
          e.preventDefault();
          router.push(route);
        }
        gPressed = false;
        if (gTimer) clearTimeout(gTimer);
      }
    };
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      if (gTimer) clearTimeout(gTimer);
    };
  }, [router, pathname, role]);
}
