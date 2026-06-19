import MainLayout from "@/components/shared/MainLayout";
import { fetcher } from "@/lib/fetcher";
import dynamic from "next/dynamic";
const TripsAnalytics = dynamic(
  () => import("@/components/Trips/TripsAnalytics"),
  {
    ssr: true,
    loading: () => (
      <div className="animate-pulse h-96 bg-gray-200 rounded-lg" />
    ),
  }
);

export interface TripsAnalyticsData {
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

interface TripsAnalyticsResponse {
  success: boolean;
  message: string;
  data: TripsAnalyticsData;
}

const Page = async () => {
  const response: TripsAnalyticsResponse = await fetcher(
    `/rides/count-by-status`
  );

  return (
    <MainLayout>
      <TripsAnalytics data={response.data} />
    </MainLayout>
  );
};

export default Page;
