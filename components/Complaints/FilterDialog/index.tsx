"use client";

import { ArrowLeftFilter, Filter } from "@/public/SVG";
import CustomDialog, { Colors } from "@/components/shared/CustomDialog";
import { Button } from "@/components/ui/button";
import { Formik, Form } from "formik";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import DateInput from "@/components/shared/form/DateInput";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, usePathname } from "next/navigation";
import { DialogClose } from "@radix-ui/react-dialog";
import { useScrollPreservation } from "@/hooks/useScrollPreservation";
import { useState } from "react";
import { isTruthy } from "@/lib/utils";

const complaintTypes = {
  driver: "ضد السائق",
  client: "ضد العميل",
  system: "نظام / فني",
  other: "أخرى",
};

const complaintStatuses = {
  open: "مفتوحة",
  in_progress: "قيد المعالجة",
  resolved: "تم الحل",
  closed: "مغلقة",
};

const complainantRoles = {
  driver: "سائق",
  client: "عميل",
  admin: "إدارة النظام",
};

const FilterDialog = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { saveScrollPosition } = useScrollPreservation();

  const initialValues = {
    complaintType: "",
    status: "",
    complainant: "",
    dateFrom: "",
    dateTo: "",
  };

  return (
    <CustomDialog
      title="فلترة الشكاوى"
      color={Colors.primary}
      className="max-w-[630px]"
      trigger={
        <Button variant="primaryLight" className="text-textMain me-auto">
          <Filter />
          فلتر
        </Button>
      }
      content={
        <Formik
          initialValues={initialValues}
          onSubmit={(values) => {
            const params = new URLSearchParams();
            saveScrollPosition();
            params.append("page", "1");

            if (isTruthy(values.complaintType))
              params.append("filters[type]", values.complaintType);

            if (isTruthy(values.status))
              params.append("filters[status]", values.status);

            if (isTruthy(values.complainant))
              params.append("filters[complainant]", values.complainant);

            if (isTruthy(values.dateFrom))
              params.append("filters[created_at][from]", values.dateFrom);

            if (isTruthy(values.dateTo))
              params.append("filters[created_at][to]", values.dateTo);

            router.push(`${pathname}?${params.toString()}`);
          }}
        >
          {(props) => (
            <Form>
              <Accordion type="multiple" className="grid grid-cols-1 gap-4">
                {/* نوع الشكوى */}
                <AccordionItem
                  value="type"
                  className="border border-gray-200 rounded-xl bg-white shadow-sm"
                >
                  <AccordionTrigger className="flex items-center gap-2 px-2">
                    <ArrowLeftFilter className="text-gray-500" />
                    <span className="text-[15px] text-gray-700 font-medium">
                      نوع الشكوى
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 bg-gray-50 border-t rounded-b-xl">
                    <Select
                      dir="rtl"
                      defaultValue={props.values.complaintType}
                      onValueChange={(val) =>
                        props.setFieldValue("complaintType", val)
                      }
                    >
                      <SelectTrigger className="w-full text-right">
                        <SelectValue placeholder="اختر نوع الشكوى" />
                      </SelectTrigger>
                      <SelectContent dir="rtl" align="end">
                        {Object.entries(complaintTypes).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </AccordionContent>
                </AccordionItem>

                {/* الحالة */}
                <AccordionItem
                  value="status"
                  className="border border-gray-200 rounded-xl bg-white shadow-sm"
                >
                  <AccordionTrigger className="flex items-center gap-2 px-2">
                    <ArrowLeftFilter className="text-gray-500" />
                    <span className="text-[15px] text-gray-700 font-medium">
                      الحالة
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 bg-gray-50 border-t rounded-b-xl">
                    <Select
                      dir="rtl"
                      defaultValue={props.values.status}
                      onValueChange={(val) =>
                        props.setFieldValue("status", val)
                      }
                    >
                      <SelectTrigger className="w-full text-right">
                        <SelectValue placeholder="اختر الحالة" />
                      </SelectTrigger>
                      <SelectContent dir="rtl" align="end">
                        {Object.entries(complaintStatuses).map(
                          ([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </AccordionContent>
                </AccordionItem>

                {/* مقدم الشكوى */}
                <AccordionItem
                  value="complainant"
                  className="border border-gray-200 rounded-xl bg-white shadow-sm"
                >
                  <AccordionTrigger className="flex items-center gap-2 px-2">
                    <ArrowLeftFilter className="text-gray-500" />
                    <span className="text-[15px] text-gray-700 font-medium">
                      مقدم الشكوى
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 bg-gray-50 border-t rounded-b-xl">
                    {Object.entries(complainantRoles).map(([key, label]) => {
                      const isChecked = props.values.complainant === key;
                      return (
                        <div
                          key={key}
                          className="flex items-center gap-3 p-2 rounded-lg bg-white border border-gray-200 hover:border-primaryColor transition-all"
                        >
                          <Checkbox
                            id={key}
                            checked={isChecked}
                            onCheckedChange={() =>
                              props.setFieldValue(
                                "complainant",
                                isChecked ? "" : key
                              )
                            }
                          />
                          <label
                            htmlFor={key}
                            className="text-[14px] text-gray-700 cursor-pointer select-none"
                          >
                            {label}
                          </label>
                        </div>
                      );
                    })}
                  </AccordionContent>
                </AccordionItem>

                {/* تاريخ الإنشاء */}
                <AccordionItem
                  value="date"
                  className="border border-gray-200 rounded-xl bg-white shadow-sm"
                >
                  <AccordionTrigger className="flex items-center gap-2 px-2">
                    <ArrowLeftFilter className="text-gray-500" />
                    <span className="text-[15px] text-gray-700 font-medium">
                      تاريخ الشكوى
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 bg-gray-50 border-t rounded-b-xl grid grid-cols-2 gap-4">
                    <DateInput
                      name="dateFrom"
                      label="من"
                      formikProps={props}
                      restrictDatesAfterDay={new Date().toDateString()}
                    />
                    <DateInput
                      name="dateTo"
                      label="إلى"
                      formikProps={props}
                      restrictDatesBeforeDay={
                        props.values.dateFrom
                          ? new Date(
                              new Date(props.values.dateFrom).getTime() +
                                24 * 60 * 60 * 1000
                            ).toDateString()
                          : undefined
                      }
                      restrictDatesAfterDay={new Date().toDateString()}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="flex items-center justify-between gap-3 mt-6">
                <DialogClose>
                  <Button type="submit" variant="primary" className="px-10">
                    تطبيق
                  </Button>
                </DialogClose>
                <DialogClose>
                  <Button
                    type="button"
                    variant="primaryLight"
                    className="px-10"
                    onClick={() => {
                      props.resetForm();
                      router.push(`${pathname}`);
                    }}
                  >
                    إلغاء
                  </Button>
                </DialogClose>
              </div>
            </Form>
          )}
        </Formik>
      }
    />
  );
};

export default FilterDialog;
