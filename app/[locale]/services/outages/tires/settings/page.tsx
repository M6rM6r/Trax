import LocationBasedControl from "@/components/Drivers/Pricing/LocationBasedControl";
import PeakPrices from "@/components/Drivers/Pricing/PeakPrices";
import Positions from "@/components/Drivers/Pricing/Positions";
import BreadCrumb from "@/components/shared/BreadCrumb";
import MainLayout from "@/components/shared/MainLayout";
import { Separator } from "@/components/ui/separator";
import { fetcher } from "@/lib/fetcher";
import { getServiceSettingsValue } from "@/lib/helperFunctions";
import {
  PeakTimesResponse,
  ServiceSettingsResponse,
} from "@/lib/types/responseTypes";
import { Flash, Star } from "@/public/SVG";
import AppPercentage from "@/components/Services/Fuel/AppPercantage";
import PointsData from "@/components/Drivers/Pricing/PointsData";
import Prices from "@/components/Services/shared/Prices";
import ServicesTabsHeader from "@/components/Services/shared/ServicesTabsHeader";
const Page = async ({
  params,
  searchParams,
}: {
  params: { locale: string; serviceType: string };
  searchParams: { [key: string]: string };
}) => {
  const data = await fetcher<ServiceSettingsResponse>(
    `/tires/getServiceSettings?${searchParams.zone_id ? `zone_id=${searchParams.zone_id}` : ""
    }`,
    { cache: 'no-store' }
  );
  const peakTimesUrl = `/getPeakTimes?type=tires${searchParams.zone_id ? `&zone_id=${searchParams.zone_id}` : ""
    }${searchParams.subtype ? `&subtype=${searchParams.subtype}` : ""}`;
  const peakTimes = await fetcher<PeakTimesResponse>(`${peakTimesUrl}`, {
    cache: 'no-store'
  });

  // Convert single object to array if necessary
  const peakTimesData = Array.isArray(peakTimes?.data)
    ? peakTimes?.data
    : peakTimes?.data
      ? [peakTimes.data]
      : [];

  return (
    <MainLayout>
      <BreadCrumb
        labels={[
          {
            icon: <Star className="w-5 text-iconColor" />,
            label: "الخدمات",
          },
          {
            icon: <Star className="w-5 text-iconColor" />,
            label: "العطالات",
          },
          {
            icon: <Flash className="w-5 text-iconColor" />,
            label: "الاطارات",
          },
        ]}
      />
      <ServicesTabsHeader serviceName="tires" />

      <AppPercentage
        app_percentage={getServiceSettingsValue(data.data, "app_percentage")}
        type={params.serviceType}
        serviceName="tires"
      />
      <Separator className="h-[2px]" />
      <LocationBasedControl />
      <Prices
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
        service_price={getServiceSettingsValue(
          data.data,
          "service_price",
          searchParams.subtype
        )}
        tire_air_fill_price={getServiceSettingsValue(
          data.data,
          "tire_air_fill_price",
          searchParams.subtype
        )}
        external_patch_service_price={getServiceSettingsValue(
          data.data,
          "external_patch_service_price",
          searchParams.subtype
        )}
        change_tires_price={getServiceSettingsValue(
          data.data,
          "change_tires_price",
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
        service_settings={data.data}
        serviceName={"tires"}
      />
      <PeakPrices data={peakTimesData} serviceName={"tires"} />
      {searchParams.tab != "points" ? (
        <Positions serviceName={"tires"} />
      ) : (
        <PointsData />
      )}
    </MainLayout>
  );
};

export default Page;
