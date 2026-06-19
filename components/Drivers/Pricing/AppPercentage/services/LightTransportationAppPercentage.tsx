"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { fetcherClient } from "@/lib/fetcherClient";
import { EnumDDLData, EnumDDLResponse } from "@/lib/types/responseTypes";
import { useAppPercentageForm } from "../hooks/useAppPercentageForm";
import { useServiceDropdown } from "../hooks/useServiceDropdown";
import { AppPercentageForm } from "../components/AppPercentageForm";
import { ServiceDropdown } from "../components/ServiceDropdown";
import { useLoading } from "@/contexts/LoadingContext";

interface LightTransportationAppPercentageProps {
  app_percentage: string | number;
  type: string;
}

/**
 * Light Transportation service AppPercentage component
 * Handles percentage input with vehicle type dropdown
 */
const LightTransportationAppPercentage = ({
  app_percentage,
  type,
}: LightTransportationAppPercentageProps) => {
  const params = useParams();
  const searchParams = useSearchParams();
  const { stopLoading } = useLoading();
  const [data, setData] = useState<EnumDDLData>();
  const [selectedSubtype, setSelectedSubtype] = useState<string>("");

  // Use shared hooks
  const { submitForm, forcedValue, setForcedValue } = useAppPercentageForm({
    app_percentage,
    type,
    onBeforeSubmit: (formdata) => {
      // Add subtype to form data
      if (searchParams.get("subtype")) {
        formdata.append("subtype", searchParams.get("subtype")!);
      }
      if (searchParams.get("zone_id")) {
        formdata.append("zone_id", searchParams.get("zone_id")!);
      }
      return formdata;
    },
  });

  const { handleSelectChange, isTransitionLoadingRef, scrollPositionRef } = useServiceDropdown({
    onSelectChange: (value) => {
      setSelectedSubtype(value);
      // Clear forced value when user changes selection
      setForcedValue(null);
    },
  });

  // Fetch light transportation types enum
  const fetchSubType = async () => {
    try {
      const response = await fetcherClient<EnumDDLResponse>(
        `/enumDDLList?enum_name=LightTransportationTypes`
      );
      setData(response.data);
    } catch (err) {
      console.error("Failed to fetch light transportation types:", err);
    }
  };

  // Fetch enum on mount
  useEffect(() => {
    fetchSubType();
  }, []);

  // Stop loading when new data arrives after dropdown change
  useEffect(() => {
    if (isTransitionLoadingRef.current) {
      // Data has loaded, stop the loading overlay
      stopLoading();
      isTransitionLoadingRef.current = false;

      // Restore scroll position after CSS and DOM are fully updated
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({
            top: scrollPositionRef.current,
            behavior: "instant" as ScrollBehavior,
          });
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app_percentage, searchParams]);

  // Auto-select first subtype if none selected or if selected doesn't exist
  useEffect(() => {
    if (data?.records && data.records.length > 0) {
      const urlSubtype = searchParams.get("subtype");

      // Check if the URL subtype exists in the available subtypes
      const subtypeExists =
        urlSubtype && data.records.some((item) => item.key === urlSubtype);

      if (subtypeExists) {
        // Subtype exists, set it as selected
        setSelectedSubtype(urlSubtype);
      } else {
        // No subtype selected or subtype doesn't exist, select the first one
        const firstSubtype = data.records[0].key;
        setSelectedSubtype(firstSubtype);

        // Use setTimeout to prevent race conditions during fast navigation
        const timeoutId = setTimeout(() => {
          handleSelectChange(firstSubtype, true); // Skip loading overlay on auto-select
        }, 100);

        return () => clearTimeout(timeoutId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <div className="flex flex-col gap-5">
      {/* Form Section */}
      <AppPercentageForm
        initialValue={forcedValue !== null ? forcedValue : app_percentage || ""}
        enableReinitialize={forcedValue === null}
        onSubmit={(values, setSubmitting, setFieldValue) => {
          submitForm(values, setSubmitting, setFieldValue);
        }}
        formLayout="default"
      />

      {/* Dropdown Section */}
      {data?.records && data.records.length > 0 && (
        <ServiceDropdown
          value={selectedSubtype}
          onValueChange={handleSelectChange}
          items={data.records}
          placeholder="اختر النوع"
        />
      )}
    </div>
  );
};

export default LightTransportationAppPercentage;
