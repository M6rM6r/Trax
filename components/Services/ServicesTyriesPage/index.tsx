import AppPercentage from "@/components/Drivers/Pricing/AppPercentage";
import LocationBasedControl from "@/components/Drivers/Pricing/LocationBasedControl";
import PeakPrices from "@/components/Drivers/Pricing/PeakPrices";
import PointsData from "@/components/Drivers/Pricing/PointsData";
import Positions from "@/components/Drivers/Pricing/Positions";
import PricesDay from "@/components/Drivers/Pricing/PricesDay";
import { DataTable } from "@/components/shared/DataTable/data-table";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getServiceSettingsValue } from "@/lib/helperFunctions";
import {
  PeakTimesResponse,
  ServiceSettingsResponse,
} from "@/lib/types/responseTypes";
import { columns } from "./columns";
import ToolsPage from "@/components/shared/ToolsPage";
const Index = ({
  data,
  searchParams,
  params,
  peakTimes,
}: {
  data: ServiceSettingsResponse;
  searchParams: { [key: string]: string };
  params: { [key: string]: string };
  peakTimes: PeakTimesResponse;
}) => {
  // Convert single object to array if necessary and filter out empty objects
  const peakTimesData = Array.isArray(peakTimes?.data)
    ? peakTimes.data.filter((item) => item && Object.keys(item).length > 0)
    : peakTimes?.data && Object.keys(peakTimes.data).length > 0
      ? [peakTimes.data]
      : [];

  return (
    <>
      <Tabs dir="rtl" defaultValue="settings" className="w-full">
        <TabsList className="w-full bg-transparent">
          <TabsTrigger
            value="settings"
            className=" grow border-b-[2px] border-b-iconColor pb-2  "
          >
            الإعدادات
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            className=" grow border-b-[2px] border-b-iconColor pb-2  "
          >
            الطلبات
          </TabsTrigger>
          <TabsTrigger
            value="tools"
            className=" grow border-b-[2px] border-b-iconColor pb-2  "
          >
            الأدوات
          </TabsTrigger>
        </TabsList>
        <TabsContent value="settings" className=" flex flex-col gap-3">
          <>
            <AppPercentage
              app_percentage={getServiceSettingsValue(
                data.data,
                "app_percentage"
              )}
              type={params.serviceType}
            />
            <Separator className="h-[2px]" />
            <LocationBasedControl />
            <PricesDay
              is_coming_soon={getServiceSettingsValue(
                data.data,
                "is_coming_soon",
                searchParams.subtype
              )}
              is_hidden={getServiceSettingsValue(
                data.data,
                "is_hidden",
                searchParams.subtype
              )}
              price_per_km={getServiceSettingsValue(
                data.data,
                "price_per_km",
                searchParams.subtype
              )}
              price_per_minute={getServiceSettingsValue(
                data.data,
                "price_per_minute",
                searchParams.subtype
              )}
              base_price={getServiceSettingsValue(
                data.data,
                "base_price",
                searchParams.subtype
              )}
              minimum_charge={getServiceSettingsValue(
                data.data,
                "minimum_charge",
                searchParams.subtype
              )}
              waiting_cost={getServiceSettingsValue(
                data.data,
                "waiting_cost",
                searchParams.subtype
              )}
              cancellation_cost={getServiceSettingsValue(
                data.data,
                "cancellation_cost",
                searchParams.subtype
              )}
              free_km={getServiceSettingsValue(
                data.data,
                "free_km",
                searchParams.subtype
              )}
              type={params.serviceType}
              service_settings={data.data}
            />
            <PeakPrices
              data={peakTimesData}
              serviceName={params.serviceType}
            />
            {searchParams.tab != "points" ? <Positions /> : <PointsData />}
          </>
        </TabsContent>
        <TabsContent value="orders" className=" flex flex-col gap-3">
          <DataTable
            columns={columns}
            currentPage={1}
            totalPages={1}
            data={[{}]}
            heading="طلبات السائقين"
          />
        </TabsContent>
        <TabsContent value="tools">
          <ToolsPage />
        </TabsContent>
      </Tabs>
    </>
  );
};

export default Index;
