import { useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { fetcherClient } from "@/lib/fetcherClient";
import { useResponseToast } from "@/lib/toastUtils";
import { revalidateServiceCache } from "@/app/actions/revalidate";
import { useLoading } from "@/contexts/LoadingContext";
import { UnitsRecord } from "@/lib/types/responseTypes";

interface UseFontasAppPercentageParams {
  app_percentage: string | number;
  type: string;
  fontasUnits: UnitsRecord[] | undefined;
  selectedFontasUnit: string;
}

/**
 * Custom hook for Fontas service with complex checkbox and confirmation logic
 */
export const useFontasAppPercentage = ({
  app_percentage,
  type,
  fontasUnits,
  selectedFontasUnit,
}: UseFontasAppPercentageParams) => {
  const params = useParams();
  const searchParams = useSearchParams();
  const { showResponseToast } = useResponseToast();
  const { startLoading, stopLoading } = useLoading();

  // Checkbox states (only one can be checked at a time)
  const [applyToAll, setApplyToAll] = useState(false);
  const [applyToValid, setApplyToValid] = useState(false);
  const [applyToInvalid, setApplyToInvalid] = useState(false);

  // Confirmation dialog states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [pendingValues, setPendingValues] = useState<any>(null);
  const pendingSetSubmitting = useRef<((isSubmitting: boolean) => void) | null>(null);
  const pendingSetFieldValue = useRef<((field: string, value: any) => void) | null>(null);

  // Forced value state
  const [forcedValue, setForcedValue] = useState<string | number | null>(null);

  // Original value ref
  const originalAppPercentageRef = useRef<string | number>(app_percentage);

  /**
   * Get current selected fontas unit's type
   */
  const getCurrentUnitType = (): "valid" | "invalid" | null => {
    if (!fontasUnits || !selectedFontasUnit) {
      return null;
    }
    const unit = fontasUnits.find(u => u.id.toString() === selectedFontasUnit);
    if (!unit) {
      return null;
    }
    const unitType = unit.type === "صالح للشرب" ? "valid" : "invalid";
    return unitType;
  };

  /**
   * Handle checkbox change (only one can be checked at a time)
   */
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

  /**
   * Handle form submit - opens confirmation dialog
   */
  const handleFormSubmit = async (
    values: any,
    setSubmitting: (isSubmitting: boolean) => void,
    setFieldValue: (field: string, value: any) => void
  ) => {
    // Cache the original app_percentage before submitting
    originalAppPercentageRef.current = app_percentage;

    // Open confirmation dialog
    setPendingValues({
      ...values,
      _checkboxStates: { applyToAll, applyToValid, applyToInvalid }
    });
    pendingSetSubmitting.current = setSubmitting;
    pendingSetFieldValue.current = setFieldValue;
    setConfirmOpen(true);
  };

  /**
   * Handle confirmation submit - actually submits to API
   */
  const handleConfirmSubmit = async () => {
    if (!pendingValues) return;

    // Extract checkbox states from pendingValues
    const { _checkboxStates, ...formValues } = pendingValues;
    const savedApplyToAll = _checkboxStates?.applyToAll || false;
    const savedApplyToValid = _checkboxStates?.applyToValid || false;
    const savedApplyToInvalid = _checkboxStates?.applyToInvalid || false;

    setConfirmLoading(true);
    startLoading();

    const formdata: any = new FormData();
    formdata.append("app_percentage", formValues.percentage);
    formdata.append("type", type);

    // For fontas service with checkbox checked, don't send subtype
    if (savedApplyToAll || savedApplyToValid || savedApplyToInvalid) {
      // Don't send subtype to update all units
    } else if (searchParams.get("subtype")) {
      formdata.append("subtype", searchParams.get("subtype")!);
    }

    searchParams.get("zone_id") &&
      formdata.append("zone_id", searchParams.get("zone_id"));

    // Add apply_app_percentage_for parameter based on saved checkbox states
    if (savedApplyToAll) {
      formdata.append("apply_app_percentage_for", "all");
    } else if (savedApplyToValid) {
      formdata.append("apply_app_percentage_for", "valid");
    } else if (savedApplyToInvalid) {
      formdata.append("apply_app_percentage_for", "invalid");
    }

    try {
      const response: any = await fetcherClient(
        "/updateServiceSettings",
        {
          method: "POST",
          body: formdata,
        }
      );
      showResponseToast(response);

      if (response.status === "success" || response.success === true) {
        const serviceType = params.serviceType || type;

        // Use the saved checkbox states
        const wasApplyToAll = savedApplyToAll;
        const wasApplyToValid = savedApplyToValid;
        const wasApplyToInvalid = savedApplyToInvalid;

        // Fix value restoration for fontas service BEFORE cache revalidation
        if (wasApplyToAll || wasApplyToValid || wasApplyToInvalid) {
          const currentUnitType = getCurrentUnitType();
          const checkedType = wasApplyToAll ? "all" : wasApplyToValid ? "valid" : "invalid";

          if (checkedType === "all") {
            setForcedValue(null);
          } else if (
            (checkedType === "valid" && currentUnitType === "invalid") ||
            (checkedType === "invalid" && currentUnitType === "valid")
          ) {
            setForcedValue(originalAppPercentageRef.current);

            // Also update form value immediately using saved setFieldValue
            if (pendingSetFieldValue.current) {
              pendingSetFieldValue.current("percentage", originalAppPercentageRef.current);
            }
          } else {
            setForcedValue(null);
          }
        } else {
          setForcedValue(null);
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

  /**
   * Handle cancel confirmation
   */
  const handleCancelConfirm = () => {
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
    // Confirmation dialog states
    confirmOpen,
    confirmLoading,
    setConfirmOpen,
    // Form handling
    handleFormSubmit,
    handleConfirmSubmit,
    handleCancelConfirm,
    // Forced value
    forcedValue,
    setForcedValue,
  };
};
