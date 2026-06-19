"use client";
import { useParams } from "next/navigation";
import { UnitsRecord } from "@/lib/types/responseTypes";

// Import all service components
import TaxiPricesDay from "./services/TaxiPricesDay";
import LightTransportationPricesDay from "./services/LightTransportationPricesDay";
import WenshPricesDay from "./services/WenshPricesDay";
import FontasPricesDay from "./services/FontasPricesDay";
import FastSupportPricesDay from "./services/FastSupportPricesDay";
import DriverWithoutCarPricesDay from "./services/DriverWithoutCarPricesDay";
import ImportantDatesPricesDay from "./services/ImportantDatesPricesDay";
import FuelPricesDay from "./services/FuelPricesDay";
import TiresPricesDay from "./services/TiresPricesDay";
import TowingPricesDay from "./services/TowingPricesDay";

interface IndexProps {
  is_coming_soon: string | number;
  is_hidden: string | number;
  price_per_km: string | number;
  price_per_minute: string | number;
  base_price: string | number;
  minimum_charge: string | number;
  waiting_cost: string | number;
  cancellation_cost: string | number;
  free_km?: string | number;
  type: string;
  service_settings: any[];
  isFontas?: boolean;
  unitBasicPrice?: number;
  fontasUnitLabel?: string;
  cancellation_time?: string | number;
  basic_time?: string | number;
  additional_time_price?: string | number;
  fontasUnits?: UnitsRecord[];
}

const Index = (props: IndexProps) => {
  const params = useParams();

  if (params.serviceType === "taxi") {
    return <TaxiPricesDay {...props} />;
  }

  if (params.serviceType === "light_transportation") {
    return <LightTransportationPricesDay {...props} />;
  }

  if (params.serviceType === "wensh") {
    return <WenshPricesDay {...props} />;
  }

  if (params.serviceType === "fontas") {
    return <FontasPricesDay {...props} />;
  }

  if (params.serviceType === "fast_support") {
    return <FastSupportPricesDay {...props} />;
  }

  if (params.serviceType === "driver_without_car") {
    return <DriverWithoutCarPricesDay {...props} />;
  }

  if (params.serviceType === "important_dates") {
    return <ImportantDatesPricesDay {...props} />;
  }

  if (params.serviceType === "fuel") {
    return <FuelPricesDay {...props} />;
  }

  if (params.serviceType === "tyries" || params.serviceType === "tires") {
    return <TiresPricesDay {...props} />;
  }

  if (params.serviceType === "towing") {
    return <TowingPricesDay {...props} />;
  }

  return null;
};

export default Index;
