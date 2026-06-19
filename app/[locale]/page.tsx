import MainLayout from "@/components/shared/MainLayout";
import { fetcher } from "@/lib/fetcher";
import { Separator } from "@/components/ui/separator";
import { ChartSpline } from "lucide-react";

import {
  TotalActiveCustomersResponse,
  TotalActiveDriversResponse,
  TotalFaultsDrivers,
  TotalMainServicesResponse,
} from "@/lib/types/responseTypes";
import dynamic from "next/dynamic";
import FullPageHead from "@/components/shared/FullPageHead";
const OverviewAnalytics = dynamic(
  () => import("@/components/Home/Analytics/OverviewAnalytics"),
  {
    ssr: true,
    loading: () => (
      <div className="animate-pulse h-96 bg-gray-200 rounded-lg" />
    ),
  }
);

export default async function HomePage() {
  // Fetch all statistics in parallel for better performance
  const [
    totalActiveDrivers,
    totalMainServices,
    totalActiveCustomers,
    totalFaultsDrivers,
  ] = await Promise.all([
    fetcher<TotalActiveDriversResponse>(
      "/drivers-statistics?type=active-drivers"
    ),
    fetcher<TotalMainServicesResponse>(
      "/drivers-statistics?type=main-services"
    ),
    fetcher<TotalActiveCustomersResponse>(
      "/drivers-statistics?type=customers-services"
    ),
    fetcher<TotalFaultsDrivers>("/drivers-statistics?type=faults"),
  ]);

  return (
    <MainLayout>
      <OverviewAnalytics
        totalFaultsDrivers={totalFaultsDrivers.data}
        totalActiveDrivers={totalActiveDrivers.data}
        totalMainServices={totalMainServices.data}
        totalActiveCustomers={totalActiveCustomers.data}
      />
    </MainLayout>
  );
}
