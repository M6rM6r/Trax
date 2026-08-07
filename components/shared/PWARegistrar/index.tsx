"use client";

import { useEffect } from "react";
import { installChunkLoadRecovery } from "@/lib/utils/chunkLoadRecovery";

export function PWARegistrar() {
  useEffect(() => {
    // Auto hard-reload once when a deploy invalidates hashed Next chunks.
    const uninstallChunkRecovery = installChunkLoadRecovery();

    if (!("serviceWorker" in navigator)) {
      return () => uninstallChunkRecovery();
    }

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

      return () => uninstallChunkRecovery();
    }

    let updateInterval: number | undefined;
    let refreshing = false;

    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    if (process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          const forceUpdate = () => {
            if (registration.waiting) {
              registration.waiting.postMessage({ type: "SKIP_WAITING" });
            }
          };
          registration.addEventListener("updatefound", () => {
            const worker = registration.installing;
            if (!worker) return;
            worker.addEventListener("statechange", () => {
              if (worker.state === "installed" && navigator.serviceWorker.controller) {
                forceUpdate();
              }
            });
          });
          // Periodic update check (App Hosting deploys).
          updateInterval = window.setInterval(() => {
            registration.update().catch(() => {});
          }, 5 * 60_000);
        })
        .catch((err) => {
          console.warn("SW registration failed:", err);
        });

      // New controller = new SW claimed → hard reload once for fresh HTML/chunks.
      navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    }

    return () => {
      uninstallChunkRecovery();
      if (updateInterval !== undefined) window.clearInterval(updateInterval);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  return null;
}
