import MainLayout from "@/components/shared/MainLayout";
import { fetcher } from "@/lib/fetcher";
import dynamic from "next/dynamic";

const FaultsAnalytics = dynamic(
  () => import("@/components/outages/Analytics"),
  {
    ssr: true,
    loading: () => (
      <div className="animate-pulse h-96 bg-gray-200 rounded-lg" />
    ),
  }
);

interface OutageServiceAnalyticsData {
  pending: number;
  scheduled: number;
  accepted: number;
  driver_arrived: number;
  canceled_by_customer: number;
  canceled_by_driver: number;
  on_the_way: number;
  processing: number;
  done: number;
  canceled_automatically: number;
  total: number;
}

export interface OutagesAnalyticsData {
  fuel: OutageServiceAnalyticsData;
  tires: OutageServiceAnalyticsData;
  towing: OutageServiceAnalyticsData;
}

interface OutagesAnalyticsResponse {
  success: boolean;
  message: string;
  data: OutagesAnalyticsData;
}

export default async function Page() {
  const response: OutagesAnalyticsResponse = await fetcher(
    "/rides/count-by-service"
  );

  const data = response.data;
  const { fuel, towing, tires } = data;

  const faultsAnalyticsData = { fuel, tires, towing };

  return (
    <MainLayout>
      <FaultsAnalytics data={{ fuel, tires, towing }} />
    </MainLayout>
  );
}
