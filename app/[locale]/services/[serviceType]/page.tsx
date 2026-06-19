import AppPercentage from "@/components/Drivers/Pricing/AppPercentage";
import LocationBasedControl from "@/components/Drivers/Pricing/LocationBasedControl";
import PeakPrices from "@/components/Drivers/Pricing/PeakPrices";
import PointsData from "@/components/Drivers/Pricing/PointsData";
import Positions from "@/components/Drivers/Pricing/Positions";
import PricesDay from "@/components/Drivers/Pricing/PricesDay";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { DataTable } from "@/components/shared/DataTable/data-table";
import MainLayout from "@/components/shared/MainLayout";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetcher } from "@/lib/fetcher";
import { getServiceSettingsValue } from "@/lib/helperFunctions";
import {
  ListLightTransportationCargo,
  PeakTimesResponse,
  ServiceSettingsResponse,
  UnitsRecord,
  UnitsResponse,
} from "@/lib/types/responseTypes";
import { Add, Flash, Star } from "@/public/SVG";
import { columns } from "./columns";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ServicesTyriesPage from "@/components/Services/ServicesTyriesPage";
import LightTransportationTabs from "@/components/Services/LightTransportationTabs";
import { redirect } from "next/navigation";
import ServicePageProvider from "@/components/Services/ServicePageProvider";

