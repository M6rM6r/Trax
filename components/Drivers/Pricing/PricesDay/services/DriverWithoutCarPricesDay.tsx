"use client";
import { useState, useEffect } from "react";
import CustomInput from "@/components/shared/form/CustomInput";
import { Button } from "@/components/ui/button";
import PricesDayForm from "../components/PricesDayForm";
import { usePricesDayForm } from "../hooks/usePricesDayForm";

interface DriverWithoutCarPricesDayProps {
  is_coming_soon: string | number;
  is_hidden: string | number;
  base_price: string | number;
  type: string;
  service_settings: any[];
}

const DriverWithoutCarPricesDay = ({
  is_coming_soon,
  is_hidden,
  base_price,
  type,
  service_settings,
}: DriverWithoutCarPricesDayProps) => {
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
      price_per_km: 0,
      price_per_minute: 0,
      minimum_charge: 0,
      waiting_cost: 0,
      cancellation_cost: 0,
    },
    onBeforeSubmit: (values) => {
      // Transform base_price to price_per_time_period for driver_without_car
      const { base_price, ...rest } = values;
      return {
        ...rest,
        price_per_time_period: base_price,
      };
    },
  });

  const initialValues = {
    is_coming_soon,
    is_hidden,
    base_price: forcedValues?.base_price ?? base_price,
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
          <CustomInput
            type="number"
            name="base_price"
            label="سعر اليوم"
            placeholder="0"
            step="0.1"
          />
          <Button
            type="submit"
            variant="primary"
            className="col-span-full max-w-[160px]"
          >
            حفظ
          </Button>
        </>
      )}
    </PricesDayForm>
  );
};

export default DriverWithoutCarPricesDay;
