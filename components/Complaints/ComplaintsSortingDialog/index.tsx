"use client";

import CustomDialog, { Colors } from "@/components/shared/CustomDialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ArrowLeftFilter, Sort } from "@/public/SVG";
import { Formik, Form } from "formik";
import { useRouter, useSearchParams } from "next/navigation";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { DialogClose } from "@radix-ui/react-dialog";

/**
 * ComplaintsSortingComponent:
 * Allows sorting by date, status, and type.
 */
const ComplaintsSortingComponent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <CustomDialog
      title="ترتيب حسب"
      color={Colors.primary}
      className="max-w-[628px]"
      trigger={
        <Button
          variant="ghost"
          className="flex h-[40px] w-[44px] p-0 data-[state=open]:bg-muted border border-[#D0D5DD]"
        >
          <Sort />
        </Button>
      }
      content={
        <Formik
          initialValues={{
            sorts: {
              date: "",
              status: "",
              type: "",
            },
          }}
          onSubmit={(values) => {
            // Build sort string e.g. date=desc,status=asc
            const sortEntries = Object.entries(values.sorts)
              .filter(([_, dir]) => dir)
              .map(([key, dir]) => `${key}=${dir}`);

            const sortString = sortEntries.join(",");
            const params = new URLSearchParams(searchParams);

            if (sortString) {
              params.set("sortBy", sortString);
            } else {
              params.delete("sortBy");
            }

            router.push(`?${params.toString()}`);
          }}
        >
          {({ values, setFieldValue }) => (
            <Form>
              <Accordion type="multiple" className="grid grid-cols-1 gap-5">
                {/* Sort by Date */}
                <AccordionItem
                  value="date"
                  className="border border-gray200 rounded-6 px-2"
                >
                  <AccordionTrigger className="flex items-center gap-2 w-full border-none">
                    <ArrowLeftFilter />
                    <span className="text-14 text-textSubText font-[600]">
                      تاريخ الشكوى
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="grid grid-cols-1 gap-3 mt-5">
                    <RadioGroup
                      onValueChange={(val) => setFieldValue("sorts.date", val)}
                      value={values.sorts.date}
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="desc" id="date-desc" />
                        <Label htmlFor="date-desc">من الأحدث إلى الأقدم</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="asc" id="date-asc" />
                        <Label htmlFor="date-asc">من الأقدم إلى الأحدث</Label>
                      </div>
                    </RadioGroup>
                  </AccordionContent>
                </AccordionItem>

                {/* Sort by Status */}
                <AccordionItem
                  value="status"
                  className="border border-gray200 rounded-6 px-2"
                >
                  <AccordionTrigger className="flex items-center gap-2 w-full border-none">
                    <ArrowLeftFilter />
                    <span className="text-14 text-textSubText font-[600]">
                      الحالة
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="grid grid-cols-1 gap-3 mt-5">
                    <RadioGroup
                      onValueChange={(val) =>
                        setFieldValue("sorts.status", val)
                      }
                      value={values.sorts.status}
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="asc" id="status-asc" />
                        <Label htmlFor="status-asc">
                          من المفتوحة إلى المغلقة
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="desc" id="status-desc" />
                        <Label htmlFor="status-desc">
                          من المغلقة إلى المفتوحة
                        </Label>
                      </div>
                    </RadioGroup>
                  </AccordionContent>
                </AccordionItem>

                {/* Sort by Type */}
                <AccordionItem
                  value="type"
                  className="border border-gray200 rounded-6 px-2"
                >
                  <AccordionTrigger className="flex items-center gap-2 w-full border-none">
                    <ArrowLeftFilter />
                    <span className="text-14 text-textSubText font-[600]">
                      نوع الشكوى
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="grid grid-cols-1 gap-3 mt-5">
                    <RadioGroup
                      onValueChange={(val) => setFieldValue("sorts.type", val)}
                      value={values.sorts.type}
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="asc" id="type-asc" />
                        <Label htmlFor="type-asc">تصاعدي (أ-ي)</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="desc" id="type-desc" />
                        <Label htmlFor="type-desc">تنازلي (ي-أ)</Label>
                      </div>
                    </RadioGroup>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Actions */}
              <div className="flex items-center justify-between gap-3 mt-5">
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
                    onClick={() => router.push("?")}
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

export default ComplaintsSortingComponent;
