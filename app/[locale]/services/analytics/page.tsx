import MainLayout from "@/components/shared/MainLayout";
import { fetcher } from "@/lib/fetcher";
import { TotalActiveDriversResponse } from "@/lib/types/responseTypes";
import dynamic from "next/dynamic";

const ServicesAnalytics = dynamic(
  () => import("@/components/Services/Analytics/ServicesAnalytics"),
  {
    ssr: true,
    loading: () => (
      <div className="animate-pulse h-96 bg-gray-200 rounded-lg" />
    ),
  }
);

const Page = async () => {
  const totalActiveDrivers = await fetcher<TotalActiveDriversResponse>(
    "/drivers-statistics?type=main-services"
  );

  return (
    <MainLayout>
      <ServicesAnalytics totalActiveDrivers={totalActiveDrivers.data} />
    </MainLayout>
  );
};

export default Page;
