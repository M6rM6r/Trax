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
import { fetcherClient } from "@/lib/fetcherClient";
import { ArrowLeftFilter, RemoveX } from "@/public/SVG";
import { Form, Formik } from "formik";
import { useLocale } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDataTableLoading } from "@/components/shared/DataTable/DataTableLoadingContext";
import { useEffect, useState } from "react";

const Index = () => {
  const [regionsData, setRegionsData] = useState([]);
  const [isFiltered, setIsFiltered] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<
    { key: string; label: string; value: any }[]
  >([]);
  const locale = useLocale();
  const { saveScrollPosition } = useScrollPreservation();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetcherClient<any>(
          `/modelDDLList?model_name=Zone&filters[type]=region&cols[0]=name_en&cols[1]=name_ar`,
          {
            cache: "force-cache",
            next: { revalidate: 300 },
          }
        );
        setRegionsData(response.data.records);
      } catch (err) {}
    };
    fetchData();
  }, []);

  const router = useRouter();
  const { startTransition, setIsLoading } = useDataTableLoading();

  const filteredRegions = regionsData.filter((region: any) =>
    region.name_ar.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRegionNameById = (id: string | number) => {
    const region: any = regionsData.find((r: any) => r.id == id);
    return region ? region.name_ar : id;
  };

  const updateActiveFilters = (values: any) => {
    const filters: { key: string; label: string; value: any }[] = [];

    if (values.rideFrom) {
      filters.push({
        key: "rideFrom",
        label: "من تاريخ",
        value: values.rideFrom,
      });
    }
    if (values.rideEnd) {
      filters.push({
        key: "rideEnd",
        label: "إلى تاريخ",
        value: values.rideEnd,
      });
    }
    if (values.rides.length > 0) {
      filters.push({
        key: "rides",
        label: "عدد الرحلات",
        value: `${values.rides[0]} - ${values.rides[1]}`,
      });
    }
    if (values.payments.length > 0) {
      filters.push({
        key: "payments",
        label: "حدود المدفوعات",
        value: `${values.payments[0]} - ${values.payments[1]} ر.س`,
      });
    }
    if (values.status.length > 0) {
      const statusLabels = values.status.map((s: string) =>
        s === "1" ? "نشط" : "غير نشط"
      );
      filters.push({
        key: "status",
        label: "الحالة",
        value: statusLabels.join(", "),
      });
    }
    if (values.region_id.length > 0) {
      const regionNames = values.region_id.map((id: string | number) =>
        getRegionNameById(id)
      );
      filters.push({
        key: "region_id",
        label: "المدينة",
        value: regionNames.join(", "),
      });
    }

    setActiveFilters(filters);
    setIsFiltered(filters.length > 0);
  };

  const removeFilter = (filterKey: string, formikProps: any) => {
    // Reset the corresponding input field
    switch (filterKey) {
      case "rideFrom":
      case "rideEnd":
        formikProps.setFieldValue(filterKey, "");
        break;
      case "rides":
      case "payments":
        formikProps.setFieldValue(filterKey, []);
        break;
      case "status":
      case "region_id":
        formikProps.setFieldValue(filterKey, []);
        break;
    }

    // Remove from active filters
    setActiveFilters((prev) => prev.filter((f) => f.key !== filterKey));
    setIsFiltered(activeFilters.length > 1);

    // Trigger form submission to update URL
    formikProps.submitForm();
  };

  return (
    <div className=" flex flex-col gap-5 border border-gray200 rounded-12 p-5">
      <p className="text-20 text-textMain font-[700]">فلترة</p>
      <Formik
        initialValues={{
          rideFrom: "",
          rideEnd: "",
          rides: [],
          payments: [],
          status: [] as string[],
          region_id: [] as string[] | [] as number[],
        }}
        onSubmit={(values) => {
          saveScrollPosition();
          // Preserve existing params like itemPerPage
          const params = new URLSearchParams(searchParams.toString());

          // Clear old filter params
          const keysToDelete: string[] = [];
          params.forEach((_, key) => {
            if (key.startsWith("filters[")) {
              keysToDelete.push(key);
            }
          });
          keysToDelete.forEach((key) => params.delete(key));

          // Reset to page 1 when applying filters
          params.set("page", "1");
          if (values.rideFrom)
            params.append("filters[ride_date][min]", values.rideFrom);
          if (values.rideEnd)
            params.append("filters[ride_date][max]", values.rideEnd);
          if (values.rides.length > 0) {
            params.append("filters[rides_count][min]", values.rides[0]);
            params.append("filters[rides_count][max]", values.rides[1]);
          }
          if (values.payments.length > 0) {
            params.append("filters[rides_amount][min]", values.payments[0]);
            params.append("filters[rides_amount][max]", values.payments[1]);
          }
          if (values.status.length > 0 && values.status.length < 2) {
            values.status.forEach((status) =>
              params.append("filters[is_active][]", status)
            );
          }
          if (values.region_id.length > 0) {
            values.region_id.forEach((region: any) =>
              params.append("filters[region_id][]", region)
            );
          }

          updateActiveFilters(values);
          setIsLoading(true);

          startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
          });
        }}
      >
        {(props) => (
          <Form>
            <Accordion
              type="multiple"
              className=" grid grid-cols-1 md:grid-cols-2 gap-5"
            >
              {/* ... (your existing AccordionItems remain the same) ... */}
              <AccordionItem
                value="item-1"
                className="border border-gray200 rounded-6 px-2 col-span-1 md:md:col-span-2 "
              >
                <AccordionTrigger className="flex items-center gap-2  w-full border-none ">
                  <ArrowLeftFilter />
                  <span className="text-14 text-textSubText font-[600]">
                    التواريخ
                  </span>
                  <span className="w-2 h-2 rounded-full bg-primaryColor block"></span>
                </AccordionTrigger>
                <AccordionContent className=" grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                  <DateInput
                    name="rideFrom"
                    label="تاريخ الرحلات من"
                    formikProps={props}
                  />
                  <DateInput
                    name="rideEnd"
                    label="إلى"
                    formikProps={props}
                    labelStyle="text-14 font-[400]"
                  />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem
                value="item-2"
                className="border border-gray200 rounded-6 px-2"
              >
                <AccordionTrigger className="flex items-center gap-2  w-full border-none ">
                  <ArrowLeftFilter />
                  <span className="text-14 text-textSubText font-[600]">
                    عدد الرحلات
                  </span>
                  <span className="w-2 h-2 rounded-full bg-primaryColor block"></span>
                </AccordionTrigger>
                <AccordionContent className=" my-5">
                  <RangeSliderComponent
                    min={0}
                    max={1000}
                    step={1}
                    formikProps={props}
                    name={"rides"}
                    labelName={"رحلة"}
                  />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem
                value="item-3"
                className="border border-gray200 rounded-6 px-2"
              >
                <AccordionTrigger className="flex items-center gap-2  w-full border-none ">
                  <ArrowLeftFilter />
                  <span className="text-14 text-textSubText font-[600]">
                    حدود المدفوعات
                  </span>
                  <span className="w-2 h-2 rounded-full bg-primaryColor block"></span>
                </AccordionTrigger>
                <AccordionContent className=" my-5">
                  <RangeSliderComponent
                    min={0}
                    max={50000}
                    step={1}
                    formikProps={props}
                    name={"payments"}
                    labelName={"ر.س"}
                  />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem
                value="item-4"
                className="border border-gray200 rounded-6 px-2"
              >
                <AccordionTrigger className="flex items-center gap-2  w-full border-none ">
                  <ArrowLeftFilter />
                  <span className="text-14 text-textSubText font-[600]">
                    الحالة
                  </span>
                  <span className="w-2 h-2 rounded-full bg-primaryColor block"></span>
                </AccordionTrigger>
                <AccordionContent className=" mt-5">
                  <div className=" flex flex-col gap-5">
                    <div className=" flex items-center gap-3">
                      <Checkbox
                        id="active"
                        name="status"
                        checked={props.values.status.includes("1")}
                        onCheckedChange={(checked) => {
                          const newStatus = checked
                            ? [...props.values.status, "1"]
                            : props.values.status.filter((s) => s !== "1");
                          props.setFieldValue("status", newStatus);
                        }}
                      />
                      <label
                        htmlFor="active"
                        className="text-14 text-textMain font-[600]"
                      >
                        نشط
                      </label>
                    </div>
                    <div className=" flex items-center gap-3">
                      <Checkbox
                        id="blocked"
                        name="status"
                        checked={props.values.status.includes("0")}
                        onCheckedChange={(checked) => {
                          const newStatus = checked
                            ? [...props.values.status, "0"]
                            : props.values.status.filter((s) => s !== "0");
                          props.setFieldValue("status", newStatus);
                        }}
                      />
                      <label
                        htmlFor="blocked"
                        className="text-14 text-textMain font-[600]"
                      >
                        غير نشط
                      </label>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem
                value="item-5"
                className="border border-gray200 rounded-6 px-2"
              >
                <AccordionTrigger className="flex items-center gap-2 w-full border-none">
                  <ArrowLeftFilter />
                  <span className="text-14 text-textSubText font-[600]">
                    المدينة
                  </span>
                  <span className="w-2 h-2 rounded-full bg-primaryColor block"></span>
                </AccordionTrigger>
                <AccordionContent className="my-5 flex flex-col gap-5 max-h-[150px] overflow-auto custom-scrollbar">
                  {/* Search Input */}
                  <input
                    type="text"
                    placeholder="ابحث عن مدينة..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full border border-gray200 rounded-6 p-2 text-14 max-w-[95%] mx-auto shadow-none focus:outline-none focus:ring-0 focus:border-gray200 focus-visible:right-0"
                  />
                  {/* Filtered Regions List */}
                  {filteredRegions.length > 0 ? (
                    filteredRegions.map((region: any) => (
                      <div key={region.id} className="flex items-center gap-3">
                        <Checkbox
                          id={region.name_en}
                          name="region_id"
                          checked={props.values.region_id.includes(region.id)}
                          onCheckedChange={(checked) => {
                            const newRegions = checked
                              ? [...props.values.region_id, region.id]
                              : props.values.region_id.filter(
                                  (id) => id !== region.id
                                );
                            props.setFieldValue("region_id", newRegions);
                          }}
                        />
                        <label
                          htmlFor={region.name_en}
                          className="text-14 text-textMain font-[600]"
                        >
                          {region.name_ar}
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-14 text-textSubText">
                      لا توجد مدن مطابقة
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Active Filters Display */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5">
                {activeFilters.map((filter) => (
                  <div
                    key={filter.key}
                    className="flex items-center gap-2 bg-primaryColorLight px-3 py-1 rounded-[6px]  text-12"
                  >
                    <span className="font-[600]">{filter.label}:</span>
                    <span>{filter.value}</span>
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

            <div className="flex items-center gap-3 mt-5">
              <Button type="submit" variant="primary">
                تطبيق
              </Button>
              {isFiltered && (
                <Button
                  type="button"
                  variant="primary"
                  className="text-primaryColor bg-white border border-primaryColor hover:bg-white"
                  onClick={() => {
                    // Reset all form values
                    props.resetForm();
                    // Clear active filters
                    setActiveFilters([]);
                    setIsFiltered(false);
                    // Reset search query
                    setSearchQuery("");
                    // Redirect to clean URL
                    window.location.href = `/${locale}/customers`;
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

export default Index;
