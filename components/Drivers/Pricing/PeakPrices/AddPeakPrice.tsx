"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import CustomDialog, { Colors } from "@/components/shared/CustomDialog";
import { Add } from "@/public/SVG";
import { Form, Formik } from "formik";
import CustomInput from "@/components/shared/form/CustomInput";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { ChangeTimeFormate } from "@/lib/helperFunctions";
import { useResponseToast } from "@/lib/toastUtils";
import { fetcherClient } from "@/lib/fetcherClient";
import { validationForPeakTimes } from "@/lib/types/validationTypes";
import { PeakTimeData, UnitsRecord } from "@/lib/types/responseTypes";
import { Checkbox } from "@/components/ui/checkbox";
import { useLoading } from "@/contexts/LoadingContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertTriangle } from "@/public/SVG";
const CustomSelect = dynamic(
  () => import("@/components/shared/form/CustomSelect"),
  { ssr: false }
);

// Helper function to convert time string to minutes from midnight
const timeToMinutes = (time: string): number => {
  const [timePart, ampm] = time.split(" ");
  const [hours, minutes] = timePart.split(":").map(Number);
  let totalMinutes = hours * 60 + minutes;
  if (ampm?.toLowerCase() === "pm" && hours !== 12) {
    totalMinutes += 12 * 60;
  } else if (ampm?.toLowerCase() === "am" && hours === 12) {
    totalMinutes -= 12 * 60;
  }
  return totalMinutes;
};

// Helper function to check if two time ranges overlap
const checkTimeOverlap = (
  start1: number,
  end1: number,
  start2: number,
  end2: number
): boolean => {
  return start1 < end2 && start2 < end1;
};

// Check if new peak time overlaps with existing ones
const hasOverlap = (
  day: string,
  startTime: string,
  endTime: string,
  existingPeakTimes: PeakTimeData[],
  excludeId?: number
): boolean => {
  const newStart = timeToMinutes(ChangeTimeFormate(startTime) || "");
  const newEnd = timeToMinutes(ChangeTimeFormate(endTime) || "");

  return existingPeakTimes.some((peakTime) => {
    if (excludeId && peakTime.id === excludeId) return false;
    if (peakTime.day.toLowerCase() !== day.toLowerCase()) return false;

    const existingStart = timeToMinutes(peakTime.start_time);
    const existingEnd = timeToMinutes(peakTime.end_time);

    return checkTimeOverlap(newStart, newEnd, existingStart, existingEnd);
  });
};

type IndexProps = {
  serviceName?: string;
  fontasUnitLabel?: string;
  existingPeakTimes?: PeakTimeData[];
  fontasUnits?: UnitsRecord[];
};

