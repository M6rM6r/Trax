"use client";
import { useParams } from "next/navigation";
import { UnitsRecord } from "@/lib/types/responseTypes";

// Import refactored service components
import LightTransportationAppPercentage from "./services/LightTransportationAppPercentage";
import WenshAppPercentage from "./services/WenshAppPercentage";
import FontasAppPercentage from "./services/FontasAppPercentage";
import TaxiAppPercentage from "./services/TaxiAppPercentage";
import ImportantDatesAppPercentage from "./services/ImportantDatesAppPercentage";
import DriverWithoutCarAppPercentage from "./services/DriverWithoutCarAppPercentage";
import FuelAppPercentage from "./services/FuelAppPercentage";
import TiresAppPercentage from "./services/TiresAppPercentage";
import TowingAppPercentage from "./services/TowingAppPercentage";

const Index = ({
  app_percentage,
  type,
  fontasUnits,
}: {
  app_percentage: string | number;
  type: string;
  fontasUnits?: UnitsRecord[];
}) => {
  const params = useParams();

  // ===== REFACTORED SERVICES ROUTING =====
  // Route to refactored service components
  if (params.serviceType === "light_transportation") {
    return <LightTransportationAppPercentage app_percentage={app_percentage} type={type} />;
  }

  if (params.serviceType === "wensh") {
    return <WenshAppPercentage app_percentage={app_percentage} type={type} />;
  }

  if (params.serviceType === "fontas") {
    return <FontasAppPercentage app_percentage={app_percentage} type={type} fontasUnits={fontasUnits} />;
  }

  if (params.serviceType === "taxi") {
    return <TaxiAppPercentage app_percentage={app_percentage} type={type} />;
  }

  if (params.serviceType === "important_dates") {
    return <ImportantDatesAppPercentage app_percentage={app_percentage} type={type} />;
  }

  if (params.serviceType === "driver_without_car") {
    return <DriverWithoutCarAppPercentage app_percentage={app_percentage} type={type} />;
  }

  // Outages services
  if (params.serviceType === "fuel") {
    return <FuelAppPercentage app_percentage={app_percentage} type={type} />;
  }

  if (params.serviceType === "tires") {
    return <TiresAppPercentage app_percentage={app_percentage} type={type} />;
  }

  if (params.serviceType === "towing") {
    return <TowingAppPercentage app_percentage={app_percentage} type={type} />;
  }
  // ===== END REFACTORED SERVICES ROUTING =====

  // Fallback - should never reach here as all services are handled above
  return null;
};

export default Index;
