/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useEffect, useState } from "react";
import { CalendarIcon } from "@/public/SVG";
import { FormikProps } from "formik";
import { Button } from "@/components/ui/button";
import { useLocale } from "next-intl";
import { ar, enUS } from "date-fns/locale";

const Index = ({
  name,
  label,
  formikProps,
  initialValue,
  labelStyle,
  restrictPastDates = false,
  restrictDatesBeforeDay,
  restrictDatesAfterDay,
}: {
  name: string;
  label: string;
  formikProps: FormikProps<any>;
  initialValue?: any;
  labelStyle?: string;
  restrictPastDates?: boolean;
  restrictDatesBeforeDay?: string;
  restrictDatesAfterDay?: string;
}) => {
  const currentLocale = useLocale();
  const isArabic = currentLocale === "ar";
  const [value, setValue] = useState<Date | undefined>();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [showYearSelect, setShowYearSelect] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  // Bilingual month names
  const months = {
    en: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    ar: [
      "يناير",
      "فبراير",
      "مارس",
      "أبريل",
      "مايو",
      "يونيو",
      "يوليو",
      "أغسطس",
      "سبتمبر",
      "أكتوبر",
      "نوفمبر",
      "ديسمبر",
    ],
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear + 10 - i);

  // Sync with Formik value
  useEffect(() => {
    if (formikProps.values[name]) {
      try {
        const date = new Date(formikProps.values[name]);
        if (!isNaN(date.getTime())) {
          setValue(date);
          setMonth(date.getMonth());
          setYear(date.getFullYear());
        }
      } catch (e) {}
    } else {
      // Clear the internal state when Formik value is empty
      setValue(undefined);
    }
  }, [formikProps.values, name]);

  const handleDateSelect = (date: Date | undefined) => {
    setValue(date);
    setIsPopoverOpen(false);
    if (date) {
      formikProps.setFieldValue(name, format(date, "yyyy-MM-dd"));
    } else {
      formikProps.setFieldValue(name, "");
    }
  };

  const handleYearSelect = (selectedYear: number) => {
    setYear(selectedYear);
    setShowYearSelect(false);
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return isArabic ? "يوم/شهر/سنة" : "mm/dd/yyyy";
    return format(date, "MM/dd/yyyy", { locale: isArabic ? ar : enUS });
  };

  const errorMessage = () => {
    const error = formikProps.errors[name];
    if (typeof error === "string") {
      return error;
    }
    return ""; // Return empty string for other error types
  };

  return (
    <div className={`flex flex-col gap-2 ${isArabic ? "rtl" : "ltr"}`}>
      <p
        className={`text-16 text-primarySlate700 font-[600] ${
          labelStyle && labelStyle
        }`}
      >
        {label}
      </p>
      <Popover
        open={isPopoverOpen}
        onOpenChange={setIsPopoverOpen}
        modal={true}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className="h-[48px] border border-textBorder rounded-6 flex items-center justify-between px-3"
          >
            {formatDate(value)}
            <span
              className={`${
                isArabic ? "ms-auto border-s" : "me-auto border-e"
              } border-[#EBEBEC] px-3`}
            >
              <CalendarIcon />
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-full p-1"
          align={!isArabic ? "end" : "start"}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div
            className={`flex items-center justify-center gap-2 px-4 py-2 relative ${
              isArabic ? "flex-row-reverse" : ""
            }`}
          >
            <div
              className={`flex items-center gap-1 absolute ${
                isArabic
                  ? "right-1/2 translate-x-1/2"
                  : "left-1/2 -translate-x-1/2"
              } top-7 bg-white  px-5 z-30 ${
                isArabic ? "flex-row-reverse" : ""
              }`}
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 font-normal text-sm"
                onClick={() => setShowYearSelect(!showYearSelect)}
              >
                {year}
                {showYearSelect && (
                  <div
                    className={`absolute top-10 ${
                      isArabic ? "right-0" : "left-0"
                    } mx-auto z-10 bg-white shadow-lg rounded-md border max-h-60 overflow-y-auto w-32`}
                  >
                    {years.map((y) => (
                      <div
                        key={y}
                        className={`px-3 py-1 text-sm hover:bg-gray-100 cursor-pointer ${
                          y === year ? "bg-gray-100 font-medium" : ""
                        } ${isArabic ? "text-right" : "text-left"}`}
                        onClick={() => handleYearSelect(y)}
                      >
                        {y}
                      </div>
                    ))}
                  </div>
                )}
              </Button>
              <span className="text-sm font-medium">
                {isArabic ? months.ar[month] : months.en[month]}
              </span>
            </div>
          </div>

          <Calendar
            mode="single"
            selected={value}
            onSelect={handleDateSelect}
            month={new Date(year, month)}
            onMonthChange={(date) => {
              setMonth(date.getMonth());
              setYear(date.getFullYear());
            }}
            disabled={
              restrictPastDates
                ? { before: new Date() }
                : restrictDatesBeforeDay
                ? { before: new Date(restrictDatesBeforeDay) }
                : restrictDatesAfterDay
                ? { after: new Date(restrictDatesAfterDay) }
                : undefined
            }
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {formikProps.touched[name] && formikProps.errors[name] && (
        <p className="text-14 text-red-500">{errorMessage()}</p>
      )}
    </div>
  );
};

export default Index;
