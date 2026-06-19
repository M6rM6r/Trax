"use client";
import DateInput from "@/components/shared/form/DateInput";
import RangeSliderComponent from "@/components/shared/form/RangeSliderComponent";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useScrollPreservation } from "@/hooks/useScrollPreservation";
import { ArrowLeftFilter, RemoveX } from "@/public/SVG";
import { Form, Formik } from "formik";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const FilterComponent = () => {
  const [activeFilters, setActiveFilters] = useState<
    { key: string; label: string; value: any }[]
  >([]);
  const [isFiltered, setIsFiltered] = useState(false);
  const { saveScrollPosition } = useScrollPreservation();
  const pathname = usePathname();
  const router = useRouter();

  const updateActiveFilters = (values: any) => {
    const filters: { key: string; label: string; value: any }[] = [];

    if (values.dateFrom) {
      filters.push({
        key: "dateFrom",
        label: "من تاريخ",
        value: values.dateFrom,
      });
    }
    if (values.dateTo) {
      filters.push({ key: "dateTo", label: "إلى تاريخ", value: values.dateTo });
    }
    if (values.totalReferees.length > 0) {
      filters.push({
        key: "totalReferees",
        label: "عدد الرحلات المكتملة",
        value: `${values.totalReferees[0]} - ${values.totalReferees[1]}`,
      });
    }
    if (values.refereesCompleted.length > 0) {
      filters.push({
        key: "refereesCompleted",
        label: "عدد المدعوين المكتملين",
        value: `${values.refereesCompleted[0]} - ${values.refereesCompleted[1]}`,
      });
    }
    if (values.totalRewarded.length > 0) {
      filters.push({
        key: "totalRewarded",
        label: "إجمالي المكافآت",
        value: `${values.totalRewarded[0]} - ${values.totalRewarded[1]} ر.س`,
      });
    }
    if (values.rewardedStatus) {
      filters.push({
        key: "rewardedStatus",
        label: "حالة السحب",
        value: values.rewardedStatus === "1" ? "معلق" : "تم السحب",
      });
    }
    if (values.referrerType) {
      const types: Record<string, string> = {
        all: "الكل",
        pending: "قيد التنفيذ",
        registering: "جاري التسجيل",
        completed: "مكتمل",
      };
      filters.push({
        key: "referrerType",
        label: "حالة الدعوة",
        value: types[values.referrerType],
      });
    }

    setActiveFilters(filters);
    setIsFiltered(filters.length > 0);
  };

  const removeFilter = (filterKey: string, formikProps: any) => {
    const resetValue =
      filterKey === "totalReferees" ||
      filterKey === "refereesCompleted" ||
      filterKey === "totalRewarded"
        ? []
        : "";

    formikProps.setFieldValue(filterKey, resetValue);
    setActiveFilters((prev) => prev.filter((f) => f.key !== filterKey));
    setIsFiltered(activeFilters.length > 1);
    formikProps.submitForm();
  };

  return (
    <div className="flex flex-col gap-5 border border-gray200 rounded-12 p-5">
      <p className="text-20 text-textMain font-[700]">فلترة</p>
      <Formik
        initialValues={{
          dateFrom: "",
          dateTo: "",
          totalReferees: [],
          refereesCompleted: [],
          totalRewarded: [],
          rewardedStatus: "",
          referrerType: "",
        }}
        onSubmit={(values) => {
          saveScrollPosition();
          const params = new URLSearchParams();
          params.append("page", "1");

          if (values.dateFrom)
            params.append("filters[date][from]", values.dateFrom);
          if (values.dateTo) params.append("filters[date][to]", values.dateTo);

          if (values.totalReferees.length > 0) {
            params.append(
              "filters[completed_rides][min]",
              values.totalReferees[0]
            );
            params.append(
              "filters[completed_rides][max]",
              values.totalReferees[1]
            );
          }

          if (values.refereesCompleted.length > 0) {
            params.append(
              "filters[completed_referees][min]",
              values.refereesCompleted[0]
            );
            params.append(
              "filters[completed_referees][max]",
              values.refereesCompleted[1]
            );
          }

          if (values.totalRewarded.length > 0) {
            params.append(
              "filters[total_rewarded][min]",
              values.totalRewarded[0]
            );
            params.append(
              "filters[total_rewarded][max]",
              values.totalRewarded[1]
            );
          }

          if (values.rewardedStatus) {
            params.append("filters[rewarded_status]", values.rewardedStatus);
          }

          if (values.referrerType) {
            params.append("filters[referrer_type]", values.referrerType);
          }

          // sort ثابت
          params.append("filters[sort][column]", "total_referees");
          params.append("filters[sort][direction]", "desc");

          updateActiveFilters(values);
          router.push(`${pathname}?${params.toString()}`);
        }}
      >
        {(props) => (
          <Form>
            <Accordion
              type="multiple"
              className="grid grid-cols-1 md:grid-cols-2 gap-5"
            >
              {/* حالة الدعوة */}
              <AccordionItem
                value="item-6"
                className="border border-gray200 rounded-6 px-2"
              >
                <AccordionTrigger className="flex items-center gap-2 w-full border-none">
                  <ArrowLeftFilter />
                  <span className="text-14 font-[600]">حالة الدعوة</span>
                </AccordionTrigger>
                <AccordionContent className="my-5 flex flex-col gap-3">
                  {[
                    { id: "all", label: "الكل" },
                    { id: "pending", label: "قيد التنفيذ" },
                    { id: "registering", label: "جاري التسجيل" },
                    { id: "completed", label: "مكتمل" },
                  ].map((opt) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <Checkbox
                        id={opt.id}
                        checked={props.values.referrerType === opt.id}
                        onCheckedChange={() =>
                          props.setFieldValue(
                            "referrerType",
                            props.values.referrerType === opt.id ? "" : opt.id
                          )
                        }
                      />
                      <label htmlFor={opt.id}>{opt.label}</label>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>

              {/* عدد الرحلات المكتملة */}
              <AccordionItem
                value="item-2"
                className="border border-gray200 rounded-6 px-2"
              >
                <AccordionTrigger className="flex items-center gap-2 w-full border-none">
                  <ArrowLeftFilter />
                  <span className="text-14 font-[600]">
                    عدد الرحلات المكتملة
                  </span>
                </AccordionTrigger>
                <AccordionContent className="my-5">
                  <RangeSliderComponent
                    min={0}
                    max={50}
                    step={1}
                    formikProps={props}
                    name="totalReferees"
                    labelName=""
                  />
                </AccordionContent>
              </AccordionItem>

              {/* تاريخ التسجيل */}
              <AccordionItem
                value="item-1"
                className="border border-gray200 rounded-6 px-2"
              >
                <AccordionTrigger className="flex items-center gap-2 w-full border-none">
                  <ArrowLeftFilter />
                  <span className="text-14 font-[600]">تاريخ التسجيل</span>
                </AccordionTrigger>
                <AccordionContent className="grid grid-cols-2 gap-5 mt-5">
                  <DateInput name="dateFrom" label="من" formikProps={props} />
                  <DateInput name="dateTo" label="إلى" formikProps={props} />
                </AccordionContent>
              </AccordionItem>

              {/* حالة السحب */}
              <AccordionItem
                value="item-5"
                className="border border-gray200 rounded-6 px-2"
              >
                <AccordionTrigger className="flex items-center gap-2 w-full border-none">
                  <ArrowLeftFilter />
                  <span className="text-14 font-[600]">حالة السحب</span>
                </AccordionTrigger>
                <AccordionContent className="my-5 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="pending"
                      checked={props.values.rewardedStatus === "1"}
                      onCheckedChange={() =>
                        props.setFieldValue(
                          "rewardedStatus",
                          props.values.rewardedStatus === "1" ? "" : "1"
                        )
                      }
                    />
                    <label htmlFor="pending">معلق</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="done"
                      checked={props.values.rewardedStatus === "0"}
                      onCheckedChange={() =>
                        props.setFieldValue(
                          "rewardedStatus",
                          props.values.rewardedStatus === "0" ? "" : "0"
                        )
                      }
                    />
                    <label htmlFor="done">تم السحب</label>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Active Filters */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5">
                {activeFilters.map((filter) => (
                  <div
                    key={filter.key}
                    className="flex items-center gap-2 bg-primaryColorLight px-3 py-1 rounded-[6px] text-12"
                  >
                    <span>
                      {filter.label}: {filter.value}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFilter(filter.key, props)}
                    >
                      <RemoveX />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <Button type="submit" variant="primary">
                تطبيق
              </Button>
              {isFiltered && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    props.resetForm();
                    setActiveFilters([]);
                    setIsFiltered(false);
                    router.push(`${pathname}`);
                  }}
                >
                  إلغاء الفلتر
                </Button>
              )}
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default FilterComponent;
