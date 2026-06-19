"use client";
import { useState, useEffect } from "react";
import CustomInput from "@/components/shared/form/CustomInput";
import PricesDayForm from "../components/PricesDayForm";
import StandardPricingFields from "../components/StandardPricingFields";
import { usePricesDayForm } from "../hooks/usePricesDayForm";

interface ImportantDatesPricesDayProps {
  is_coming_soon: string | number;
  is_hidden: string | number;
  base_price: string | number;
  basic_time?: string | number;
  additional_time_price?: string | number;
  waiting_cost: string | number;
  cancellation_cost: string | number;
  type: string;
  service_settings: any[];
}

const ImportantDatesPricesDay = ({
  is_coming_soon,
  is_hidden,
  base_price,
  basic_time,
  additional_time_price,
  waiting_cost,
  cancellation_cost,
  type,
  service_settings,
}: ImportantDatesPricesDayProps) => {
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
      price_per_km: 0, // Not used for important_dates
      price_per_minute: 0, // Not used for important_dates
      minimum_charge: 0, // Not used for important_dates
      waiting_cost,
      cancellation_cost,
    },
  });

  const initialValues = {
    is_coming_soon,
    is_hidden,
    base_price: forcedValues?.base_price ?? base_price,
    basic_time: basic_time,
    additional_time_price: additional_time_price,
    waiting_cost: forcedValues?.waiting_cost ?? waiting_cost,
    cancellation_cost: forcedValues?.cancellation_cost ?? cancellation_cost,
  };

  return (
    <PricesDayForm
      initialValues={initialValues}
      enableReinitialize={forcedValues === null}
      onSubmit={submitForm}
      service_settings={service_settings}
    >
      {() => (
        <>
          {/* Base price */}
          <CustomInput
            type="number"
            name="base_price"
            label="سعر ثابت"
            placeholder="0"
            step="0.1"
          />

          {/* Important Dates specific fields */}
          <CustomInput
            type="number"
            name="basic_time"
            label="الوقت المحدد للرحلة"
            placeholder="0"
            step="1"
          />
          <CustomInput
            type="number"
            name="additional_time_price"
            label="سعر الوقت الإضافي"
            placeholder="0"
            step="0.1"
          />

          {/* Standard fields: waiting_cost and cancellation_cost */}
          <StandardPricingFields
            includeFields={["waiting_cost", "cancellation_cost"]}
          />
        </>
      )}
    </PricesDayForm>
  );
};

export default ImportantDatesPricesDay;
