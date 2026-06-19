"use client";

import { Filter, ArrowLeftFilter } from "@/public/SVG";
import CustomDialog, { Colors } from "@/components/shared/CustomDialog";
import { Button } from "@/components/ui/button";
import { Formik, Form } from "formik";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useScrollPreservation } from "@/hooks/useScrollPreservation";
import {
  NotificationTemplatesChannels,
  NotificationTemplatesTypes,
} from "@/lib/types/enums";
import { DialogClose } from "@/components/ui/dialog";

const emptyFilterValues = {
  type: "",
  channel: "",
  status: "",
};

const NotificationFilterDialog = () => {
  const [appliedFilters, setAppliedFilters] = useState(emptyFilterValues);
  const [activeFilters, setActiveFilters] = useState<
    { key: string; label: string; value: any }[]
  >([]);
  const [isFiltered, setIsFiltered] = useState(false);

  const { saveScrollPosition } = useScrollPreservation();
  const pathname = usePathname();
  const router = useRouter();

  const updateActiveFilters = (values: typeof emptyFilterValues) => {
    const filters: { key: string; label: string; value: any }[] = [];
    if (values.type)
      filters.push({ key: "type", label: "النوع", value: values.type });
    if (values.channel)
      filters.push({ key: "channel", label: "القناة", value: values.channel });
    if (values.status)
      filters.push({ key: "status", label: "الحالة", value: values.status });

    setActiveFilters(filters);
    setIsFiltered(filters.length > 0);
  };

  return (
    <CustomDialog
      title="فلتر حسب"
      color={Colors.primary}
      className="max-w-[630px]"
      trigger={
        <Button variant={"primaryLight"} className="text-textMain me-auto">
          <Filter /> فلتر
        </Button>
      }
      content={
        <Formik
          enableReinitialize
          initialValues={appliedFilters}
          onSubmit={(values) => {
            saveScrollPosition();

            setAppliedFilters(values);

            const params = new URLSearchParams();
            params.append("page", "1");
            if (values.type) params.set("filters[type]", values.type);
            if (values.channel) params.set("filters[channel]", values.channel);
            if (values.status) params.set("filters[is_active]", values.status);

            updateActiveFilters(values);
            setIsFiltered(true);

            router.push(`${pathname}?${params.toString()}`);
          }}
        >
          {(props) => (
            <Form>
              <Accordion type="multiple" className="grid grid-cols-1 gap-4">
                {" "}
                {/* Notification Type */} {/* Notification Type */}
                <AccordionItem
                  value="type"
                  className="border border-textBorder rounded-6 px-2 w-full"
                >
                  <AccordionTrigger className="flex items-center gap-2 w-full border-none">
                    <ArrowLeftFilter />
                    <span className="text-14 text-textSubText font-[600]">
                      نوع الإشعار
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                    <div className="w-full">
                      <Select
                        dir="rtl"
                        value={props.values.type}
                        onValueChange={(val) =>
                          props.setFieldValue("type", val)
                        }
                      >
                        <SelectTrigger className="w-full border border-gray-300 rounded-lg shadow-sm bg-white focus:ring-2 focus:ring-primaryColor focus:border-primaryColor transition-all text-right">
                          <SelectValue placeholder="اختر نوع الإشعار" />
                        </SelectTrigger>

                        <SelectContent
                          dir="rtl"
                          align="end"
                          className="bg-white rounded-lg shadow-lg border border-gray-200 w-full"
                        >
                          {Object.entries(NotificationTemplatesTypes.ar).map(
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
                {/* Notification Channel */}
                <AccordionItem
                  value="channel"
                  className="border border-textBorder rounded-6 px-2 w-full"
                >
                  <AccordionTrigger className="flex items-center gap-2 w-full border-none">
                    <ArrowLeftFilter />
                    <span className="text-14 text-textSubText font-[600]">
                      قناة الإشعار
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                    <div className="w-full">
                      <Select
                        dir="rtl"
                        value={props.values.channel}
                        onValueChange={(val) =>
                          props.setFieldValue("channel", val)
                        }
                      >
                        <SelectTrigger className="w-full border border-gray-300 rounded-lg shadow-sm bg-white focus:ring-2 focus:ring-primaryColor focus:border-primaryColor transition-all text-right">
                          <SelectValue placeholder="اختر قناة الإشعار" />
                        </SelectTrigger>

                        <SelectContent
                          dir="rtl"
                          align="end"
                          className="bg-white rounded-lg shadow-lg border border-gray-200 w-full"
                        >
                          {Object.entries(NotificationTemplatesChannels.ar).map(
                            ([key, label]) => (
                              <SelectItem
                                key={key}
                                value={key}
                                className="cursor-pointer text-right hover:bg-gray-100"
                              >
                                {label as string}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                {/* Status */}{" "}
                <AccordionItem
                  value="status"
                  className="border border-textBorder rounded-6 px-2 w-full"
                >
                  {" "}
                  <AccordionTrigger className="flex items-center gap-2 w-full border-none">
                    {" "}
                    <ArrowLeftFilter />{" "}
                    <span className="text-14 text-textSubText font-[600]">
                      {" "}
                      الحالة{" "}
                    </span>{" "}
                  </AccordionTrigger>{" "}
                  <AccordionContent className="my-5 flex gap-3">
                    {" "}
                    <Checkbox
                      id="active"
                      checked={props.values.status === "1"}
                      onCheckedChange={() =>
                        props.setFieldValue(
                          "status",
                          props.values.status === "1" ? "" : "1"
                        )
                      }
                    />{" "}
                    <label htmlFor="active">مفعل</label>{" "}
                    <Checkbox
                      id="inactive"
                      checked={props.values.status === "0"}
                      onCheckedChange={() =>
                        props.setFieldValue(
                          "status",
                          props.values.status === "0" ? "" : "0"
                        )
                      }
                    />{" "}
                    <label htmlFor="inactive">غير مفعل</label>{" "}
                  </AccordionContent>{" "}
                </AccordionItem>{" "}
              </Accordion>
              <div className="flex items-center justify-between gap-3 mt-5">
                <DialogClose>
                  <Button type="submit" variant="primary" className=" px-10">
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
                      setAppliedFilters(emptyFilterValues);
                      setActiveFilters([]);
                      setIsFiltered(false);
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

export default NotificationFilterDialog;
