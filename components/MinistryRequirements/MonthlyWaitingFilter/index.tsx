"use client";
import DateInput from "@/components/shared/form/DateInput";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ArrowLeftFilter, RemoveX } from "@/public/SVG";
import { Form, Formik } from "formik";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, Download, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { MonthlyWaitingData } from "./columns";
import { convertDateFormat } from "@/lib/helperFunctions";
import { Checkbox } from "@/components/ui/checkbox";
import { fetcherClient } from "@/lib/fetcherClient";

interface Province {
  region_id: number;
  region_name: string;
  created_at: string;
  updated_at: string;
}

interface ProvinceResponse {
  success: boolean;
  code: number;
  message: string;
  data: Province[];
}

interface WaitingAveragesResponse {
  success: boolean;
  code: number;
  message: string;
  data: MonthlyWaitingData[] | Record<string, unknown>;
}

interface MonthlyWaitingFilterProps {
  currentPage?: number;
  totalPages?: number;
}

const MonthlyWaitingFilter = ({
  currentPage = 1,
  totalPages = 1,
}: MonthlyWaitingFilterProps) => {
  const [isFiltered, setIsFiltered] = useState(false);
  const [activeFilters, setActiveFilters] = useState<
    { key: string; label: string; value: any }[]
  >([]);
  const [citySearchOpen, setCitySearchOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<(string | number)[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [data, setData] = useState<MonthlyWaitingData[]>([]);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Fetch provinces on component mount
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        setIsLoadingProvinces(true);
        const response = await fetcherClient<ProvinceResponse>(
          "/wasl/provinces",
          { method: "GET" }
        );
        if (response.success && response.data) {
          setProvinces(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch provinces:", error);
      } finally {
        setIsLoadingProvinces(false);
      }
    };

    fetchProvinces();
  }, []);

  // Fetch waiting averages function
  const fetchWaitingAverages = useCallback(async (from?: string | null, to?: string | null, regionIds?: string | null) => {
    // Only fetch if we have date range
    if (!from || !to) {
      setData([]);
      return;
    }

    try {
      setIsLoadingData(true);
      const params = new URLSearchParams();
      params.append("from", from.split(" ")[0]); // Get just the date part
      params.append("to", to.split(" ")[0]); // Get just the date part
      // Send region_ids if one or more cities are selected
      if (regionIds && regionIds.length > 0) {
        params.append("region_ids", regionIds);
      }

      const response = await fetcherClient<WaitingAveragesResponse>(
        `/wasl/waiting-averages?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store"
        }
      );

      if (response.success && response.data) {
        // Transform API data to match our component structure
        const transformedData = Array.isArray(response.data)
          ? response.data.map((item: any, index: number) => ({
            id: index, // Use index as ID since API doesn't provide one
            province_name: item.region_name, // API returns region_name, component expects province_name
            average_waiting_time: item.average_waiting_time,
            from: item.from,
            to: item.to,
          }))
          : [];
        setData(transformedData);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error("Failed to fetch waiting averages:", error);
      setData([]);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // Fetch waiting averages based on search params
  useEffect(() => {
    const from = searchParams.get("filters[date][min]");
    const to = searchParams.get("filters[date][max]");
    const regionIds = searchParams.get("filters[cities]");

    fetchWaitingAverages(from, to, regionIds);
  }, [searchParams, fetchWaitingAverages]);

  // Reset selected items when data changes
  useEffect(() => {
    setSelectedItems([]);
  }, [data]);

  const updateActiveFilters = (values: any) => {
    const filters: { key: string; label: string; value: any }[] = [];

    if (values.dateFrom)
      filters.push({
        key: "dateFrom",
        label: "من تاريخ",
        value: values.dateFrom,
      });
    if (values.dateTo)
      filters.push({
        key: "dateTo",
        label: "إلى تاريخ",
        value: values.dateTo,
      });
    if (values.cities && values.cities.length > 0) {
      // Filter out invalid city IDs (NaN, null, undefined)
      const validCities = values.cities.filter((cityId: any) =>
        cityId != null && !isNaN(Number(cityId))
      );

      if (validCities.length > 0) {
        const cityLabels = validCities.map(
          (cityId: number) =>
            provinces.find((p) => p.region_id === cityId)?.region_name || cityId
        );
        filters.push({
          key: "cities",
          label: "المدن",
          value: cityLabels.join(", "),
        });
      }
    }

    setActiveFilters(filters);
    setIsFiltered(filters.length > 0);
  };

  const parseCommaSeparated = (name: string) => {
    const value = searchParams.get(`filters[${name}]`);
    if (!value) return [];
    return value.split(",").filter(Boolean).map(Number);
  };

  const getLastMonthDateRange = () => {
    const today = new Date();
    // First day of last month
    const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    // Last day of last month
    const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    return { dateFrom: fmt(firstDay), dateTo: fmt(lastDay) };
  };

  const getInitialValuesFromParams = () => {
    const lastMonth = getLastMonthDateRange();
    const defaults = {
      dateFrom: lastMonth.dateFrom,
      dateTo: lastMonth.dateTo,
      cities: [] as number[],
    };

    const from = searchParams.get("filters[date][min]");
    const to = searchParams.get("filters[date][max]");

    // Override defaults only if URL params are explicitly set
    if (from) defaults.dateFrom = from.split(" ")[0];
    if (to) defaults.dateTo = to.split(" ")[0];

    const cities = parseCommaSeparated("cities");
    if (cities.length) defaults.cities = cities;

    return defaults;
  };

  const initialValuesFromParams = getInitialValuesFromParams();

  useEffect(() => {
    updateActiveFilters(initialValuesFromParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  const removeFilter = (filterKey: string, formikProps: any) => {
    switch (filterKey) {
      case "dateFrom":
        // Clearing start date must also clear end date (API needs both)
        formikProps.setFieldValue("dateFrom", "");
        formikProps.setFieldValue("dateTo", "");
        setActiveFilters((prev) =>
          prev.filter((f) => f.key !== "dateFrom" && f.key !== "dateTo")
        );
        break;
      case "dateTo":
        formikProps.setFieldValue("dateTo", "");
        setActiveFilters((prev) => prev.filter((f) => f.key !== "dateTo"));
        break;
      case "cities":
        formikProps.setFieldValue("cities", []);
        setActiveFilters((prev) => prev.filter((f) => f.key !== "cities"));
        break;
      default:
        setActiveFilters((prev) => prev.filter((f) => f.key !== filterKey));
    }
    setIsFiltered(
      activeFilters.filter(
        (f) =>
          filterKey === "dateFrom"
            ? f.key !== "dateFrom" && f.key !== "dateTo"
            : f.key !== filterKey
      ).length > 0
    );
    formikProps.submitForm();
  };

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedItems.length === data.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(data.map((item, index) => item.id ?? index));
    }
  };

  const handleSelectItem = (id: string | number) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Download selected data as CSV using API
  const handleDownloadSelected = async () => {
    const from = searchParams.get("filters[date][min]");
    const to = searchParams.get("filters[date][max]");

    if (!from || !to) {
      alert("الرجاء تحديد الفترة الزمنية أولاً");
      return;
    }

    if (selectedItems.length === 0) {
      alert("الرجاء اختيار بيانات للتحميل");
      return;
    }

    // Get the selected data items and extract their province IDs
    const selectedData = data.filter((item, index) =>
      selectedItems.includes(item.id ?? index)
    );

    // Extract unique province IDs from selected items
    const selectedProvinceIds = selectedData
      .map((item) => {
        // Find the province ID based on province_name
        const province = provinces.find((p) => p.region_name === item.province_name);
        return province?.region_id;
      })
      .filter((id): id is number => id !== undefined);

    // Check if we're downloading "كامل المملكة" data (when no cities filter was applied)
    const isEntireKingdom = !searchParams.get("filters[cities]");

    try {
      const params = new URLSearchParams();
      params.append("from", from.split(" ")[0]); // Get just the date part
      params.append("to", to.split(" ")[0]); // Get just the date part

      // Only send region_ids if not downloading entire kingdom data
      if (!isEntireKingdom && selectedProvinceIds.length > 0) {
        params.append("region_ids", selectedProvinceIds.join(","));
      }

      params.append("download", "true");

      const response = await fetcherClient(
        `/wasl/waiting-averages?${params.toString()}`,
        {
          method: "GET",
          responseType: "blob",
        }
      );

      // Create and download file
      const blob = new Blob([response as BlobPart], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `monthly-waiting-data-${new Date().getTime()}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // free memory
    } catch (error) {
      console.error("Failed to download data:", error);
      alert("فشل تحميل البيانات. الرجاء المحاولة مرة أخرى");
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-40">
      <div className="border border-gray200 rounded-12 p-5">
        <p className="text-20 text-textMain font-[700] mb-3">المتوسط الشهري للإنتظار</p>
        {/* Info note about default date */}
        {(() => {
          const arabicMonths = [
            "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
            "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
          ];
          const today = new Date();
          const lastMonthName = arabicMonths[today.getMonth() === 0 ? 11 : today.getMonth() - 1];
          return (
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-8 px-4 py-3 mb-5 text-right">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-14 text-blue-700 leading-relaxed">
                هذه البيانات الخاصة بالشهر الماضي{" "}
                <span className="font-[700]">({lastMonthName})</span>، وتكون محددة بشكل تلقائي.
                <br />
                ويمكنكم تغيير المدة الزمنية والمدينة حسب الاحتياج.
              </p>
            </div>
          );
        })()}
        <Formik
          initialValues={initialValuesFromParams}
          enableReinitialize={true}
          onSubmit={async (values) => {
            const params = new URLSearchParams();

            // Date filters — use the string directly to avoid UTC timezone shift
            const fromDate = values.dateFrom ? `${values.dateFrom} 00:00:00` : null;
            const toDate = values.dateTo ? `${values.dateTo} 23:59:59` : null;

            // Filter out invalid city IDs before joining
            const validCities = values.cities && values.cities.length > 0
              ? values.cities.filter((cityId: any) => cityId != null && !isNaN(Number(cityId)))
              : [];
            const cities = validCities.length > 0 ? validCities.join(",") : null;

            if (fromDate) {
              params.append("filters[date][min]", fromDate);
            }
            if (toDate) {
              params.append("filters[date][max]", toDate);
            }
            // Cities filter
            if (cities) {
              params.append("filters[cities]", cities);
            }

            updateActiveFilters(values);
            router.push(`${pathname}?${params.toString()}`);

            // Call API immediately with region_ids
            await fetchWaitingAverages(fromDate, toDate, cities);
          }}
        >
          {(props) => (
            <Form>
              <Accordion
                type="multiple"
                defaultValue={["date-range", "cities"]}
                className="flex flex-col md:flex-row gap-5"
              >
                {/* Date Range */}
                <AccordionItem
                  value="date-range"
                  className="border border-gray200 rounded-6 px-2 flex-1"
                >
                  <AccordionTrigger className="flex items-center gap-2 w-full border-none">
                    <ArrowLeftFilter />
                    <span className="text-14 text-textSubText font-[600]">
                      الفترة الزمنية
                    </span>
                    <span className="w-2 h-2 rounded-full bg-primaryColor block"></span>
                  </AccordionTrigger>
                  <AccordionContent className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                    <DateInput
                      name="dateFrom"
                      label="من تاريخ"
                      formikProps={props}
                    />
                    <DateInput
                      name="dateTo"
                      label="إلى تاريخ"
                      formikProps={props}
                      {...(props.values.dateFrom
                        ? { restrictDatesBeforeDay: props.values.dateFrom.toString() }
                        : {})}
                    />
                  </AccordionContent>
                </AccordionItem>

                {/* Cities/Zones */}
                <AccordionItem
                  value="cities"
                  className="border border-gray200 rounded-6 px-2 flex-1"
                >
                  <AccordionTrigger className="flex items-center gap-2 w-full border-none">
                    <ArrowLeftFilter />
                    <span className="text-14 text-textSubText font-[600]">
                      المدن
                    </span>
                    <span className="w-2 h-2 rounded-full bg-primaryColor block"></span>
                  </AccordionTrigger>
                  <AccordionContent className="my-5">
                    <Popover open={citySearchOpen} onOpenChange={setCitySearchOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={citySearchOpen}
                          className="w-full justify-between h-[44px] text-14 font-[400]"
                          disabled={isLoadingProvinces}
                        >
                          {isLoadingProvinces
                            ? "جاري التحميل..."
                            : props.values.cities.length > 0
                              ? `${props.values.cities.length} مدينة محددة`
                              : "اختر المدن"}
                          <ArrowLeftFilter className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="ابحث عن مدينة..." />
                          <CommandList>
                            <CommandEmpty>لا توجد نتائج</CommandEmpty>
                            <CommandGroup>
                              {provinces.map((province) => (
                                <CommandItem
                                  key={province.region_id}
                                  value={province.region_name}
                                  onSelect={() => {
                                    // Ensure province.region_id is a valid number
                                    if (!province.region_id || isNaN(Number(province.region_id))) {
                                      console.error("Invalid province ID:", province);
                                      return;
                                    }

                                    const currentCities = Array.isArray(props.values.cities) ? props.values.cities : [];
                                    const isSelected = currentCities.includes(province.region_id);

                                    const newCities = isSelected
                                      ? currentCities.filter((c: number) => c !== province.region_id)
                                      : [...currentCities, province.region_id];

                                    props.setFieldValue("cities", newCities);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      props.values.cities.includes(province.region_id)
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {province.region_name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {/* Display selected cities */}
                    {props.values.cities.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {props.values.cities.map((cityId: number) => {
                          const province = provinces.find((p) => p.region_id === cityId);
                          return (
                            <div
                              key={cityId}
                              className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-md text-12"
                            >
                              <span>{province?.region_name}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const newCities = props.values.cities.filter(
                                    (c: number) => c !== cityId
                                  );
                                  props.setFieldValue("cities", newCities);
                                }}
                                className="hover:opacity-70"
                              >
                                <RemoveX className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
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
                      className="flex items-center gap-2 bg-primaryColorLight px-3 py-1 rounded-[6px] text-12"
                    >
                      <span className="font-[600]">{filter.label}:</span>
                      <span>{filter.value}</span>
                      <button
                        type="button"
                        onClick={() => removeFilter(filter.key, props)}
                        className="hover:opacity-70 transition-opacity"
                      >
                        <RemoveX />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3 mt-5">
                <Button type="submit" variant="primary">
                  تطبيق الفلتر
                </Button>
                {isFiltered && (
                  <Button
                    type="button"
                    variant="outline"
                    className="text-primaryColor border-primaryColor hover:bg-gray50"
                    onClick={() => {
                      props.resetForm();
                      setActiveFilters([]);
                      setIsFiltered(false);
                      router.push(pathname);
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

      {/* Selection and Download Controls */}
      {data && data.length > 0 && (
        <div className="border border-gray200 rounded-12 p-5 bg-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedItems.length === data.length && data.length > 0}
                onCheckedChange={handleSelectAll}
                id="select-all"
              />
              <label
                htmlFor="select-all"
                className="text-16 font-[600] text-textMain cursor-pointer"
              >
                تحديد الكل ({selectedItems.length} من {data.length})
              </label>
            </div>
            <Button
              variant="primary"
              onClick={handleDownloadSelected}
              disabled={selectedItems.length === 0}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              تحميل المحدد ({selectedItems.length})
            </Button>
          </div>
        </div>
      )}

      {/* Cards Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoadingData ? (
          // Loading skeleton
          Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="border border-gray200 rounded-12 p-5 bg-white animate-pulse"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <div className="h-6 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="flex flex-col gap-2 pr-8">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-5 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
          ))
        ) : data && data.length > 0 ? (
          data.map((item, index) => {
            const itemId = item.id ?? index;
            return (
              <div
                key={itemId}
                className={cn(
                  "border border-gray200 rounded-12 p-5 bg-white hover:shadow-md transition-all",
                  selectedItems.includes(itemId) && "ring-2 ring-primaryColor shadow-md"
                )}
              >
                {/* Header with Checkbox and Average Waiting Time */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <Checkbox
                      checked={selectedItems.includes(itemId)}
                      onCheckedChange={() => handleSelectItem(itemId)}
                      id={`item-${itemId}`}
                      className="mt-1"
                    />
                    <h3 className="text-18 font-[700] text-textMain">
                      {item.province_name}
                    </h3>
                  </div>
                  <div className="bg-primaryColorLight text-primaryColor px-3 py-1 rounded-6 text-16 font-[700] whitespace-nowrap">
                    {item.average_waiting_time}
                  </div>
                </div>

                {/* Date Range */}
                <div className="flex flex-col gap-2 pr-8">
                  <div className="text-14 text-textSubText font-[600]">
                    الفترة الزمنية
                  </div>
                  <div className="text-16 font-[600] text-gray600">
                    {convertDateFormat(item.from)} - {convertDateFormat(item.to)}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-10 text-gray600">
            {searchParams.get("filters[date][min]") && searchParams.get("filters[date][max]")
              ? "لا يوجد بيانات للفترة المحددة"
              : "الرجاء تحديد الفترة الزمنية والمدن لعرض البيانات"}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-5">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={cn(
                "px-4 py-2 rounded-6 text-14 font-[600] transition-colors",
                page === currentPage
                  ? "bg-primaryColor text-white"
                  : "bg-gray100 text-gray600 hover:bg-gray200"
              )}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("page", page.toString());
                router.push(`${pathname}?${params.toString()}`);
              }}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MonthlyWaitingFilter;
