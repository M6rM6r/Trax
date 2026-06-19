"use client";
import DateInput from "@/components/shared/form/DateInput";
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
import { allEnumsData } from "@/lib/types/enums";
import { ArrowLeftFilter, RemoveX } from "@/public/SVG";
import { Form, Formik } from "formik";
import { useLocale } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDataTableLoading } from "@/components/shared/DataTable/DataTableLoadingContext";
import { useState, useEffect } from "react";

// Updated enums
const tripStatusEnums = {
  en: {
    done: "done",
    pending: "pending",
    accepted: "accepted",
    driver_arrived: "driver_arrived",
    canceled_by_customer: "canceled_by_customer",
    canceled_by_driver: "canceled_by_driver",
    on_the_way: "on_the_way",
    processing: "processing",
    scheduled: "scheduled",
  },
  ar: {
    done: "الرحلة اكتملت",
    pending: "قيد الإنتظار",
    accepted: "مقبول",
    driver_arrived: "السائق وصل",
    canceled_by_customer: "ألغيت من قبل العميل",
    canceled_by_driver: "ألغيت من قبل السائق",
    on_the_way: "في الطريق",
    processing: "قيد المعالجة",
    scheduled: "مجدولة",
  },
};

const paymentStatusEnums = {
  en: {
    paid: "paid",
    unpaid: "unpaid",
    pending: "pending",
  },
  ar: {
    paid: "تمت بنجاح",
    unpaid: "لم يتم الدفع",
    pending: "قيد الإنتظار",
  },
};

// Payment method labels for display (Arabic)
const paymentMethodEnums = {
  en: {
    cash: "cash",
    creditcard: "creditcard",
    stcpay: "stcpay",
    applepay: "applepay",
  },
  ar: {
    cash: "كاش",
    creditcard: "كارت بنكى",
    stcpay: "STC Pay",
    applepay: "Apple Pay",
  },
};

