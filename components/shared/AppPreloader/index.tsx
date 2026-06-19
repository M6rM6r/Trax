// components/shared/AppPreloader.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePageCache } from "@/stores/useCache";
import { fetcherClient } from "@/lib/fetcherClient";

export default function AppPreloader() {
  const router = useRouter();
  const {
    setDashboardData,
    setCustomersData,
    setDriversData,
    setTripsData,
    setOutagesData,
  } = usePageCache();

  useEffect(() => {
    // -------------------------
    // 1️⃣ Prefetch pages
    // -------------------------
    router.prefetch("/dashboard");
    router.prefetch("/customers");
    router.prefetch("/drivers");
    router.prefetch("/trips");
    router.prefetch("/services/outages/analytics");

    // -------------------------
    // 2️⃣ Prefetch API data
    // -------------------------
    const preloadData = async () => {
      try {
        const [dashboard, customers, drivers, outages, trips]: any =
          await Promise.all([
            fetcherClient("/drivers-statistics?type=customers-services", {
              cache: "force-cache",
            }),
            fetcherClient("/customers", { cache: "force-cache" }),
            fetcherClient("/drivers", { cache: "force-cache" }),
            fetcherClient("/rides", { cache: "force-cache" }),
            fetcherClient("/rides/count-by-service", { cache: "force-cache" }),
          ]);

        setDashboardData(dashboard?.data ?? null);
        setCustomersData(customers?.data ?? null);
        setDriversData(drivers?.data ?? null);
        setTripsData(trips?.data ?? null);
        setOutagesData(outages?.data ?? null);
      } catch (err) {
        console.error("AppPreloader error:", err);
      }
    };

    preloadData();
  }, [
    router,
    setDashboardData,
    setCustomersData,
    setDriversData,
    setOutagesData,
  ]);

  return null; // Invisible component
}
