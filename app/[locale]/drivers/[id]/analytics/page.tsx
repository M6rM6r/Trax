import MainLayout from "@/components/shared/MainLayout";
import { fetcher } from "@/lib/fetcher";
import IndividualDriverAnalytics from "@/components/Drivers/Analytics/IndividualDriverAnalytics";
import { DriverProfileResponse } from "@/lib/types/responseTypes";

export interface DriverAnalyticsData {
  completed_ride: number;
  canceled_ride: number;
  total_profit: number;
}

interface DriverAnalyticsResponse {
  success: boolean;
  message: string;
  data: DriverAnalyticsData;
}

export default async function DriverAnalytics({
  params,
}: {
  params: { id: string };
}) {
  const profile = await fetcher<DriverProfileResponse>(`/drivers/${params.id}`);

  const driverName = profile.data.driver.name;

  const response: DriverAnalyticsResponse = await fetcher(
    `/drivers-statistics/${params.id}`
  );

  const data = response.data;

  return (
    <MainLayout>
      <IndividualDriverAnalytics data={data} driverName={driverName} />
    </MainLayout>
  );
}
