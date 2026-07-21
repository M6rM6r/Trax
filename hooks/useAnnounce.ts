"use client";

import { useCallback, useRef } from "react";

export function useAnnounce() {
  const ref = useRef<HTMLDivElement | null>(null);

  const announce = useCallback((message: string, priority: "polite" | "assertive" = "polite") => {
    if (typeof document === "undefined") return;

    if (!ref.current) {
      const el = document.createElement("div");
      el.setAttribute("aria-live", priority);
      el.setAttribute("aria-atomic", "true");
      el.className = "sr-only";
      document.body.appendChild(el);
      ref.current = el;
    }

    const el = ref.current;
    el.setAttribute("aria-live", priority);
    el.textContent = "";
    setTimeout(() => {
      el.textContent = message;
    }, 50);
  }, []);

  const cleanup = useCallback(() => {
    if (ref.current) {
      ref.current.remove();
      ref.current = null;
    }
  }, []);

  return { announce, cleanup };
}