const Index: React.FC<IndexProps> = ({ serviceName, fontasUnitLabel, existingPeakTimes = [], fontasUnits = [] }) => {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showResponseToast } = useResponseToast();
  const { startLoading, stopLoading } = useLoading();
  const [open, setOpen] = React.useState(false);
  const [overlapError, setOverlapError] = React.useState<string | null>(null);

  // Fontas checkboxes state
  const [applyToAll, setApplyToAll] = useState(false);
  const [applyToValid, setApplyToValid] = useState(false);
  const [applyToInvalid, setApplyToInvalid] = useState(false);

  // Overlapped subtypes dialog state
  const [showOverlapDialog, setShowOverlapDialog] = useState(false);
  const [overlappedSubtypes, setOverlappedSubtypes] = useState<number[]>([]);

  // Use serviceName prop or fallback to params.serviceType
  const serviceType = serviceName || (params.serviceType as string);

  // Helper function to get fontas unit label from ID
  const getFontasUnitLabel = (id: number): string => {
    const unit = fontasUnits.find((u) => u.id === id);
    if (!unit) return `#${id}`;
    return `${unit.type} - ${unit.value} ${unit.unit}`;
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

  return (
    <>
    <CustomDialog
      title="اضافه وقت ذروه جديد"
      color={Colors.primary}
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          // Reset checkboxes when dialog closes
          setApplyToAll(false);
          setApplyToValid(false);
          setApplyToInvalid(false);
          setOverlapError(null);
        }
      }}
      trigger={
        <Button variant="primary" size="lg">
          اضافه وقت ذروه جديد
          <Add className="w-6 text-white" />
        </Button>
      }
      content={
        <Formik
          initialValues={{
            day: "",
            startTime: "",
            endTime: "",
            priceKilo: "",
            minuteKilo: "",
            fixedPrice: "",
            minPrice: "",
            waitingTime: "",
            cancelTime: "",
            freeKm: "",
            cancellationTime: "",
          }}
          validationSchema={validationForPeakTimes}
          onSubmit={async (values, { setSubmitting }) => {
            // Skip overlap validation if any checkbox is checked (backend will handle it)
            if (!applyToAll && !applyToValid && !applyToInvalid) {
              // Check for overlap with existing peak times only if no checkbox is checked
              if (hasOverlap(values.day, values.startTime, values.endTime, existingPeakTimes)) {
                setOverlapError("يوجد تداخل مع وقت ذروة آخر في نفس اليوم");
                setSubmitting(false);
                return;
              }
            }
            setOverlapError(null);

            const startTimeFormate = ChangeTimeFormate(values.startTime)?.split(
              " "
            );
            const endTimeFormate = ChangeTimeFormate(values.endTime)?.split(
              " "
            );

            const formdata: any = new FormData();
            formdata.append("type", serviceType);

            // For fontas service with checkbox checked, don't send subtype
            // For other services or no checkbox, send subtype normally
            if (serviceType === "fontas" && (applyToAll || applyToValid || applyToInvalid)) {
              // Don't send subtype to update all units of selected type
            } else if (searchParams.get("subtype")) {
              formdata.append("subtype", searchParams.get("subtype"));
            }

            searchParams.get("zone_id") &&
              formdata.append("zone_id", searchParams.get("zone_id"));
            formdata.append("day", values.day);
            formdata.append("start_hour", startTimeFormate[0]?.split(":")[0]);
            formdata.append("start_minute", startTimeFormate[0]?.split(":")[1]);
            formdata.append("start_ampm", startTimeFormate[1].toLowerCase());
            formdata.append("end_hour", endTimeFormate[0]?.split(":")[0]);
            formdata.append("end_minute", endTimeFormate[0]?.split(":")[1]);
            formdata.append("end_ampm", endTimeFormate[1].toLowerCase());
            formdata.append("price_per_km", values.priceKilo);
            formdata.append("price_per_minute", values.minuteKilo);
            formdata.append("base_price", values.fixedPrice);
            formdata.append("cancellation_cost", values.cancelTime);

            // Fontas-specific fields
            if (serviceType === "fontas") {
              values.freeKm && formdata.append("free_km", values.freeKm);
              values.cancellationTime && formdata.append("cancellation_time", values.cancellationTime);
            } else {
              // Other services fields
              formdata.append("minimum_charge", values.minPrice);
              formdata.append("waiting_cost", values.waitingTime);
            }

            // Add apply_peek_time_for parameter based on checked checkbox (for fontas)
            if (serviceType === "fontas") {
              if (applyToAll) {
                formdata.append("apply_peek_time_for", "all");
              } else if (applyToValid) {
                formdata.append("apply_peek_time_for", "valid");
              } else if (applyToInvalid) {
                formdata.append("apply_peek_time_for", "invalid");
              }
            }

            startLoading();

            try {
              const response: any = await fetcherClient("/createPeakTimes", {
                method: "POST",
                body: formdata,
              });

              showResponseToast(response);

              if (response.success) {
                setOpen(false);
                // Reset checkboxes after successful submission
                setApplyToAll(false);
                setApplyToValid(false);
                setApplyToInvalid(false);

                // Check if there are overlapped subtypes (only when checkbox is checked)
                if (
                  (applyToAll || applyToValid || applyToInvalid) &&
                  response.data?.overlapped_subtypes &&
                  Array.isArray(response.data.overlapped_subtypes) &&
                  response.data.overlapped_subtypes.length > 0
                ) {
                  setOverlappedSubtypes(response.data.overlapped_subtypes);
                  setShowOverlapDialog(true);
                }
              }

              router.refresh();
            } catch (error: any) {
              showResponseToast(error.info);
            } finally {
              stopLoading();
              setSubmitting(false);
            }
          }}
        >
          {(props) => (
            <Form className=" flex flex-col gap-5">
              {overlapError && (
                <div className="p-4 border border-red-500 bg-red-50 rounded-6 text-red-600 text-14">
                  {overlapError}
                </div>
              )}
              {serviceType === "fontas" && (
                <div className="p-4 border border-accentWarning bg-accentWarningLight rounded-6 flex flex-col gap-2">
                  <p className="text-16 text-textMain">
                    <span className="font-[600]">المنطقة: </span>
                    {searchParams.get("zone_name") || "كامل المملكة"}
                  </p>
                  <p className="text-16 text-textMain">
                    <span className="font-[600]">
                      {applyToAll || applyToValid || applyToInvalid ? "نطاق التطبيق: " : "وحدة الفنطاس: "}
                    </span>
                    {applyToAll
                      ? "تطبيق التعديل للكل"
                      : applyToValid
                      ? "تطبيق التعديل للمياه الصالحة للشرب"
                      : applyToInvalid
                      ? "تطبيق التعديل للمياه الغير صالحة للشرب"
                      : fontasUnitLabel || ""}
                  </p>
                </div>
              )}
              <CustomSelect
                name="day"
                title="اليوم"
                placeholder="اليوم"
                options={[
                  { label: "السبت", value: "saturday" },
                  { label: "الأحد", value: "sunday" },
                  { label: "الاثنين", value: "monday" },
                  { label: "الثلاثاء", value: "tuesday" },
                  { label: "الأربعاء", value: "wednesday" },
                  { label: "الخميس", value: "thursday" },
                  { label: "الجمعة", value: "friday" },
                ]}
                formikProps={props}
                label="label"
                value="value"
              />
              <div className=" grid grid-cols-1 md:grid-cols-2 gap-5">
                <CustomInput
                  type="time"
                  name="startTime"
                  placeholder="0"
                  label="موعد البداية"
                />
                <CustomInput
                  type="time"
                  name="endTime"
                  placeholder="0"
                  label="موعد النهاية"
                />
              </div>
              <div className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {serviceType === "fontas" ? (
                  <>
                    <CustomInput
                      type="number"
                      name="fixedPrice"
                      placeholder="0"
                      label="سعر ثابت"
                      step="0.1"
                    />
                    <CustomInput
                      type="number"
                      name="priceKilo"
                      placeholder="0"
                      label="سعر الكيلو"
                      step="0.1"
                    />
                    <CustomInput
                      type="number"
                      name="minuteKilo"
                      placeholder="0"
                      label="سعر الدقيقة"
                      step="0.1"
                    />
                    <CustomInput
                      type="number"
                      name="freeKm"
                      placeholder="0"
                      label="الكيلوات المجانية"
                      step="0.1"
                    />
                    <CustomInput
                      type="number"
                      name="cancelTime"
                      placeholder="0"
                      label="سعر الالغاء"
                      step="0.1"
                    />
                    <CustomInput
                      type="number"
                      name="cancellationTime"
                      placeholder="0"
                      label="وقت الالغاء (بالدقائق)"
                      step="1"
                    />
                  </>
                ) : (
                  <>
                    <CustomInput
                      type="number"
                      name="priceKilo"
                      placeholder="0"
                      label="سعر الكيلو"
                      step="0.1"
                    />
                    <CustomInput
                      type="number"
                      name="minuteKilo"
                      placeholder="0"
                      label="سعر الدقيقة"
                      step="0.1"
                    />
                    <CustomInput
                      type="number"
                      name="fixedPrice"
                      placeholder="0"
                      label="مصاريف ثابته"
                      step="0.1"
                    />
                    <CustomInput
                      type="number"
                      name="minPrice"
                      placeholder="0"
                      label="اقل سعر اجمالي "
                      step="0.1"
                    />
                    <CustomInput
                      type="number"
                      name="waitingTime"
                      placeholder="0"
                      label="سعر دقيقة الانتظار "
                      step="0.1"
                    />
                    <CustomInput
                      type="number"
                      name="cancelTime"
                      placeholder="0"
                      label="تكلفة الالغاء"
                      step="0.1"
                    />
                  </>
                )}
              </div>

              {/* Checkboxes for fontas service */}
              {serviceType === "fontas" && (
                <div className="flex flex-col gap-3 items-start">
                  <div className="flex items-center gap-2 flex-row-reverse">
                    <label
                      htmlFor="peaktime-apply-to-all"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      تطبيق التعديل للكل
                    </label>
                    <Checkbox
                      id="peaktime-apply-to-all"
                      checked={applyToAll}
                      onCheckedChange={() => handleCheckboxChange("all")}
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-row-reverse">
                    <label
                      htmlFor="peaktime-apply-to-valid"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      تطبيق التعديل للمياه الصالحة للشرب
                    </label>
                    <Checkbox
                      id="peaktime-apply-to-valid"
                      checked={applyToValid}
                      onCheckedChange={() => handleCheckboxChange("valid")}
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-row-reverse">
                    <label
                      htmlFor="peaktime-apply-to-invalid"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      تطبيق التعديل للمياه الغير صالحة للشرب
                    </label>
                    <Checkbox
                      id="peaktime-apply-to-invalid"
                      checked={applyToInvalid}
                      onCheckedChange={() => handleCheckboxChange("invalid")}
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-fit px-8"
                disabled={props.isSubmitting}
              >
                حفظ
              </Button>
            </Form>
          )}
        </Formik>
      }
    />

    {/* Overlap Warning Dialog */}
    <Dialog open={showOverlapDialog} onOpenChange={setShowOverlapDialog}>
      <DialogContent className="max-w-[628px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-accentWarning text-24">
            <AlertTriangle className="w-8 text-accentWarning" />
            تنبيه: تداخل في أوقات الذروة
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <p className="text-18 text-textMain">
            تم إنشاء وقت الذروة بنجاح، ولكن لم يتم تطبيقه على بعض وحدات الفنطاس بسبب وجود تداخل في الأوقات.
          </p>
          <div className="p-4 border border-accentWarning bg-accentWarningLight rounded-6">
            <p className="text-16 font-[600] mb-2">وحدات الفنطاس التي لم يتم تطبيق الوقت عليها:</p>
            <div className="flex flex-wrap gap-2">
              {overlappedSubtypes.map((id) => (
                <span
                  key={id}
                  className="px-3 py-1 bg-white border border-accentWarning rounded-4 text-14"
                >
                  {getFontasUnitLabel(id)}
                </span>
              ))}
            </div>
          </div>
          <p className="text-14 text-textSecondary">
            يرجى مراجعة أوقات الذروة الحالية لهذه الوحدات وتعديلها حسب الحاجة لتجنب التداخل.
          </p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="primary" className="w-full">
              حسناً، فهمت
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default Index;
