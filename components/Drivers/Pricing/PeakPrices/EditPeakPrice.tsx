"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import CustomDialog, { Colors } from "@/components/shared/CustomDialog";
import { EditAction, Slash } from "@/public/SVG";
import { Form, Formik } from "formik";
import CustomInput from "@/components/shared/form/CustomInput";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { ChangeTimeFormate } from "@/lib/helperFunctions";
import { useResponseToast } from "@/lib/toastUtils";
import { fetcherClient } from "@/lib/fetcherClient";
import { validationForPeakTimes } from "@/lib/types/validationTypes";
import { PeakTimeData } from "@/lib/types/responseTypes";
import { useLoading } from "@/contexts/LoadingContext";
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

const Index = ({
  data,
  serviceName,
  fontasUnitLabel,
  existingPeakTimes = [],
}: {
  data: PeakTimeData;
  serviceName?: string;
  fontasUnitLabel?: string;
  existingPeakTimes?: PeakTimeData[];
}) => {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showResponseToast } = useResponseToast();
  const { startLoading, stopLoading } = useLoading();
  const [open, setOpen] = React.useState(false);
  const [overlapError, setOverlapError] = React.useState<string | null>(null);

  // Use serviceName prop or fallback to params.serviceType
  const serviceType = serviceName || (params.serviceType as string);

  return (
    <CustomDialog
      title="تعديل وقت الذروه "
      color={Colors.primary}
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          setOverlapError(null);
        }
      }}
      trigger={<EditAction className="cursor-pointer" />}
      content={
        <Formik
          initialValues={{
            day: data.day,
            startTime: data.start_time,
            endTime: data.end_time,
            priceKilo: data.price_per_km,
            minuteKilo: data.price_per_minute,
            fixedPrice: data.base_price,
            minPrice: data.minimum_charge,
            waitingTime: data.waiting_cost,
            cancelTime: data.cancellation_cost,
            freeKm: data.free_km || "",
            cancellationTime: data.cancellation_time || "",
          }}
          validationSchema={validationForPeakTimes}
          onSubmit={async (values, { setSubmitting }) => {
            // Check for overlap with existing peak times (excluding current one)
            if (hasOverlap(values.day, values.startTime, values.endTime, existingPeakTimes, data.id)) {
              setOverlapError("يوجد تداخل مع وقت ذروة آخر في نفس اليوم");
              setSubmitting(false);
              return;
            }
            setOverlapError(null);

            const startTimeFormate = ChangeTimeFormate(values.startTime)?.split(
              " "
            );
            const endTimeFormate = ChangeTimeFormate(values.endTime)?.split(
              " "
            );

            const formdata: any = new FormData();
            formdata.append("peakTime_id", data.id);
            formdata.append("type", serviceType);

            if (searchParams.get("subtype")) {
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

            startLoading();

            try {
              const response: any = await fetcherClient(
                "/updatePeakTimePrice",
                {
                  method: "POST",
                  body: formdata,
                }
              );

              showResponseToast(response);

              if (response.success) {
                setOpen(false);
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
              {serviceType === "fontas" && fontasUnitLabel && (
                <div className="p-4 border border-accentWarning bg-accentWarningLight rounded-6 flex flex-col gap-2">
                  <p className="text-16 text-textMain">
                    <span className="font-[600]">المنطقة: </span>
                    {searchParams.get("zone_name") || "كامل المملكة"}
                  </p>
                  <p className="text-16 text-textMain">
                    <span className="font-[600]">وحدة الفنطاس: </span>
                    {fontasUnitLabel}
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
                initialValue={props.values.day}
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
  );
};

export default Index;
