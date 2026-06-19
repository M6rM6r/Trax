import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Flash, Shapes } from "@/public/SVG";
import {
  CancellationStatisticsResponse,
  CancellationStatisticsData,
  ServiceListResponse,
  CancellationReasonService,
} from "@/lib/types/responseTypes";
import { fetcher } from "@/lib/fetcher";
import StatisticsClient from "./StatisticsClient";

export default async function Page({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params.locale;

  let stats: CancellationStatisticsData = {
    total_cancellations: 0,
    customer_cancellations: 0,
    driver_cancellations: 0,
    services_most_cancelled: [],
    reasons_most_cancelled: [],
    customers_most_cancelled: [],
    drivers_most_cancelled: [],
  };
  let serviceList: CancellationReasonService[] = [];

  try {
    // Fetch statistics from API
    const statisticsData = await fetcher<CancellationStatisticsResponse>(
      "/cancellation_reasons/statistics",
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
          lang: "ar",
        },
      }
    );

    stats = statisticsData.data;
  } catch (error: any) {
    console.error("❌ Failed to fetch cancellation statistics:", error);
    console.error("📍 Attempted URL:", error.response?.url);
    console.error("🔐 Status:", error.status);
  }

  try {
    // Fetch service list from API
    const serviceListData = await fetcher<ServiceListResponse>(
      "/cancellation_reasons/service_list",
      { cache: "no-store" }
    );

    serviceList = serviceListData.data;
  } catch (error: any) {
    console.error("❌ Failed to fetch service list:", error);
    console.error("📍 Attempted URL:", error.response?.url);
    console.error("🔐 Status:", error.status);
  }

  return (
    <MainLayout>
      <BreadCrumb
        labels={[
          {
            icon: <Shapes className="w-5 text-iconColor" />,
            label: "إدارة التطبيقات",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "إحصائيات الإلغاءات",
          },
        ]}
      />

      <StatisticsClient
        initialStats={stats}
        serviceList={serviceList}
        locale={locale}
      />
    </MainLayout>
  );
}