const TripsFilter = () => {
  const [isFiltered, setIsFiltered] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<
    { key: string; label: string; value: any }[]
  >([]);
  const locale = useLocale();
  const { saveScrollPosition } = useScrollPreservation();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { startTransition, setIsLoading } = useDataTableLoading();

  const updateActiveFilters = (values: any) => {
    const filters: { key: string; label: string; value: any }[] = [];

    if (values.requestedFrom)
      filters.push({
        key: "requestedFrom",
        label: "من تاريخ الطلب",
        value: values.requestedFrom,
      });
    if (values.requestedTo)
      filters.push({
        key: "requestedTo",
        label: "إلى تاريخ الطلب",
        value: values.requestedTo,
      });
    if (
      values.priceRange.length > 0 &&
      (values.priceRange[0] > 0 || values.priceRange[1] < 1000)
    )
      filters.push({
        key: "priceRange",
        label: "نطاق السعر",
        value: `${values.priceRange[0]} - ${values.priceRange[1]} ر.س`,
      });
    // Distance range active filter
    if (
      values.distanceRange &&
      (values.distanceRange[0] > 0 || values.distanceRange[1] < 5000)
    )
      filters.push({
        key: "distanceRange",
        label: "المسافة المقطوعة",
        value: `${values.distanceRange[0]} - ${values.distanceRange[1]} ك.م`,
      });
    // Duration range active filter
    if (
      values.durationRange &&
      (values.durationRange[0] > 0 || values.durationRange[1] < 500)
    )
      filters.push({
        key: "durationRange",
        label: "مدة الرحلة",
        value: `${values.durationRange[0]} - ${values.durationRange[1]} دقيقة`,
      });
    if (values.paymentStatus.length > 0) {
      const paymentLabels = values.paymentStatus.map(
        (s: string) =>
          paymentStatusEnums.ar[s as keyof typeof paymentStatusEnums.ar] || s
      );
      filters.push({
        key: "paymentStatus",
        label: "حالة الدفع",
        value: paymentLabels.join(", "),
      });
    }
    if (values.tripStatus.length > 0) {
      const tripStatuslabels = values.tripStatus.map(
        (s: string) =>
          tripStatusEnums.ar[s as keyof typeof tripStatusEnums.ar] || s
      );
      filters.push({
        key: "tripStatus",
        label: "حالة الرحلة",
        value: tripStatuslabels.join(", "), // user sees Arabic labels
      });
    }

    if (values.serviceType.length > 0) {
      const serviceLabels = values.serviceType.map((s: string) => {
        // Use existing enum or custom mapping for fuel, tires, and towing
        if (s === "fuel") return "وقود";
        if (s === "tires") return "إطارات";
        if (s === "towing") return "العالقين فى الرمال";
        return (
          allEnumsData.ServiceTypes.ar[
            s as keyof typeof allEnumsData.ServiceTypes.ar
          ] || s
        );
      });
      filters.push({
        key: "serviceType",
        label: "نوع الخدمة",
        value: serviceLabels.join(", "),
      });
    }
    if (values.paymentMethod && values.paymentMethod.length > 0) {
      const methodLabels = values.paymentMethod.map(
        (m: string) =>
          paymentMethodEnums.ar[m as keyof typeof paymentMethodEnums.ar] || m
      );
      filters.push({
        key: "paymentMethod",
        label: "طريقة الدفع",
        value: methodLabels.join(", "),
      });
    }

    setActiveFilters(filters);
    setIsFiltered(filters.length > 0);
  };

  // Parse search params into initial form values so filters persist on hard reload
  const parseCommaSeparated = (name: string) => {
    const value = searchParams.get(`filters[${name}]`);
    if (!value) return [];
    return value.split(",").filter(Boolean);
  };

  const getInitialValuesFromParams = () => {
    const defaults = {
      requestedFrom: "",
      requestedTo: "",
      priceRange: [0, 1000] as number[],
      distanceRange: [0, 5000] as number[],
      durationRange: [0, 500] as number[],
      paymentStatus: [] as string[],
      paymentMethod: [] as string[],
      tripStatus: [] as string[],
      serviceType: [] as string[],
      region_id: [] as (string | number)[],
    };

    // Dates - handle both old format (min/max) and new format (single value)
    const requestedAt = searchParams.get("filters[requested_at]");
    const from = searchParams.get("filters[requested_at][min]");
    const to = searchParams.get("filters[requested_at][max]");

    if (requestedAt) {
      // If using new format with single datetime value, use it for both
      defaults.requestedFrom = requestedAt.split(" ")[0];
      defaults.requestedTo = requestedAt.split(" ")[0];
    } else {
      // Use old min/max format
      if (from) defaults.requestedFrom = from;
      if (to) defaults.requestedTo = to;
    }

    // Price
    const pMin = searchParams.get("filters[price][min]");
    const pMax = searchParams.get("filters[price][max]");
    if (pMin || pMax) {
      defaults.priceRange = [
        pMin ? parseInt(pMin, 10) : 0,
        pMax ? parseInt(pMax, 10) : 1000,
      ];
    }

    // Distance
    const dMin = searchParams.get("filters[ride_distance][min]");
    const dMax = searchParams.get("filters[ride_distance][max]");
    if (dMin || dMax) {
      defaults.distanceRange = [
        dMin ? parseInt(dMin, 10) : 0,
        dMax ? parseInt(dMax, 10) : 5000,
      ];
    }

    // Duration
    const duMin = searchParams.get("filters[ride_duration][min]");
    const duMax = searchParams.get("filters[ride_duration][max]");
    if (duMin || duMax) {
      defaults.durationRange = [
        duMin ? parseInt(duMin, 10) : 0,
        duMax ? parseInt(duMax, 10) : 500,
      ];
    }

    // Comma-separated arrays from new API format
    const paymentStatus = parseCommaSeparated("payment_status");
    if (paymentStatus.length) defaults.paymentStatus = paymentStatus;

    const paymentMethod = parseCommaSeparated("payment_method");
    if (paymentMethod.length) defaults.paymentMethod = paymentMethod;

    const status = parseCommaSeparated("status");
    if (status.length) defaults.tripStatus = status;

    const serviceType = parseCommaSeparated("service_type");
    if (serviceType.length) defaults.serviceType = serviceType;

    return defaults;
  };

  const initialValuesFromParams = getInitialValuesFromParams();

  useEffect(() => {
    // ensure active filter chips reflect initial params on load
    updateActiveFilters(initialValuesFromParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  const removeFilter = (filterKey: string, formikProps: any) => {
    switch (filterKey) {
      case "requestedFrom":
      case "requestedTo":
        formikProps.setFieldValue(filterKey, "");
        break;
      case "priceRange":
        formikProps.setFieldValue(filterKey, [0, 1000]);
        break;
      case "paymentStatus":
      case "tripStatus":
      case "serviceType":
      case "region_id":
      case "paymentMethod":
        formikProps.setFieldValue(filterKey, []);
        break;
      case "distanceRange":
        formikProps.setFieldValue(filterKey, [0, 5000]);
        break;
      case "durationRange":
        formikProps.setFieldValue(filterKey, [0, 500]);
        break;
    }
    setActiveFilters((prev) => prev.filter((f) => f.key !== filterKey));
    setIsFiltered(activeFilters.length > 1);
    formikProps.submitForm();
  };

  // Get service types from enums + add fuel, tires, and towing options
  const serviceTypes = [
    ...Object.entries(allEnumsData.ServiceTypes.ar).map(([key, value]) => ({
      id: key,
      label: value as string,
    })),
    { id: "fuel", label: "وقود" }, // Add fuel option
    { id: "tires", label: "إطارات" }, // Add tires option
    { id: "towing", label: "العالقين فى الرمال" }, // Add towing option
  ];

  // Trip status options (value = backend key, label = Arabic)
  const tripStatusOptions = Object.entries(tripStatusEnums.ar).map(
    ([key, label]) => ({
      id: key, // backend expects keys like "accepted", "done"
      label, // display Arabic label
    })
  );

  // Get payment status options from updated enums
  const paymentStatusOptions = Object.entries(paymentStatusEnums.ar).map(
    ([key, value]) => ({
      id: key,
      label: value as string,
    })
  );

  // Get payment method options
  const paymentMethodOptions = Object.entries(paymentMethodEnums.ar).map(
    ([key, value]) => ({ id: key, label: value as string })
  );

  return (
    <div className="flex flex-col gap-5 border border-gray200 rounded-12 p-5">
      <p className="text-20 text-textMain font-[700]">فلترة الرحلات</p>
      <Formik
        initialValues={initialValuesFromParams}
        enableReinitialize={true}
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

          // Date filters - Use min/max format for date ranges
          if (values.requestedFrom) {
            const fromDate = new Date(values.requestedFrom);
            const formattedFrom = fromDate.toISOString()?.split("T")[0];
            params.append("filters[requested_at][min]", `${formattedFrom} 00:00:00`);
          }
          if (values.requestedTo) {
            const toDate = new Date(values.requestedTo);
            const formattedTo = toDate.toISOString()?.split("T")[0];
            params.append("filters[requested_at][max]", `${formattedTo} 23:59:59`);
          }

          // Price range filter - FIXED: Only apply when values are meaningful
          if (values.priceRange[0] > 0 || values.priceRange[1] < 1000) {
            const priceMin = values.priceRange[0] ?? 0;
            const priceMax = values.priceRange[1] ?? 1000;
            params.append("filters[price][min]", String(priceMin));
            params.append("filters[price][max]", String(priceMax));
          }

          // Ride distance filter - FIXED: Only apply when values are meaningful
          if (values.distanceRange && values.distanceRange.length === 2) {
            const distMin = values.distanceRange[0] ?? 0;
            const distMax = values.distanceRange[1] ?? 5000;
            if (distMin > 0 || distMax < 5000) {
              params.append("filters[ride_distance][min]", String(distMin));
              params.append("filters[ride_distance][max]", String(distMax));
            }
          }

          // Ride duration filter - FIXED: Only apply when values are meaningful
          if (values.durationRange && values.durationRange.length === 2) {
            const durMin = values.durationRange[0] ?? 0;
            const durMax = values.durationRange[1] ?? 500;
            if (durMin > 0 || durMax < 500) {
              params.append("filters[ride_duration][min]", String(durMin));
              params.append("filters[ride_duration][max]", String(durMax));
            }
          }

          // Payment status filter - use single value format from API
          if (values.paymentStatus.length > 0) {
            params.append("filters[payment_status]", values.paymentStatus.join(","));
          }

          // Payment method filter - use single value format from API
          if (values.paymentMethod.length > 0) {
            params.append("filters[payment_method]", values.paymentMethod.join(","));
          }

          // Trip status filter - use single value format from API
          if (values.tripStatus.length > 0) {
            params.append("filters[status]", values.tripStatus.join(","));
          }

          // Service type filter - use single value format from API
          if (values.serviceType.length > 0) {
            params.append("filters[service_type]", values.serviceType.join(","));
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
            {/* Keep your existing accordion structure */}
            <Accordion
              type="multiple"
              className="grid grid-cols-1 md:grid-cols-2 gap-5"
            >
              {/* Request Date Range */}
              <AccordionItem
                value="request-date"
                className="border border-gray200 rounded-6 px-2 col-span-1 md:col-span-2"
              >
                <AccordionTrigger className="flex items-center gap-2 w-full border-none">
                  <ArrowLeftFilter />
                  <span className="text-14 text-textSubText font-[600]">
                    موعد الطلب
                  </span>
                  <span className="w-2 h-2 rounded-full bg-primaryColor block"></span>
                </AccordionTrigger>
                <AccordionContent className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                  <DateInput
                    name="requestedFrom"
                    label="من تاريخ"
                    formikProps={props}
                    restrictDatesAfterDay={new Date().toISOString()}
                  />
                  <DateInput
                    name="requestedTo"
                    label="إلى تاريخ"
                    formikProps={props}
                    restrictDatesBeforeDay={props.values.requestedFrom.toString()}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* Price Range */}
              <AccordionItem
                value="price-range"
                disabled
                className="
    border border-gray-200 rounded-6 px-2 
    opacity-50 
    pointer-events-none 
    bg-gray-50 
    text-gray-400
  "
              >
                <AccordionTrigger className="flex items-center gap-2 w-full border-none">
                  <ArrowLeftFilter />
                  <span className="text-14 text-textSubText font-[600]">
                    نطاق السعر (ر.س)
                  </span>
                  <span className="w-2 h-2 rounded-full bg-primaryColor block"></span>
                </AccordionTrigger>
                <AccordionContent className="my-5">
                  <div className="space-y-4">
                    <div className="flex justify-between text-14 text-textMain">
                      <span>{props.values.priceRange[0]} ر.س</span>
                      <span>{props.values.priceRange[1]} ر.س</span>
                    </div>
                    <div className="px-2 space-y-4">
                      <input
                        type="range"
                        min="0"
                        max="1000"
                        step="10"
                        value={props.values.priceRange[0]}
                        onChange={(e) => {
                          const newMin = parseInt(e.target.value);
                          if (newMin <= props.values.priceRange[1]) {
                            props.setFieldValue("priceRange", [
                              newMin,
                              props.values.priceRange[1],
                            ]);
                          }
                        }}
                        className="w-full h-2 bg-gray200 rounded-lg appearance-none cursor-pointer"
                      />
                      <input
                        type="range"
                        min="0"
                        max="1000"
                        step="10"
                        value={props.values.priceRange[1]}
                        onChange={(e) => {
                          const newMax = parseInt(e.target.value);
                          if (newMax >= props.values.priceRange[0]) {
                            props.setFieldValue("priceRange", [
                              props.values.priceRange[0],
                              newMax,
                            ]);
                          }
                        }}
                        className="w-full h-2 bg-gray200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Ride Distance */}
              <AccordionItem
                value="ride-distance"
                disabled
                className="
    border border-gray-200 rounded-6 px-2 
    opacity-50 
    pointer-events-none 
    bg-gray-50 
    text-gray-400
  "
              >
                <AccordionTrigger className="flex items-center gap-2 w-full border-none">
                  <ArrowLeftFilter />
                  <span className="text-14 text-textSubText font-[600]">
                    المسافة المقطوعة (ك.م)
                  </span>
                  <span className="w-2 h-2 rounded-full bg-primaryColor block"></span>
                </AccordionTrigger>
                <AccordionContent className="my-5">
                  <div className="space-y-4">
                    <div className="flex justify-between text-14 text-textMain">
                      <span>{props.values.distanceRange[0]} ك.م</span>
                      <span>{props.values.distanceRange[1]} ك.م</span>
                    </div>
                    <div className="px-2 space-y-4">
                      <input
                        type="range"
                        min="0"
                        max="5000"
                        step="1"
                        value={props.values.distanceRange[0]}
                        onChange={(e) => {
                          const newMin = parseInt(e.target.value);
                          if (newMin <= props.values.distanceRange[1]) {
                            props.setFieldValue("distanceRange", [
                              newMin,
                              props.values.distanceRange[1],
                            ]);
                          }
                        }}
                        className="w-full h-2 bg-gray200 rounded-lg appearance-none cursor-pointer"
                      />
                      <input
                        type="range"
                        min="0"
                        max="5000"
                        step="5"
                        value={props.values.distanceRange[1]}
                        onChange={(e) => {
                          const newMax = parseInt(e.target.value);
                          if (newMax >= props.values.distanceRange[0]) {
                            props.setFieldValue("distanceRange", [
                              props.values.distanceRange[0],
                              newMax,
                            ]);
                          }
                        }}
                        className="w-full h-2 bg-gray200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Ride Duration */}
              <AccordionItem
                value="ride-duration"
                disabled
                className="
    border border-gray-200 rounded-6 px-2 
    opacity-50 
    pointer-events-none 
    bg-gray-50 
    text-gray-400
  "
              >
                <AccordionTrigger className="flex items-center gap-2 w-full border-none">
                  <ArrowLeftFilter />
                  <span className="text-14 text-textSubText font-[600]">
                    مدة الرحلة (دقيقة)
                  </span>
                  <span className="w-2 h-2 rounded-full bg-primaryColor block"></span>
                </AccordionTrigger>
                <AccordionContent className="my-5">
                  <div className="space-y-4">
                    <div className="flex justify-between text-14 text-textMain">
                      <span>{props.values.durationRange[0]} دقيقة</span>
                      <span>{props.values.durationRange[1]} دقيقة</span>
                    </div>
                    <div className="px-2 space-y-4">
                      <input
                        type="range"
                        min="0"
                        max="500"
                        step="1"
                        value={props.values.durationRange[0]}
                        onChange={(e) => {
                          const newMin = parseInt(e.target.value);
                          if (newMin <= props.values.durationRange[1]) {
                            props.setFieldValue("durationRange", [
                              newMin,
                              props.values.durationRange[1],
                            ]);
                          }
                        }}
                        className="w-full h-2 bg-gray200 rounded-lg appearance-none cursor-pointer"
                      />
                      <input
                        type="range"
                        min="0"
                        max="500"
                        step="1"
                        value={props.values.durationRange[1]}
                        onChange={(e) => {
                          const newMax = parseInt(e.target.value);
                          if (newMax >= props.values.durationRange[0]) {
                            props.setFieldValue("durationRange", [
                              props.values.durationRange[0],
                              newMax,
                            ]);
                          }
                        }}
                        className="w-full h-2 bg-gray200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Payment Method */}
              <AccordionItem
                value="payment-method"
                className="border border-gray200 rounded-6 px-2"
              >
                <AccordionTrigger className="flex items-center gap-2 w-full border-none">
                  <ArrowLeftFilter />
                  <span className="text-14 text-textSubText font-[600]">
                    طريقة الدفع
                  </span>
                  <span className="w-2 h-2 rounded-full bg-primaryColor block"></span>
                </AccordionTrigger>
                <AccordionContent className="my-5">
                  <div className="flex flex-col gap-3">
                    {paymentMethodOptions.map((method) => (
                      <div key={method.id} className="flex items-center gap-3">
                        <Checkbox
                          id={`paymentmethod-${method.id}`}
                          name="paymentMethod"
                          checked={props.values.paymentMethod.includes(
                            method.id
                          )}
                          onCheckedChange={(checked) => {
                            const newMethods = checked
                              ? [...props.values.paymentMethod, method.id]
                              : props.values.paymentMethod.filter(
                                  (m: string) => m !== method.id
                                );
                            props.setFieldValue("paymentMethod", newMethods);
                          }}
                        />
                        <label
                          htmlFor={`paymentmethod-${method.id}`}
                          className="text-14 text-textMain font-[600]"
                        >
                          {method.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Payment Status */}
              <AccordionItem
                value="payment-status"
                className="border border-gray200 rounded-6 px-2"
              >
                <AccordionTrigger className="flex items-center gap-2 w-full border-none">
                  <ArrowLeftFilter />
                  <span className="text-14 text-textSubText font-[600]">
                    حالة الدفع
                  </span>
                  <span className="w-2 h-2 rounded-full bg-primaryColor block"></span>
                </AccordionTrigger>
                <AccordionContent className="my-5">
                  <div className="flex flex-col gap-3">
                    {paymentStatusOptions.map((status) => (
                      <div key={status.id} className="flex items-center gap-3">
                        <Checkbox
                          id={`payment-${status.id}`}
                          name="paymentStatus"
                          checked={props.values.paymentStatus.includes(
                            status.id
                          )}
                          onCheckedChange={(checked) => {
                            const newStatus = checked
                              ? [...props.values.paymentStatus, status.id]
                              : props.values.paymentStatus.filter(
                                  (s) => s !== status.id
                                );
                            props.setFieldValue("paymentStatus", newStatus);
                          }}
                        />
                        <label
                          htmlFor={`payment-${status.id}`}
                          className="text-14 text-textMain font-[600]"
                        >
                          {status.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Trip Status */}
              <AccordionItem
                value="trip-status"
                className="border border-gray200 rounded-6 px-2"
              >
                <AccordionTrigger className="flex items-center gap-2 w-full border-none">
                  <ArrowLeftFilter />
                  <span className="text-14 text-textSubText font-[600]">
                    حالة الرحلة
                  </span>
                  <span className="w-2 h-2 rounded-full bg-primaryColor block"></span>
                </AccordionTrigger>
                <AccordionContent className="mt-5">
                  <div className="flex flex-col gap-3">
                    {tripStatusOptions.map((status) => (
                      <div key={status.id} className="flex items-center gap-3">
                        <Checkbox
                          id={`trip-${status.id}`}
                          name="tripStatus"
                          checked={props.values.tripStatus.includes(status.id)}
                          onCheckedChange={(checked) => {
                            const newStatus = checked
                              ? [...props.values.tripStatus, status.id]
                              : props.values.tripStatus.filter(
                                  (s) => s !== status.id
                                );
                            props.setFieldValue("tripStatus", newStatus);
                          }}
                        />
                        <label
                          htmlFor={`trip-${status.id}`}
                          className="text-14 text-textMain font-[600]"
                        >
                          {status.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Service Type */}
              <AccordionItem
                value="service-type"
                className="border border-gray200 rounded-6 px-2"
              >
                <AccordionTrigger className="flex items-center gap-2 w-full border-none">
                  <ArrowLeftFilter />
                  <span className="text-14 text-textSubText font-[600]">
                    نوع الخدمة
                  </span>
                  <span className="w-2 h-2 rounded-full bg-primaryColor block"></span>
                </AccordionTrigger>
                <AccordionContent className="my-5">
                  <div className="flex flex-col gap-3">
                    {serviceTypes.map((service) => (
                      <div key={service.id} className="flex items-center gap-3">
                        <Checkbox
                          id={`service-${service.id}`}
                          name="serviceType"
                          checked={props.values.serviceType.includes(
                            service.id
                          )}
                          onCheckedChange={(checked) => {
                            const newTypes = checked
                              ? [...props.values.serviceType, service.id]
                              : props.values.serviceType.filter(
                                  (t) => t !== service.id
                                );
                            props.setFieldValue("serviceType", newTypes);
                          }}
                        />
                        <label
                          htmlFor={`service-${service.id}`}
                          className="text-14 text-textMain font-[600]"
                        >
                          {service.label}
                        </label>
                      </div>
                    ))}
                  </div>
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
                    setSearchQuery("");
                    saveScrollPosition();
                    setIsLoading(true);

                    startTransition(() => {
                      router.push(pathname); // Clear all filters
                    });
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

export default TripsFilter;
