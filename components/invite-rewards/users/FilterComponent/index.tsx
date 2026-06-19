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
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import * as Yup from "yup";
const FilterComponent = () => {
  const [activeFilters, setActiveFilters] = useState<
    { key: string; label: string; value: any }[]
  >([]);
  const [isFiltered, setIsFiltered] = useState(false);
  const locale = useLocale();
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
        label: "عدد المدعوين",
        value: `${values.totalReferees[0]} - ${values.totalReferees[1]}`,
      });
    }
    if (values.refereesCompleted.length > 0) {
      filters.push({
        key: "refereesCompleted",
        label: "عدد المكملين",
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
        value: values.rewardedStatus === "0" ? "معلق" : "تم السحب",
      });
    }
    if (values.referrerType) {
      filters.push({
        key: "referrerType",
        label: "النوع",
        value: values.referrerType === "driver" ? "سائق" : "راكب",
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
        validationSchema={Yup.object({
          dateFrom: Yup.date().nullable(),
          dateTo: Yup.date().nullable(),
          totalReferees: Yup.array(),
          refereesCompleted: Yup.array(),
          totalRewarded: Yup.array(),
          rewardedStatus: Yup.string(),
          referrerType: Yup.string(),
        })}
        onSubmit={(values) => {
          saveScrollPosition();
          const params = new URLSearchParams();
          params.append("page", "1");

          if (values.dateFrom)
            params.append("filters[date][from]", values.dateFrom);
          if (values.dateTo) params.append("filters[date][to]", values.dateTo);

          if (values.totalReferees.length > 0) {
            params.append(
              "filters[total_referees][min]",
              values.totalReferees[0]
            );
            params.append(
              "filters[total_referees][max]",
              values.totalReferees[1]
            );
          }

          if (values.refereesCompleted.length > 0) {
            params.append(
              "filters[referees_completed][min]",
              values.refereesCompleted[0]
            );
            params.append(
              "filters[referees_completed][max]",
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

          // sort ثابت مبدئياً
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
              {/* التاريخ */}
              <AccordionItem
                value="item-1"
                className="border border-gray200 rounded-6 px-2"
              >
                <AccordionTrigger className="flex items-center gap-2  w-full border-none ">
                  <ArrowLeftFilter />
                  <span className="text-14 font-[600]">التاريخ</span>
                </AccordionTrigger>
                <AccordionContent className="grid grid-cols-2 gap-5 mt-5">
                  <DateInput
                    name="dateFrom"
                    label="من"
                    formikProps={props}
                    restrictDatesAfterDay={props.values.dateTo}
                  />
                  <DateInput
                    name="dateTo"
                    label="إلى"
                    formikProps={props}
                    restrictDatesBeforeDay={props.values.dateFrom}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* عدد المدعوين */}
              <AccordionItem
                value="item-2"
                className="border border-gray200 rounded-6 px-2"
              >
                <AccordionTrigger className="flex items-center gap-2  w-full border-none ">
                  <ArrowLeftFilter />
                  <span className="text-14 font-[600]">عدد المدعوين</span>
                </AccordionTrigger>
                <AccordionContent className="my-5">
                  <RangeSliderComponent
                    min={0}
                    max={50}
                    step={1}
                    formikProps={props}
                    name="totalReferees"
                    labelName="عدد المدعوين"
                  />
                </AccordionContent>
              </AccordionItem>

              {/* عدد المكملين */}
              <AccordionItem
                value="item-3"
                className="border border-gray200 rounded-6 px-2"
              >
                <AccordionTrigger className="flex items-center gap-2  w-full border-none ">
                  <ArrowLeftFilter />
                  <span className="text-14 font-[600]">عدد المكملين</span>
                </AccordionTrigger>
                <AccordionContent className="my-5">
                  <RangeSliderComponent
                    min={0}
                    max={50}
                    step={1}
                    formikProps={props}
                    name="refereesCompleted"
                    labelName="عدد المكملين"
                  />
                </AccordionContent>
              </AccordionItem>

              {/* إجمالي المكافآت */}
              <AccordionItem
                value="item-4"
                className="border border-gray200 rounded-6 px-2"
              >
                <AccordionTrigger className="flex items-center gap-2  w-full border-none ">
                  <ArrowLeftFilter />
                  <span className="text-14 font-[600]">إجمالي المكافآت</span>
                </AccordionTrigger>
                <AccordionContent className="my-5">
                  <RangeSliderComponent
                    min={0}
                    max={2000}
                    step={10}
                    formikProps={props}
                    name="totalRewarded"
                    labelName="إجمالي المكافآت (ر.س)"
                  />
                </AccordionContent>
              </AccordionItem>

              {/* حالة السحب */}
              <AccordionItem
                value="item-5"
                className="border border-gray200 rounded-6 px-2"
              >
                <AccordionTrigger className="flex items-center gap-2  w-full border-none ">
                  <ArrowLeftFilter />
                  <span className="text-14 font-[600]">حالة السحب</span>
                </AccordionTrigger>
                <AccordionContent className="my-5 flex gap-3">
                  <Checkbox
                    id="pending"
                    checked={props.values.rewardedStatus === "0"}
                    onCheckedChange={() =>
                      props.setFieldValue(
                        "rewardedStatus",
                        props.values.rewardedStatus === "0" ? "" : "0"
                      )
                    }
                  />
                  <label htmlFor="pending">معلق</label>

                  <Checkbox
                    id="done"
                    checked={props.values.rewardedStatus === "1"}
                    onCheckedChange={() =>
                      props.setFieldValue(
                        "rewardedStatus",
                        props.values.rewardedStatus === "1" ? "" : "1"
                      )
                    }
                  />
                  <label htmlFor="done">تم السحب</label>
                </AccordionContent>
              </AccordionItem>

              {/* النوع (سائق/راكب) */}
              <AccordionItem
                value="item-6"
                className="border border-gray200 rounded-6 px-2"
              >
                <AccordionTrigger className="flex items-center gap-2  w-full border-none ">
                  <ArrowLeftFilter />
                  <span className="text-14 font-[600]">النوع</span>
                </AccordionTrigger>
                <AccordionContent className="my-5 flex gap-3">
                  <Checkbox
                    id="driver"
                    checked={props.values.referrerType === "driver"}
                    onCheckedChange={() =>
                      props.setFieldValue(
                        "referrerType",
                        props.values.referrerType === "driver" ? "" : "driver"
                      )
                    }
                  />
                  <label htmlFor="driver">سائق</label>

                  <Checkbox
                    id="customer"
                    checked={props.values.referrerType === "customer"}
                    onCheckedChange={() =>
                      props.setFieldValue(
                        "referrerType",
                        props.values.referrerType === "customer"
                          ? ""
                          : "customer"
                      )
                    }
                  />
                  <label htmlFor="customer">راكب</label>
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
                ))}{" "}
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
