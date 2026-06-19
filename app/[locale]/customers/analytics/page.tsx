import MainLayout from "@/components/shared/MainLayout";
import { fetcher } from "@/lib/fetcher";
import {
  TotalActiveCustomersResponse,
  TotalActiveDriversResponse,
} from "@/lib/types/responseTypes";
import dynamic from "next/dynamic";
const CustomersAnalytics = dynamic(
  () => import("@/components/Customers/Analytics/CustomerAnalytics"),
  {
    ssr: true,
    loading: () => (
      <div className="animate-pulse h-96 bg-gray-200 rounded-lg" />
    ),
  }
);

const Page = async () => {
  // Fetch in parallel for better performance
  const [totalActiveDrivers, totalActiveCustomers] = await Promise.all([
    fetcher<TotalActiveDriversResponse>(
      "/drivers-statistics?type=active-drivers"
    ),
    fetcher<TotalActiveCustomersResponse>(
      "/drivers-statistics?type=customers-services"
    ),
  ]);

  const analyticsData = {
    totalActiveCustomers: totalActiveCustomers.data.total_active_customers,
    totalServices: totalActiveCustomers.data.total_services,
    totalActiveDrivers: totalActiveDrivers.data.total_active_drivers,
  };

  return (
    <MainLayout>
      <CustomersAnalytics analyticsData={analyticsData} />
    </MainLayout>
  );
};

export default Page;
