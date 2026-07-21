"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";

export function useKeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();

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
        const routes: Record<string, string> = {
          d: "/",
          e: "/employees",
          a: "/attendance",
          m: "/live-map",
          s: "/settings",
          g: "/geofences",
          c: "/check-in",
        };
        const route = routes[e.key.toLowerCase()];
        if (route) {
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
  }, [router, pathname]);
}
