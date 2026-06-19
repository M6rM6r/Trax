"use client";
import { useRef, useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { fetcherClient } from "@/lib/fetcherClient";
import { useResponseToast } from "@/lib/toastUtils";
import { useLoading } from "@/contexts/LoadingContext";
import { revalidateServiceCache } from "@/app/actions/revalidate";
import { UnitsRecord } from "@/lib/types/responseTypes";

interface UseFontasPricesDayProps {
  type: string;
  fontasUnits?: UnitsRecord[];
  paymentMethods: any[];
  initialPriceValues: {
    base_price: string | number;
    price_per_km: string | number;
    price_per_minute: string | number;
    free_km?: string | number;
    cancellation_cost: string | number;
    cancellation_time?: string | number;
  };
}

export const useFontasPricesDay = ({
  type,
  fontasUnits,
  paymentMethods,
  initialPriceValues,
}: UseFontasPricesDayProps) => {
  const params = useParams();
  const searchParams = useSearchParams();
  const { showResponseToast } = useResponseToast();
  const { startLoading, stopLoading } = useLoading();

  // Checkbox states
  const [applyToAll, setApplyToAll] = useState(false);
  const [applyToValid, setApplyToValid] = useState(false);
  const [applyToInvalid, setApplyToInvalid] = useState(false);

  // Confirmation dialog states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Pending values and form helpers
  const [pendingValues, setPendingValues] = useState<any>(null);
  const pendingSetSubmitting = useRef<((isSubmitting: boolean) => void) | null>(null);
  const pendingSetFieldValue = useRef<((field: string, value: any) => void) | null>(null);

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
    initialPriceValues.cancellation_cost,
    initialPriceValues.cancellation_time,
  ]);

  // Clear forced values only when unit changes (user selects different unit)
  useEffect(() => {
    setForcedValues(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get("subtype")]);

  // Get current selected fontas unit's type
  const getCurrentUnitType = (): "valid" | "invalid" | null => {
    if (!fontasUnits || !searchParams.get("subtype")) return null;
    const unit = fontasUnits.find((u) => u.id.toString() === searchParams.get("subtype"));
    if (!unit) return null;
    return unit.type === "صالح للشرب" ? "valid" : "invalid";
  };

  // Handle checkbox change (only one can be checked at a time)
  const handleCheckboxChange = (checkboxType: "all" | "valid" | "invalid") => {
    if (checkboxType === "all") {
      setApplyToAll(!applyToAll);
      setApplyToValid(false);
      setApplyToInvalid(false);
    } else if (checkboxType === "valid") {
      setApplyToValid(!applyToValid);
      setApplyToAll(false);
      setApplyToInvalid(false);
    } else if (checkboxType === "invalid") {
      setApplyToInvalid(!applyToInvalid);
      setApplyToAll(false);
      setApplyToValid(false);
    }
  };

  // Handle form submission - captures values and opens confirmation dialog
  const handleFormSubmit = async (values: any, { setSubmitting, setFieldValue }: any) => {
    // Cache the original values before submitting
    originalValuesRef.current = initialPriceValues;

    const unitId = searchParams.get("subtype");
    if (!unitId) return;

    // Save form values AND checkbox states together
    setPendingValues({
      ...values,
      _checkboxStates: { applyToAll, applyToValid, applyToInvalid },
    });
    pendingSetSubmitting.current = setSubmitting;
    pendingSetFieldValue.current = setFieldValue;
    setConfirmOpen(true);
  };

  // Handle fontas confirmation - updates service settings
  const handleFontasConfirm = async () => {
    if (!pendingValues) return;
    const unitId = searchParams.get("subtype");
    if (!unitId) return;

    // Extract checkbox states from pendingValues
    const { _checkboxStates, ...formValues } = pendingValues;
    const savedApplyToAll = _checkboxStates?.applyToAll || false;
    const savedApplyToValid = _checkboxStates?.applyToValid || false;
    const savedApplyToInvalid = _checkboxStates?.applyToInvalid || false;

    setConfirmLoading(true);
    startLoading();

    try {
      // Update service settings with pricing
      const settingsFormData: any = new FormData();
      settingsFormData.append("type", type);
      settingsFormData.append("base_price", formValues.base_price);
      settingsFormData.append("price_per_km", formValues.price_per_km);
      settingsFormData.append("price_per_minute", formValues.price_per_minute);
      settingsFormData.append("cancellation_cost", formValues.cancellation_cost);
      if (formValues.free_km) settingsFormData.append("free_km", formValues.free_km);
      if (formValues.cancellation_time) settingsFormData.append("cancellation_time", formValues.cancellation_time);

      // Add payment methods
      paymentMethods.forEach((method) => {
        settingsFormData.append(`${method.title_key}`, Number(formValues[method.title_key]));
      });

      // Add is_coming_soon and is_hidden
      settingsFormData.append("is_coming_soon", Number(formValues.is_coming_soon));
      settingsFormData.append("is_hidden", Number(formValues.is_hidden));

      // Only send subtype if NO checkbox is checked (normal single-unit update)
      // When checkbox is checked, we want to update ALL units of that type, not just the current one
      if (!savedApplyToAll && !savedApplyToValid && !savedApplyToInvalid) {
        settingsFormData.append("subtype", unitId);
      }

      if (searchParams.get("zone_id")) {
        settingsFormData.append("zone_id", searchParams.get("zone_id")!);
      }

      // Add apply_prices_for parameter based on saved checkbox states
      if (savedApplyToAll) {
        settingsFormData.append("apply_prices_for", "all");
      } else if (savedApplyToValid) {
        settingsFormData.append("apply_prices_for", "valid");
      } else if (savedApplyToInvalid) {
        settingsFormData.append("apply_prices_for", "invalid");
      }

      const settingsResponse: any = await fetcherClient("/updateServiceSettings", {
        method: "POST",
        body: settingsFormData,
      });

      if (settingsResponse.status === "success" || settingsResponse.success === true) {
        const serviceType = params.serviceType || type;

        // Use the saved checkbox states (from when the popup opened)
        const wasApplyToAll = savedApplyToAll;
        const wasApplyToValid = savedApplyToValid;
        const wasApplyToInvalid = savedApplyToInvalid;

        // Fix value restoration for fontas service BEFORE cache revalidation
        if (wasApplyToAll || wasApplyToValid || wasApplyToInvalid) {
          const currentUnitType = getCurrentUnitType();
          const checkedType = wasApplyToAll ? "all" : wasApplyToValid ? "valid" : "invalid";

          // If checkbox type doesn't match current unit type, restore original values
          if (checkedType === "all") {
            // All units updated, cache will provide the correct value
            setForcedValues(null);
          } else if (
            (checkedType === "valid" && currentUnitType === "invalid") ||
            (checkedType === "invalid" && currentUnitType === "valid")
          ) {
            // Checkbox type doesn't match current unit, restore original values
            setForcedValues(originalValuesRef.current);

            // Also update form values immediately using saved setFieldValue
            if (pendingSetFieldValue.current) {
              pendingSetFieldValue.current("base_price", originalValuesRef.current.base_price);
              pendingSetFieldValue.current("price_per_km", originalValuesRef.current.price_per_km);
              pendingSetFieldValue.current("price_per_minute", originalValuesRef.current.price_per_minute);
              pendingSetFieldValue.current("free_km", originalValuesRef.current.free_km);
              pendingSetFieldValue.current("cancellation_cost", originalValuesRef.current.cancellation_cost);
              pendingSetFieldValue.current("cancellation_time", originalValuesRef.current.cancellation_time);
            }
          } else {
            // Types match, cache will provide the updated values
            setForcedValues(null);
          }
        } else {
          // No checkbox checked, normal update - clear forced values
          setForcedValues(null);
        }

        await revalidateServiceCache(`service-${serviceType}`);

        // Uncheck all checkboxes after success
        setApplyToAll(false);
        setApplyToValid(false);
        setApplyToInvalid(false);
      }
    } catch (error: any) {
      showResponseToast(error.info);
    } finally {
      stopLoading();
      setConfirmLoading(false);
      setConfirmOpen(false);
      setPendingValues(null);
      pendingSetSubmitting.current?.(false);
      pendingSetSubmitting.current = null;
      pendingSetFieldValue.current = null;
    }
  };

  const handleConfirmCancel = () => {
    setConfirmOpen(false);
    setPendingValues(null);
    pendingSetSubmitting.current?.(false);
    pendingSetSubmitting.current = null;
    pendingSetFieldValue.current = null;
  };

  return {
    // Checkbox states
    applyToAll,
    applyToValid,
    applyToInvalid,
    handleCheckboxChange,

    // Confirmation dialog
    confirmOpen,
    confirmLoading,
    handleFontasConfirm,
    handleConfirmCancel,

    // Form submission
    handleFormSubmit,

    // Value management
    originalValuesRef,
    forcedValues,
    setForcedValues,

    // Utilities
    getCurrentUnitType,
  };
};
