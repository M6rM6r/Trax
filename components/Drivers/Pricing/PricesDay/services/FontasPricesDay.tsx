"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import PricesDayForm from "../components/PricesDayForm";
import StandardPricingFields from "../components/StandardPricingFields";
import FontasCheckboxes from "../components/FontasCheckboxes";
import FontasConfirmDialog from "../components/FontasConfirmDialog";
import { useFontasPricesDay } from "../hooks/useFontasPricesDay";
import { UnitsRecord } from "@/lib/types/responseTypes";

interface FontasPricesDayProps {
  is_coming_soon: string | number;
  is_hidden: string | number;
  price_per_km: string | number;
  price_per_minute: string | number;
  base_price: string | number;
  free_km?: string | number;
  cancellation_cost: string | number;
  cancellation_time?: string | number;
  type: string;
  service_settings: any[];
  isFontas?: boolean;
  fontasUnitLabel?: string;
  fontasUnits?: UnitsRecord[];
}

const FontasPricesDay = ({
  is_coming_soon,
  is_hidden,
  price_per_km,
  price_per_minute,
  base_price,
  free_km,
  cancellation_cost,
  cancellation_time,
  type,
  service_settings,
  fontasUnitLabel,
  fontasUnits,
}: FontasPricesDayProps) => {
  const searchParams = useSearchParams();
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  useEffect(() => {
    const filteredMethods = service_settings.filter(
      (item: any) => item.key === "payment_method"
    );
    setPaymentMethods(filteredMethods);
  }, [service_settings]);

  const {
    applyToAll,
    applyToValid,
    applyToInvalid,
    handleCheckboxChange,
    confirmOpen,
    confirmLoading,
    handleFontasConfirm,
    handleConfirmCancel,
    handleFormSubmit,
    forcedValues,
  } = useFontasPricesDay({
    type,
    fontasUnits,
    paymentMethods,
    initialPriceValues: {
      base_price,
      price_per_km,
      price_per_minute,
      free_km,
      cancellation_cost,
      cancellation_time,
    },
  });

  const initialValues = {
    is_coming_soon,
    is_hidden,
    base_price: forcedValues?.base_price ?? base_price,
    price_per_km: forcedValues?.price_per_km ?? price_per_km,
    price_per_minute: forcedValues?.price_per_minute ?? price_per_minute,
    free_km: forcedValues?.free_km ?? free_km,
    cancellation_cost: forcedValues?.cancellation_cost ?? cancellation_cost,
    cancellation_time: forcedValues?.cancellation_time ?? cancellation_time,
  };

  return (
    <>
      <PricesDayForm
        initialValues={initialValues}
        enableReinitialize={forcedValues === null}
        onSubmit={handleFormSubmit}
        service_settings={service_settings}
      >
        {() => (
          <>
            {/* Fontas pricing fields */}
            <StandardPricingFields
              includeFields={[
                "base_price",
                "price_per_km",
                "price_per_minute",
                "free_km",
                "cancellation_cost",
                "cancellation_time",
              ]}
              submitButton={false}
            />

            {/* Fontas checkboxes - Above button, right aligned */}
            <FontasCheckboxes
              applyToAll={applyToAll}
              applyToValid={applyToValid}
              applyToInvalid={applyToInvalid}
              onCheckboxChange={handleCheckboxChange}
            />

            {/* Submit button */}
            <Button
              type="submit"
              variant="primary"
              className="col-span-full max-w-[160px] self-end"
            >
              حفظ
            </Button>
          </>
        )}
      </PricesDayForm>

      {/* Fontas confirmation dialog */}
      <FontasConfirmDialog
        open={confirmOpen}
        loading={confirmLoading}
        applyToAll={applyToAll}
        applyToValid={applyToValid}
        applyToInvalid={applyToInvalid}
        fontasUnitLabel={fontasUnitLabel}
        zoneName={searchParams.get("zone_name") || undefined}
        onConfirm={handleFontasConfirm}
        onCancel={handleConfirmCancel}
      />
    </>
  );
};

export default FontasPricesDay;
