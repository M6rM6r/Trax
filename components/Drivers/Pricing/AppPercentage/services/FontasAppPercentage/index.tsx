"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { fetcherClient } from "@/lib/fetcherClient";
import { UnitsRecord, UnitsResponse } from "@/lib/types/responseTypes";
import { AppPercentageForm } from "../../components/AppPercentageForm";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { useFontasAppPercentage } from "./useFontasAppPercentage";
import { FontasCheckboxes } from "./FontasCheckboxes";
import { FontasDropdown } from "./FontasDropdown";
import { useFetchEnums } from "@/hooks/useAllEnums";
import { useLoading } from "@/contexts/LoadingContext";

interface FontasAppPercentageProps {
  app_percentage: string | number;
  type: string;
  fontasUnits?: UnitsRecord[];
}

/**
 * Fontas service AppPercentage component (COMPLEX)
 * Handles percentage input with:
 * - Dropdown for fontas units (grouped by valid/invalid water)
 * - 3 checkboxes for bulk updates
 * - Confirmation dialog before applying changes
 * - Complex value restoration logic
 */
const FontasAppPercentage = ({
  app_percentage,
  type,
  fontasUnits: fontasUnitsProp,
}: FontasAppPercentageProps) => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: dataEnums } = useFetchEnums();
  const { startLoading, stopLoading } = useLoading();
  const [fontasUnits, setFontasUnits] = useState<UnitsRecord[] | undefined>(fontasUnitsProp);
  const [selectedFontasUnit, setSelectedFontasUnit] = useState<string>("");

  // Refs for loading state and scroll position
  const isTransitionLoadingRef = useRef(false);
  const scrollPositionRef = useRef(0);

  // Use custom Fontas hook
  const {
    applyToAll,
    applyToValid,
    applyToInvalid,
    handleCheckboxChange,
    confirmOpen,
    confirmLoading,
    setConfirmOpen,
    handleFormSubmit,
    handleConfirmSubmit,
    handleCancelConfirm,
    forcedValue,
    setForcedValue,
  } = useFontasAppPercentage({
    app_percentage,
    type,
    fontasUnits,
    selectedFontasUnit,
  });

  // Fetch fontas units
  const fetchFontasUnits = async () => {
    try {
      const response = await fetcherClient<UnitsResponse>(`/fontasUnits?itemPerPage=50`);
      setFontasUnits(response.data.records);
      router.refresh();
    } catch (err) {
      console.error("Failed to fetch fontas units:", err);
    }
  };

  // Fetch fontas units on mount if not provided
  useEffect(() => {
    if (fontasUnitsProp) {
      setFontasUnits(fontasUnitsProp);
    } else {
      fetchFontasUnits();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontasUnitsProp]);

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

  // Auto-select first fontas unit if none selected or if selected unit doesn't exist
  useEffect(() => {
    if (fontasUnits && fontasUnits.length > 0) {
      const urlUnitId = searchParams.get("subtype");

      // Check if the URL subtype exists in the available units
      const unitExists = urlUnitId && fontasUnits.some(unit => unit.id.toString() === urlUnitId);

      if (unitExists) {
        // Unit exists, set it as selected
        setSelectedFontasUnit(urlUnitId);
      } else {
        // No unit selected or unit doesn't exist, select the first one
        // NOTE: Server-side redirect in page.tsx already handles the URL redirect for fontas
        // We only need to set the state here, not call router.replace
        const firstUnitId = fontasUnits[0].id.toString();
        setSelectedFontasUnit(firstUnitId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontasUnits]);

  // Clear forced value when unit changes
  useEffect(() => {
    setForcedValue(null);
  }, [selectedFontasUnit, setForcedValue]);

  // Handle dropdown change
  const handleSelectChange = (value: string) => {
    const paramss = new URLSearchParams(searchParams.toString());
    paramss.delete("unit_id");
    paramss.set("subtype", value);

    setSelectedFontasUnit(value);

    // Save current scroll position before loading
    scrollPositionRef.current = window.scrollY;

    // Start loading overlay for data transition
    isTransitionLoadingRef.current = true;
    startLoading();

    // Navigate to new URL (server-side redirect will handle the rest)
    router.replace(`?${paramss.toString()}`, { scroll: false });
  };

  // Get label for confirmation dialog
  const getFontasUnitLabel = () => {
    if (applyToAll) return "تطبيق التعديل للكل";
    if (applyToValid) return "تطبيق التعديل للمياه الصالحة للشرب";
    if (applyToInvalid) return "تطبيق التعديل للمياه الغير صالحة للشرب";

    // Find selected unit
    const selectedUnit = fontasUnits?.find(u => u.id.toString() === searchParams.get("subtype"));
    if (selectedUnit) {
      return `${selectedUnit.type} - ${selectedUnit.value} - ${selectedUnit.unit}`;
    }
    return "";
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Form Section with "fontas" layout (form left, checkboxes right) */}
      <AppPercentageForm
        initialValue={forcedValue !== null ? forcedValue : app_percentage || ""}
        enableReinitialize={forcedValue === null}
        onSubmit={(values, setSubmitting, setFieldValue) => {
          handleFormSubmit(values, setSubmitting, setFieldValue);
        }}
        formLayout="fontas"
      >
        {/* Checkboxes rendered on the right side */}
        <FontasCheckboxes
          applyToAll={applyToAll}
          applyToValid={applyToValid}
          applyToInvalid={applyToInvalid}
          onCheckboxChange={handleCheckboxChange}
        />
      </AppPercentageForm>

      {/* Dropdown Section */}
      {fontasUnits && fontasUnits.length > 0 && (
        <FontasDropdown
          value={selectedFontasUnit}
          onValueChange={handleSelectChange}
          fontasUnits={fontasUnits}
          dataEnums={dataEnums}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        loading={confirmLoading}
        zoneName={searchParams.get("zone_name") || "كامل المملكة"}
        scopeLabel={applyToAll || applyToValid || applyToInvalid ? "نطاق التطبيق" : "وحدة الفنطاس"}
        scopeValue={getFontasUnitLabel()}
        onConfirm={handleConfirmSubmit}
        onCancel={handleCancelConfirm}
        onOpenChange={setConfirmOpen}
      />
    </div>
  );
};

export default FontasAppPercentage;