// Force dynamic rendering - no static optimization
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const Page = async ({
  params,
  searchParams,
}: {
  params: { locale: string; serviceType: string };
  searchParams: { [key: string]: string };
}) => {
  const urlParams = new URLSearchParams(searchParams);
  const data = await fetcher<ServiceSettingsResponse>(
    `/getServiceSettings?type=${params.serviceType}${searchParams.zone_id ? `&zone_id=${searchParams.zone_id}` : ""
    }${searchParams.subtype ? `&subtype=${searchParams.subtype}` : ""}`,
    { cache: 'no-store' } // Disable caching for fresh data
  );
  const peakTimesUrl = `/getPeakTimes?type=${params.serviceType}${searchParams.zone_id ? `&zone_id=${searchParams.zone_id}` : ""
    }${searchParams.subtype
      ? `&subtype=${searchParams.subtype === "fast_support"
        ? "light_transportation"
        : searchParams.subtype
      }`
      : ""
    }`;
  const peakTimes = await fetcher<PeakTimesResponse>(`${peakTimesUrl}`, {
    cache: 'no-store' // Disable caching for fresh data
  });

  // Convert single object to array if necessary and filter out empty objects
  const peakTimesData = Array.isArray(peakTimes?.data)
    ? peakTimes.data.filter((item) => item && Object.keys(item).length > 0)
    : peakTimes?.data && Object.keys(peakTimes.data).length > 0
      ? [peakTimes.data]
      : [];

  // Only fetch lightTransportationCargo for service types that use it
  let ListData: ListLightTransportationCargo | undefined = undefined;
  if (params.serviceType === "light_transportation" || params.serviceType === "fast_support") {
    ListData = await fetcher<ListLightTransportationCargo>(
      `/lightTransportationCargo?${urlParams.toString()}`,
      { cache: 'no-store' } // Disable caching for fresh data
    );
  }

  let fontasUnits: UnitsRecord[] | undefined = undefined;
  let unitBasicPrice: number | undefined = undefined;
  let fontasUnitLabel: string | undefined = undefined;

  if (params.serviceType === "fontas") {
    const fontasUnitsRes = await fetcher<UnitsResponse>(`/fontasUnits?itemPerPage=50`, {
      cache: "no-store",
    });
    fontasUnits = fontasUnitsRes?.data?.records;

    // If no subtype in URL or subtype doesn't exist, redirect to first unit
    if (fontasUnits && fontasUnits.length > 0) {
      const urlSubtype = searchParams.subtype;
      const unitExists = urlSubtype && fontasUnits.some(u => u.id.toString() === urlSubtype);

      if (!unitExists) {
        // No subtype or invalid subtype - redirect to first unit
        const firstUnitId = fontasUnits[0].id.toString();
        const newParams = new URLSearchParams(searchParams);
        newParams.set("subtype", firstUnitId);
        redirect(`/${params.locale}/services/${params.serviceType}?${newParams.toString()}`);
      }
    }

    if (searchParams.subtype && fontasUnits) {
      const selectedUnit = fontasUnits.find(
        (u) => u.id.toString() === searchParams.subtype
      );
      if (selectedUnit) {
        unitBasicPrice = selectedUnit.basic_price;
        fontasUnitLabel = `${selectedUnit.type} - ${selectedUnit.value} - ${selectedUnit.unit}`;
      }
    }
  }

  return (
    <ServicePageProvider>
      <MainLayout>
        <BreadCrumb
        labels={[
          {
            icon: <Star className="w-5 text-iconColor" />,
            label: "الخدمات",
          },
          {
            icon: <Flash className="w-5 text-iconColor" />,
            label:
              params.serviceType == "taxi"
                ? "تاكسي"
                : params.serviceType == "fontas"
                  ? "وايت ماء"
                  : params.serviceType == "wensh"
                    ? "سطحات ودينات "
                    : params.serviceType == "light_transportation"
                      ? "النقل الخفيف"
                      : params.serviceType == "fast_support"
                        ? " العطالات"
                        : params.serviceType == "driver_without_car"
                          ? "سائق بدون سيارة"
                          : params.serviceType == "tyries"
                            ? "الإطارات"
                            : "مواعيد مهمة",
          },
        ]}
      />
      {params.serviceType === "light_transportation" ? (
        <>
          <LightTransportationTabs
            lightTransportationContent={
              <>
                <AppPercentage
                  app_percentage={getServiceSettingsValue(
                    data.data,
                    "app_percentage",
                    searchParams.subtype
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
                {searchParams.tab != "points" ? (
                  <Positions serviceName={params.serviceType} />
                ) : (
                  <PointsData />
                )}
              </>
            }
            lightTransportationGoodsContent={
              <DataTable
                columns={columns}
                currentPage={ListData!.data.pagination_data.current_page}
                totalPages={ListData!.data.pagination_data.total_pages}
                data={ListData!.data.records}
                heading="أنواع بضاعات النقل الخفيف"
                topComponent={
                  <Button variant="primary" size="lg" asChild>
                    <Link
                      href={`/${params.locale}/services/lightTransportationGoods/add`}
                      className=" text-18 text-white font-[600] flex items-center gap-2 "
                    >
                      أضف نوع
                      <Add className="w-6 text-white" />
                    </Link>
                  </Button>
                }
              />
            }
          />
        </>
      ) : params.serviceType === "fast_support" ? (
        <>
          <Tabs dir="rtl" defaultValue="fast_support" className="w-full">
            <TabsList className="w-full bg-transparent">
              <TabsTrigger
                value="fast_support"
                className=" grow border-b-[2px] border-b-iconColor pb-2  "
              >
                العطالات
              </TabsTrigger>
              <TabsTrigger
                value="fast_support_goods"
                className=" grow border-b-[2px] border-b-iconColor pb-2  "
              >
                بضاعات العطالات
              </TabsTrigger>
            </TabsList>
            <TabsContent value="fast_support" className=" flex flex-col gap-3">
              <>
                <AppPercentage
                  app_percentage={getServiceSettingsValue(
                    data.data,
                    "app_percentage",
                    searchParams.subtype
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
                {searchParams.tab != "points" ? (
                  <Positions serviceName={params.serviceType} />
                ) : (
                  <PointsData />
                )}
              </>
            </TabsContent>
            <TabsContent
              value="fast_support_goods"
              className="flex flex-col gap-3"
            >
              <DataTable
                columns={columns}
                currentPage={ListData!.data.pagination_data.current_page}
                totalPages={ListData!.data.pagination_data.total_pages}
                data={ListData!.data.records}
                heading="أنواع بضاعات النقل الخفيف"
                topComponent={
                  <Button variant="primary" size="lg" asChild>
                    <Link
                      href={`/${params.locale}/services/lightTransportationGoods/add`}
                      className=" text-18 text-white font-[600] flex items-center gap-2 "
                    >
                      أضف نوع
                      <Add className="w-6 text-white" />
                    </Link>
                  </Button>
                }
              />
            </TabsContent>
          </Tabs>
        </>
      ) : params.serviceType === "tyries" ? (
        <>
          <ServicesTyriesPage
            params={params}
            searchParams={searchParams}
            data={data}
            peakTimes={peakTimes}
          />
        </>
      ) : (
        <>
          <AppPercentage
            app_percentage={getServiceSettingsValue(
              data.data,
              "app_percentage",
              searchParams.subtype
            )}
            type={params.serviceType}
            fontasUnits={fontasUnits}
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
            base_price={
              params.serviceType === "driver_without_car"
                ? getServiceSettingsValue(
                  data.data,
                  "price_per_time_period",
                  searchParams.subtype
                )
                : getServiceSettingsValue(
                  data.data,
                  "base_price",
                  searchParams.subtype
                )
            }
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
            cancellation_time={getServiceSettingsValue(
              data.data,
              "cancellation_time",
              searchParams.subtype
            )}
            basic_time={getServiceSettingsValue(
              data.data,
              "basic_time",
              searchParams.subtype
            )}
            additional_time_price={getServiceSettingsValue(
              data.data,
              "additional_time_price",
              searchParams.subtype
            )}
            type={params.serviceType}
            service_settings={data.data}
            isFontas={params.serviceType === "fontas"}
            unitBasicPrice={unitBasicPrice}
            fontasUnitLabel={fontasUnitLabel}
            fontasUnits={fontasUnits}
          />
          <PeakPrices data={peakTimesData} serviceName={params.serviceType} fontasUnitLabel={fontasUnitLabel} fontasUnits={fontasUnits} />
          {searchParams.tab != "points" ? (
            <Positions serviceName={params.serviceType} />
          ) : (
            <PointsData />
          )}
        </>
      )}
      </MainLayout>
    </ServicePageProvider>
  );
};

export default Page;
