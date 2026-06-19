"use client";
import { useRef, useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { fetcherClient } from "@/lib/fetcherClient";
import { useResponseToast } from "@/lib/toastUtils";
import { useLoading } from "@/contexts/LoadingContext";
import { revalidateServiceCache } from "@/app/actions/revalidate";

interface UsePricesDayFormProps {
  type: string;
  paymentMethods: any[];
  initialPriceValues: {
    base_price: string | number;
    price_per_km: string | number;
    price_per_minute: string | number;
    free_km?: string | number;
    minimum_charge: string | number;
    waiting_cost: string | number;
    cancellation_cost: string | number;
    cancellation_time?: string | number;
  };
  onBeforeSubmit?: (values: any) => any;
  onAfterSuccess?: () => void;
}

export const usePricesDayForm = ({
  type,
  paymentMethods,
  initialPriceValues,
  onBeforeSubmit,
  onAfterSuccess,
}: UsePricesDayFormProps) => {
  const params = useParams();
  const searchParams = useSearchParams();
  const { showResponseToast } = useResponseToast();
  const { startLoading, stopLoading } = useLoading();

  // Refs to store original values before submit
  const originalValuesRef = useRef(initialPriceValues);

  // State to force form values (prevents enableReinitialize from overwriting)
  const [forcedValues, setForcedValues] = useState<any>(null);

  // Update refs when props change
  useEffect(() => {
    originalValuesRef.current = initialPriceValues;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    initialPriceValues.base_price,
    initialPriceValues.price_per_km,
    initialPriceValues.price_per_minute,
    initialPriceValues.free_km,
    initialPriceValues.minimum_charge,
    initialPriceValues.waiting_cost,
    initialPriceValues.cancellation_cost,
    initialPriceValues.cancellation_time,
  ]);

  // Clear forced values only when unit changes (user selects different unit)
  useEffect(() => {
    setForcedValues(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get("subtype")]);

  const submitForm = async (values: any, { setSubmitting }: any) => {
    // Cache the original values before submitting
    originalValuesRef.current = initialPriceValues;

    // Allow modification of values before submission
    let finalValues = values;
    if (onBeforeSubmit) {
      finalValues = onBeforeSubmit(values);
    }

    const formdata: any = new FormData();
    formdata.append("is_coming_soon", Number(finalValues.is_coming_soon));
    formdata.append("is_hidden", Number(finalValues.is_hidden));

    // Add pricing fields (will be transformed by onBeforeSubmit if needed)
    Object.keys(finalValues).forEach((key) => {
      if (
        key !== "is_coming_soon" &&
        key !== "is_hidden" &&
        key !== "type" &&
        !paymentMethods.some((m) => m.title_key === key)
      ) {
        if (finalValues[key] !== undefined && finalValues[key] !== null && finalValues[key] !== "") {
          formdata.append(key, finalValues[key]);
        }
      }
    });

    formdata.append("type", type);

    // Add payment methods
    paymentMethods.forEach((method) => {
      formdata.append(`${method.title_key}`, Number(finalValues[method.title_key]));
    });

    // Add subtype if present
    if (searchParams.get("subtype")) {
      formdata.append("subtype", searchParams.get("subtype")!);
    }

    // Add zone_id if present
    if (searchParams.get("zone_id")) {
      formdata.append("zone_id", searchParams.get("zone_id")!);
    }

    startLoading();
    try {
      const response: any = await fetcherClient("/updateServiceSettings", {
        method: "POST",
        body: formdata,
      });
      showResponseToast(response);

      // Revalidate the cache to show updated values immediately
      if (response.status === "success" || response.success === true) {
        const serviceType = params.serviceType || type;
        await revalidateServiceCache(`service-${serviceType}`);

        // Execute after success callback if provided
        if (onAfterSuccess) {
          onAfterSuccess();
        }
      }
    } catch (error: any) {
      showResponseToast(error.info);
    } finally {
      stopLoading();
      setSubmitting(false);
    }
  };

  return {
    submitForm,
    originalValuesRef,
    forcedValues,
    setForcedValues,
  };
};
