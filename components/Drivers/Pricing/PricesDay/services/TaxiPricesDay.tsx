"use client";
import { useState, useEffect } from "react";
import PricesDayForm from "../components/PricesDayForm";
import StandardPricingFields from "../components/StandardPricingFields";
import { usePricesDayForm } from "../hooks/usePricesDayForm";

interface TaxiPricesDayProps {
  is_coming_soon: string | number;
  is_hidden: string | number;
  price_per_km: string | number;
  price_per_minute: string | number;
  base_price: string | number;
  minimum_charge: string | number;
  waiting_cost: string | number;
  cancellation_cost: string | number;
  cancellation_time?: string | number;
  type: string;
  service_settings: any[];
}

const TaxiPricesDay = ({
  is_coming_soon,
  is_hidden,
  price_per_km,
  price_per_minute,
  base_price,
  minimum_charge,
  waiting_cost,
  cancellation_cost,
  cancellation_time,
  type,
  service_settings,
}: TaxiPricesDayProps) => {
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  useEffect(() => {
    const filteredMethods = service_settings.filter(
      (item: any) => item.key === "payment_method"
    );
    setPaymentMethods(filteredMethods);
  }, [service_settings]);

  const { submitForm, forcedValues } = usePricesDayForm({
    type,
    paymentMethods,
    initialPriceValues: {
      base_price,
      price_per_km,
      price_per_minute,
      minimum_charge,
      waiting_cost,
      cancellation_cost,
      cancellation_time,
    },
  });

  const initialValues = {
    is_coming_soon,
    is_hidden,
    price_per_km: forcedValues?.price_per_km ?? price_per_km,
    price_per_minute: forcedValues?.price_per_minute ?? price_per_minute,
    base_price: forcedValues?.base_price ?? base_price,
    minimum_charge: forcedValues?.minimum_charge ?? minimum_charge,
    waiting_cost: forcedValues?.waiting_cost ?? waiting_cost,
    cancellation_cost: forcedValues?.cancellation_cost ?? cancellation_cost,
    cancellation_time: forcedValues?.cancellation_time ?? cancellation_time,
  };

  return (
    <PricesDayForm
      initialValues={initialValues}
      enableReinitialize={forcedValues === null}
      onSubmit={submitForm}
      service_settings={service_settings}
    >
      {() => (
        <StandardPricingFields
          includeFields={[
            "price_per_km",
            "price_per_minute",
            "base_price",
            "minimum_charge",
            "waiting_cost",
            "cancellation_cost",
            "cancellation_time",
          ]}
        />
      )}
    </PricesDayForm>
  );
};

export default TaxiPricesDay;
