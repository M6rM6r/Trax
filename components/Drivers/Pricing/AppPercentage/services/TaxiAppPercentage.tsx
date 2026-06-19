"use client";
import { useParams, useSearchParams } from "next/navigation";
import { AppPercentageForm } from "../components/AppPercentageForm";
import { useAppPercentageForm } from "../hooks/useAppPercentageForm";

interface TaxiAppPercentageProps {
  app_percentage: string | number;
  type: string;
}

/**
 * Taxi service AppPercentage component (SIMPLE)
 * Just percentage input with save button - no dropdown, no checkboxes
 */
const TaxiAppPercentage = ({
  app_percentage,
  type,
}: TaxiAppPercentageProps) => {
  const searchParams = useSearchParams();

  // Use shared form hook
  const { submitForm } = useAppPercentageForm({
    app_percentage,
    type,
    onBeforeSubmit: (formdata) => {
      // Add zone_id if present
      if (searchParams.get("zone_id")) {
        formdata.append("zone_id", searchParams.get("zone_id")!);
      }
      return formdata;
    },
  });

  return (
    <AppPercentageForm
      initialValue={app_percentage || ""}
      enableReinitialize={true}
      onSubmit={submitForm}
      formLayout="default"
    />
  );
};

export default TaxiAppPercentage;
