"use client";

import { useEffect } from "react";

export function PWARegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "[::1]";

    // Local development safety: remove any previously installed SW/caches
    // so dev/prod assets don't get mixed and break RSC hydration.
    if (isLocalhost) {
      (async () => {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((registration) => registration.unregister()));

          if ("caches" in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((key) => caches.delete(key)));
          }
        } catch (err) {
          console.warn("SW cleanup failed on localhost:", err);
        }
      })();

      return;
    }

    if (process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.warn("SW registration failed:", err);
      });
    }
  }, []);

  return null;
}
