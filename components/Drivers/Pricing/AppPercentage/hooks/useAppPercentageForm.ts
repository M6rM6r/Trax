import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import { fetcherClient } from "@/lib/fetcherClient";
import { useResponseToast } from "@/lib/toastUtils";
import { revalidateServiceCache } from "@/app/actions/revalidate";
import { useLoading } from "@/contexts/LoadingContext";

interface UseAppPercentageFormParams {
  app_percentage: string | number;
  type: string;
  onBeforeSubmit?: (formData: FormData, values: any) => FormData;
  onAfterSuccess?: (response: any) => void;
}

interface UseAppPercentageFormReturn {
  submitForm: (
    values: any,
    setSubmitting: (isSubmitting: boolean) => void,
    setFieldValue: (field: string, value: any) => void
  ) => Promise<void>;
  originalAppPercentageRef: React.MutableRefObject<string | number>;
  forcedValue: string | number | null;
  setForcedValue: React.Dispatch<React.SetStateAction<string | number | null>>;
}

/**
 * Custom hook for handling AppPercentage form submission
 *
 * @param app_percentage - Current app percentage value
 * @param type - Service type
 * @param onBeforeSubmit - Optional callback to modify formData before submission
 * @param onAfterSuccess - Optional callback after successful submission
 * @returns Form submission handler and state management
 */
export const useAppPercentageForm = ({
  app_percentage,
  type,
  onBeforeSubmit,
  onAfterSuccess,
}: UseAppPercentageFormParams): UseAppPercentageFormReturn => {
  const params = useParams();
  const { showResponseToast } = useResponseToast();
  const { startLoading, stopLoading } = useLoading();

  // Ref to store original app_percentage for value restoration
  const originalAppPercentageRef = useRef<string | number>(app_percentage);

  // State to force form values (prevents enableReinitialize from overwriting)
  const [forcedValue, setForcedValue] = useState<string | number | null>(null);

  /**
   * Handle form submission
   */
  const submitForm = async (
    values: any,
    setSubmitting: (isSubmitting: boolean) => void,
    setFieldValue: (field: string, value: any) => void
  ) => {
    // Cache the original app_percentage before submitting
    originalAppPercentageRef.current = app_percentage;

    // Build form data
    const formdata: any = new FormData();
    formdata.append("app_percentage", values.percentage);
    formdata.append("type", type);

    // Allow service-specific customization
    const finalFormData = onBeforeSubmit ? onBeforeSubmit(formdata, values) : formdata;

    startLoading();

    try {
      const response: any = await fetcherClient("/updateServiceSettings", {
        method: "POST",
        body: finalFormData,
      });
      showResponseToast(response);

      // Revalidate the cache to show updated values immediately
      if (response.status === "success" || response.success === true) {
        const serviceType = params.serviceType || type;

        // Clear forced value to allow cache to provide new value
        setForcedValue(null);

        // Call after success callback if provided
        if (onAfterSuccess) {
          onAfterSuccess(response);
        }

        await revalidateServiceCache(`service-${serviceType}`);
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
    originalAppPercentageRef,
    forcedValue,
    setForcedValue,
  };
};
