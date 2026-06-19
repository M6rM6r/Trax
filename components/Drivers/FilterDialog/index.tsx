"use client";
import { ArrowLeftFilter, Filter } from "@/public/SVG";
import CustomDialog, { Colors } from "@/components/shared/CustomDialog";
import { Button } from "@/components/ui/button";
import DateInput from "@/components/shared/form/DateInput";
import { Form, Formik } from "formik";
import * as Yup from "yup";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import RangeSliderComponent from "@/components/shared/form/RangeSliderComponent";
import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDataTableLoading } from "@/components/shared/DataTable/DataTableLoadingContext";
import { Checkbox } from "@/components/ui/checkbox";
import {
  allEnumsData,
  EVehicleLicenseType,
  vehicleTypes,
} from "@/lib/types/enums";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RegionsData, RegionsResponse } from "@/lib/types/responseTypes";
import { fetcherClient } from "@/lib/fetcherClient";
import { DialogClose } from "@radix-ui/react-dialog";
import { useScrollPreservation } from "@/hooks/useScrollPreservation";
import { isTruthy } from "@/lib/utils";

const Index = () => {
  const [activeFilters, setActiveFilters] = useState<
    { key: string; label: string; value: any }[]
  >([]);
  const [isFiltered, setIsFiltered] = useState(false);

  const { saveScrollPosition } = useScrollPreservation();

  const initialLastFilterValues = {
    services: [] as string[],
    searchJoinStart: "",
    searchJoinEnd: "",
    walletBalance: [] as string[],
    status: "",
    vehicleType: "",
    licenseType: "",
    region_id: "",
    gender: "",
    rating: [] as string[],
    currentStep: "",
  };

  const [lastFilterValues, setLastFilterValues] = useState(
    initialLastFilterValues
  );

  const pathname = usePathname();
  const router = useRouter();

  const searchParams = useSearchParams();
  const { startTransition, setIsLoading } = useDataTableLoading();

  const [regionsData, setRegionsData] = useState<RegionsData[]>([]);

  const fetchRegions = async () => {
    try {
      const response = await fetcherClient<RegionsResponse>("/getRegions");
      setRegionsData(response.data);
    } catch (err) {}
  };

  useEffect(() => {
    fetchRegions();
  }, []);

  const vehicleLicenseTypes: Record<EVehicleLicenseType, string> = {
    [EVehicleLicenseType.private]: "خاصة",
    [EVehicleLicenseType.professional_light]: "مهنية درجة ثالثة",
    [EVehicleLicenseType.professional_medium]: "مهنية درجة ثانية",
    [EVehicleLicenseType.professional_heavy]: "مهنية درجة أولى",
    [EVehicleLicenseType.motorcycle]: "دراجة نارية",
    [EVehicleLicenseType.construction]: "معدات / إنشائية",
    [EVehicleLicenseType.public]: "عامة / نقل جماعي",
  };

  const updateActiveFilters = (values: any) => {
    const filters: { key: string; label: string; value: any }[] = [];

    if (isTruthy(values.services)) {
      filters.push({
        key: "services",
        label: "الخدمات",
        value: values.services,
      });
    }

    if (values.searchJoinStart) {
      filters.push({
        key: "searchJoinStart",
        label: "من تاريخ",
        value: values.searchJoinStart,
      });
    }
    if (values.searchJoinEnd) {
      filters.push({
        key: "searchJoinEnd",
        label: "إلى تاريخ",
        value: values.searchJoinEnd,
      });
    }
    if (values.rating.length > 0) {
      filters.push({
        key: "rating",
        label: " التقييم",
        value: values.rating,
      });
    }
    if (values.walletBalance.length > 0) {
      filters.push({
        key: "walletBalance",
        label: "رصيد المحفظة",
        value: `${values.walletBalance[0]} - ${values.walletBalance[1]}`,
      });
    }
    if (values.status) {
      filters.push({
        key: "status",
        label: " الحالة",
        value: values.status,
      });
    }
    if (values.vehicleType) {
      filters.push({
        key: "vehicleType",
        label: "نوع المركبة",
        value: values.vehicleType,
      });
    }
    if (values.licenseType) {
      filters.push({
        key: "licenseType",
        label: "نوع الرخصة",
        value: values.licenseType,
      });
    }
    if (values.region_id) {
      filters.push({
        key: "region_id",
        label: "المنطقة",
        value: values.region_id,
      });
    }

    if (values.currentStep) {
      filters.push({
        key: "currentStep",
        label: "الخطوة الحالية",
        value: values.currentStep,
      });
    }

    setActiveFilters(filters);
    setIsFiltered(filters.length > 0);
  };

  const serviceTypes = {
    taxi: "زيم ركاب",
    fontas: "وايت ماء",
    wensh: "سطحات",
    light_transportation: "النقل الخفيف",
    driver_without_car: "سائق بدون سيارة",
    important_dates: "أجتماعات ومواعيد مهمة",
  };

  const [selectedServices, setSelectedServices] = useState<string[]>(
    lastFilterValues?.services || [] //  default selected values
  );

  // const FilterSchema = Yup.object().shape({
  //   searchJoinStart: Yup.date().nullable().typeError("تاريخ غير صالح"),

  //   searchJoinEnd: Yup.date()
  //     .nullable()
  //     .typeError("تاريخ غير صالح")
  //     .when("searchJoinStart", (searchJoinStart, schema) =>
  //       searchJoinStart
  //         ? schema.min(
  //             searchJoinStart,
  //             "تاريخ النهاية لا يمكن أن يكون قبل تاريخ البداية"
  //           )
  //         : schema
  //     ),
  // });

  return (
    <CustomDialog
      title="فلتر حسب"
      color={Colors.primary}
      className="max-w-[630px]"
      trigger={
        <Button variant={"primaryLight"} className=" text-textMain me-auto">
          <Filter />
          فلتر
        </Button>
      }
      content={
        <Formik
          enableReinitialize
          initialValues={lastFilterValues}
          // validationSchema={FilterSchema}
          onSubmit={(values) => {
            setLastFilterValues(values);

            // Preserve existing params like itemPerPage
            const params = new URLSearchParams(searchParams.toString());
            saveScrollPosition();

            // Clear all old filter params
            const keysToDelete: string[] = [];
            params.forEach((_, key) => {
              if (key.startsWith("filters[") || key === "services") {
                keysToDelete.push(key);
              }
            });
            keysToDelete.forEach((key) => params.delete(key));

            // Reset to page 1 when applying filters
            params.set("page", "1");

            if (isTruthy(values.services)) {
              params.set("services", values.services.join(","));
            }

            if (isTruthy(values.rating)) {
              params.set("filters[rating][min]", values.rating[0]);
              params.set("filters[rating][max]", values.rating[1]);
            }

            if (isTruthy(values.status))
              params.set(
                "filters[is_active]",
                encodeURIComponent(values.status === "active" ? 1 : 0)
              );

            if (isTruthy(values.gender))
              params.set("filters[gender]", values.gender);

            if (isTruthy(values.searchJoinStart))
              params.set(
                "filters[created_at_date][from]",
                values.searchJoinStart
              );

            if (isTruthy(values.searchJoinEnd))
              params.set(
                "filters[created_at_date][to]",
                values.searchJoinEnd
              );

            if (isTruthy(values.vehicleType)) {
              params.set(
                "filters[vehicels][vehicle_type]",
                values.vehicleType
              );
              // params.set(
              //   "filters[vehicles][available_for_important_dates]",
              //   encodeURIComponent(1)
              // );
            }
            if (isTruthy(values.licenseType))
              params.set("filters[licenseType]", values.licenseType);

            if (isTruthy(values.walletBalance)) {
              params.set(
                "filters[wallet_balance][min]",
                values.walletBalance[0]
              );
              params.set(
                "filters[wallet_balance][max]",
                values.walletBalance[1]
              );
            }
            if (isTruthy(values.region_id))
              params.set("filters[region_id]", values.region_id);

            if (isTruthy(values.currentStep)) {
              params.set("filters[step]", values.currentStep);
            }

            setIsFiltered(true);
            setIsLoading(true);

            startTransition(() => {
              router.push(`${window.location.pathname}?${params.toString()}`);
            });

            updateActiveFilters(values);
            // router.push(`${pathname}?${params.toString()}`);
          }}
        >
          {(props) => {
            return (
              <Form>
                <Accordion
                  type="multiple"
                  className=" grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <AccordionItem
                    value="item-8"
                    className="border border-textBorder rounded-6 px-2 w-full span-2"
                  >
                    <AccordionTrigger className="flex items-center gap-2 w-full border-none">
                      <ArrowLeftFilter />
                      <span className="text-14 text-textSubText font-[600]">
                        النوع
                      </span>
                    </AccordionTrigger>

                    <AccordionContent className="my-5 flex gap-3">
                      {Object.entries(allEnumsData.Genders.ar).map(
                        ([key, label]) => {
                          const isChecked = props.values.gender === key;

                          return (
                            <div
                              key={key}
                              className="flex-row-reverse items-center justify-between p-2"
                            >
                              <Checkbox
                                id={key}
                                checked={isChecked}
                                onCheckedChange={() =>
                                  props.setFieldValue(
                                    "gender",
                                    isChecked ? "" : key
                                  )
                                }
                              />
                              <label
                                htmlFor={key}
                                className="cursor-pointer text-right w-full mr-2"
                              >
                                {label as ReactNode}
                              </label>
                            </div>
                          );
                        }
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem
                    value="item-2"
                    className="border border-textBorder  rounded-6 px-2 w-full  "
                  >
                    <AccordionTrigger className="flex items-center gap-2  w-full border-none ">
                      <ArrowLeftFilter />
                      <span className="text-14 text-textSubText font-[600]">
                        الحالة
                      </span>
                      {/* <span className="w-2 h-2 rounded-full bg-primaryColor block"></span> */}
                    </AccordionTrigger>
                    <AccordionContent className="my-5 flex gap-3">
                      <Checkbox
                        id="active"
                        checked={props.values.status === "active"}
                        onCheckedChange={() =>
                          props.setFieldValue(
                            "status",
                            props.values.status === "active" ? "" : "active"
                          )
                        }
                      />
                      <label htmlFor="active">نشط</label>

                      <Checkbox
                        id="not-active"
                        checked={props.values.status === "not-active"}
                        onCheckedChange={() =>
                          props.setFieldValue(
                            "status",
                            props.values.status === "not-active"
                              ? ""
                              : "not-active"
                          )
                        }
                      />
                      <label htmlFor="not-active">غير نشط</label>
                    </AccordionContent>
                    <AccordionContent className=" grid grid-cols-1 md:grid-cols-2 gap-5 mt-5"></AccordionContent>
                  </AccordionItem>

                  <AccordionItem
                    value="item-1"
                    className="border border-textBorder  rounded-6 px-2 w-full"
                  >
                    {" "}
                    <AccordionTrigger className="flex items-center gap-2  w-full border-none ">
                      <ArrowLeftFilter />
                      <span className="text-14 text-textSubText font-[600]">
                        التقييم
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="my-5">
                      <RangeSliderComponent
                        min={0}
                        max={5}
                        step={0.5}
                        formikProps={props}
                        name="rating"
                        labelName="عدد النجوم"
                      />
                    </AccordionContent>
                    <AccordionContent className=" grid grid-cols-1 md:grid-cols-2 gap-5 mt-5"></AccordionContent>
                  </AccordionItem>
                  <AccordionItem
                    value="item-3"
                    disabled
                    className="
    border border-gray-200 rounded-6 px-2 
    opacity-50 
    pointer-events-none 
    bg-gray-50 
    text-gray-400
  "
                  >
                    <AccordionTrigger className="flex items-center gap-2  w-full border-none ">
                      <ArrowLeftFilter />
                      <span className="text-14 text-textSubText font-[600]">
                        رصيد المحفظة
                      </span>
                      {/* <span className="w-2 h-2 rounded-full bg-primaryColor block"></span> */}
                    </AccordionTrigger>
                    <AccordionContent className="my-5">
                      <RangeSliderComponent
                        min={0}
                        max={2000}
                        step={10}
                        formikProps={props}
                        name="walletBalance"
                        labelName="رصيد المحفظة (ر.س)"
                      />
                    </AccordionContent>
                    <AccordionContent className=" grid grid-cols-1 md:grid-cols-2 gap-5 mt-5"></AccordionContent>
                  </AccordionItem>

                  <AccordionItem
                    value="item-5"
                    className="border border-gray-200 rounded-xl w-full bg-white shadow-sm"
                  >
                    {/* Trigger */}
                    <AccordionTrigger className="flex items-center gap-2  w-full border-none px-2">
                      <div className="flex items-center gap-2">
                        <ArrowLeftFilter className="text-gray-500" />
                        <span className="text-[15px] text-gray-700 font-medium">
                          نوع الرخصة
                        </span>
                      </div>
                    </AccordionTrigger>

                    {/* Content */}
                    <AccordionContent className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                      <div className="w-full">
                        <Select
                          dir="rtl"
                          defaultValue={lastFilterValues.licenseType || ""}
                          onValueChange={(value) =>
                            props.setFieldValue("licenseType", value)
                          }
                        >
                          <SelectTrigger className="w-full border border-gray-300 rounded-lg shadow-sm bg-white focus:ring-2 focus:ring-primaryColor focus:border-primaryColor transition-all text-right">
                            <SelectValue placeholder="اختر نوع الرخصة" />
                          </SelectTrigger>

                          <SelectContent
                            dir="rtl"
                            align="end"
                            className="bg-white rounded-lg shadow-lg border border-gray-200 w-full"
                          >
                            {Object.entries(vehicleLicenseTypes).map(
                              ([key, label]) => (
                                <SelectItem
                                  key={key}
                                  value={key}
                                  className="cursor-pointer text-right hover:bg-gray-100"
                                >
                                  {label}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem
                    value="item-6"
                    className="border  rounded-xl w-full bg-white"
                  >
                    <AccordionTrigger className="flex items-center gap-2  w-full border-none px-2">
                      <div className="flex items-center gap-2">
                        <ArrowLeftFilter className="text-gray-500" />
                        <span className="text-[15px] text-gray-700 font-medium">
                          المنطقة
                        </span>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                      <div className="w-full">
                        <Select
                          dir="rtl"
                          onValueChange={(e) => {
                            const params = new URLSearchParams(
                              searchParams.toString()
                            );
                            props.setFieldValue("region_id", e);
                          }}
                          defaultValue={lastFilterValues.region_id || ""}
                        >
                          <SelectTrigger className="w-full border border-gray-300 rounded-lg shadow-sm bg-white focus:ring-2 focus:ring-primaryColor focus:border-primaryColor transition-all text-right">
                            <SelectValue placeholder="اختر المنطقة" />
                          </SelectTrigger>

                          <SelectContent
                            dir="rtl"
                            align="end"
                            className="bg-white rounded-lg shadow-lg border border-gray-200 w-full"
                          >
                            {regionsData?.map((region) => (
                              <SelectItem
                                key={region.id}
                                value={region.id.toString()}
                                className="cursor-pointer text-right hover:bg-gray-100"
                              >
                                {region.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  {/* Search Join Date Start / End */}
                  <div className="w-full col-span-2">
                    <Accordion
                      type="multiple"
                      className="w-full flex flex-col gap-4"
                    >
                      <AccordionItem
                        value="item-7"
                        className="border border-textBorder  rounded-6 px-2 w-full md:col-span-2 "
                      >
                        <AccordionTrigger className="flex items-center gap-2  w-full border-none ">
                          <ArrowLeftFilter />
                          <span className="text-14 font-[600]">
                            ناريخ الإنضمام
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="grid grid-cols-2 gap-5 mt-5">
                          <DateInput
                            name="searchJoinStart"
                            label="من"
                            formikProps={props}
                            restrictDatesAfterDay={new Date().toDateString()}
                          />
                          <DateInput
                            name="searchJoinEnd"
                            label="إلى"
                            formikProps={props}
                            restrictDatesBeforeDay={
                              props.values.searchJoinStart
                                ? new Date(
                                    new Date(
                                      props.values.searchJoinStart
                                    ).getTime() +
                                      24 * 60 * 60 * 1000
                                  ).toDateString()
                                : undefined
                            }
                            restrictDatesAfterDay={new Date().toDateString()}
                          />
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem
                        value="item-current-step"
                        className="border border-textBorder rounded-6 px-2 w-full"
                      >
                        <AccordionTrigger className="flex items-center gap-2 w-full border-none">
                          <ArrowLeftFilter />
                          <span className="text-14 text-textSubText font-[600]">
                            الخطوة الحالية
                          </span>
                        </AccordionTrigger>

                        <AccordionContent className="my-5 flex gap-4 flex-wrap">
                          {[1, 2, 3, 4].map((step) => {
                            const isChecked =
                              props.values.currentStep === String(step);

                            return (
                              <div
                                key={step}
                                className="flex items-center gap-2"
                              >
                                <Checkbox
                                  id={`step-${step}`}
                                  checked={isChecked}
                                  onCheckedChange={() =>
                                    props.setFieldValue(
                                      "currentStep",
                                      isChecked ? "" : String(step)
                                    )
                                  }
                                />
                                <label
                                  htmlFor={`step-${step}`}
                                  className="cursor-pointer"
                                >
                                  {step}
                                </label>
                              </div>
                            );
                          })}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </Accordion>
                <div className="flex items-center justify-between gap-3 mt-5 ">
                  <DialogClose>
                    <Button type="submit" variant="primary" className=" px-10">
                      تطبيق
                    </Button>
                  </DialogClose>
                  <DialogClose>
                    <Button
                      type="button"
                      variant="primaryLight"
                      className=" px-10"
                      onClick={() => {
                        props.resetForm();
                        setActiveFilters([]);
                        setLastFilterValues(initialLastFilterValues);
                        setIsFiltered(false);

                        // Preserve itemPerPage when clearing filters
                        const params = new URLSearchParams();
                        const currentItemPerPage = searchParams.get("itemPerPage");
                        if (currentItemPerPage) {
                          params.set("itemPerPage", currentItemPerPage);
                        }

                        setIsLoading(true);
                        startTransition(() => {
                          router.push(`${pathname}${params.toString() ? '?' + params.toString() : ''}`);
                        });
                      }}
                    >
                      إلغاء
                    </Button>
                  </DialogClose>
                </div>
              </Form>
            );
          }}
        </Formik>
      }
    />
  );
};

export default Index;
