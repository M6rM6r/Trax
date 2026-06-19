import MainLayout from "@/components/shared/MainLayout";
import { fetcher } from "@/lib/fetcher";
import {
  TotalActiveDriversResponse,
  TotalMainServicesResponse,
} from "@/lib/types/responseTypes";
import dynamic from "next/dynamic";
const DriverAnalytics = dynamic(
  () => import("@/components/Drivers/Analytics/AllDriversAnalytics"),
  {
    ssr: true,
    loading: () => (
      <div className="animate-pulse h-96 bg-gray-200 rounded-lg" />
    ),
  }
);

const Page = async () => {
  // Fetch in parallel for better performance
  const [totalMainServices, totalActiveDrivers] = await Promise.all([
    fetcher<TotalMainServicesResponse>(
      "/drivers-statistics?type=main-services"
    ),
    fetcher<TotalActiveDriversResponse>(
      "/drivers-statistics?type=active-drivers"
    ),
  ]);

  return (
    <MainLayout>
      <DriverAnalytics
        data={{
          ...totalMainServices.data,
          totalActiveDriversNum: totalActiveDrivers.data.total_active_drivers,
        }}
      />
    </MainLayout>
  );
};

export default Page;
