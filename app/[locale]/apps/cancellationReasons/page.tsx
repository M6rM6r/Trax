import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Add, Flash, Shapes } from "@/public/SVG";
import { columns } from "./columns";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CancellationReasonsResponse, CancellationReasonRecord, ServiceListResponse, CancellationReasonService } from "@/lib/types/responseTypes";
import { fetcher } from "@/lib/fetcher";
import DataTableWrapper from "@/components/shared/DataTableWrapper";
import CancellationReasonsClient from "./CancellationReasonsClient";

export default async function Page({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params.locale;

  let reasons: CancellationReasonRecord[] = [];
  let serviceList: CancellationReasonService[] = [];
  let apiError: string | null = null;

  try {
    // Fetch cancellation reasons from API
    const reasonsData = await fetcher<CancellationReasonsResponse>(
      "/cancellation_reasons",
      { cache: "no-store" }
    );

    // Data is directly an array
    reasons = reasonsData.data;
  } catch (error: any) {
    console.error("❌ Failed to fetch cancellation reasons:", error);
    console.error("📍 Attempted URL:", error.response?.url);
    console.error("🔐 Status:", error.status);
    apiError = error?.info?.message || "Backend API endpoint not implemented yet";
    // Use empty array for now - the API needs to be created on the backend
    reasons = [];
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
    // Use empty array if API fails
    serviceList = [];
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
            label: "أسباب الإلغاء",
          },
        ]}
      />

      {apiError && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4">
          <p className="font-semibold">⚠️ تنبيه</p>
          <p className="text-sm mt-1">
            نقطة النهاية (API Endpoint) لأسباب الإلغاء غير متوفرة حالياً على الخادم.
            <br />
            يرجى التأكد من تنفيذ المسارات التالية على الباك-إند:
          </p>
          <ul className="text-sm mt-2 mr-4 list-disc">
            <li>GET: /api/admin/cancellation_reasons</li>
            <li>POST: /api/admin/cancellation_reasons</li>
            <li>PUT: /api/admin/cancellation_reasons/{"{id}"}</li>
          </ul>
        </div>
      )}

      <CancellationReasonsClient
        initialReasons={reasons}
        serviceList={serviceList}
        locale={locale}
      />
    </MainLayout>
  );
}
