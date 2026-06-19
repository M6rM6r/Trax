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

const DriverSortingComponent = () => {
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
          disabled={true}
        >
          <Sort />
        </Button>
      }
      content={
        <Formik
          initialValues={{
            sorts: {
              rating: "",
              trips: "",
              city: "",
            },
          }}
          onSubmit={(values) => {
            // Build sort string: rating=desc,trips=asc
            const sortEntries = Object.entries(values.sorts)
              .filter(([_, dir]) => dir) // remove empty
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
                {/* Sort by Rating */}
                <AccordionItem
                  value="rating"
                  className="border border-gray200 rounded-6 px-2"
                >
                  <AccordionTrigger className="flex items-center gap-2 w-full border-none">
                    <ArrowLeftFilter />
                    <span className="text-14 text-textSubText font-[600]">
                      التقييم
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="grid grid-cols-1 gap-3 mt-5">
                    <RadioGroup
                      onValueChange={(val) =>
                        setFieldValue("sorts.rating", val)
                      }
                      value={values.sorts.rating}
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="desc" id="rating-desc" />
                        <Label htmlFor="rating-desc">
                          من الأعلى إلى الأدنى
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="asc" id="rating-asc" />
                        <Label htmlFor="rating-asc">من الأدنى إلى الأعلى</Label>
                      </div>
                    </RadioGroup>
                  </AccordionContent>
                </AccordionItem>

                {/* Sort by Trips */}
                <AccordionItem
                  value="trips"
                  className="border border-gray200 rounded-6 px-2"
                >
                  <AccordionTrigger className="flex items-center gap-2 w-full border-none">
                    <ArrowLeftFilter />
                    <span className="text-14 text-textSubText font-[600]">
                      عدد الرحلات
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="grid grid-cols-1 gap-3 mt-5">
                    <RadioGroup
                      onValueChange={(val) => setFieldValue("sorts.trips", val)}
                      value={values.sorts.trips}
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="desc" id="trips-desc" />
                        <Label htmlFor="trips-desc">من الأعلى إلى الأدنى</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="asc" id="trips-asc" />
                        <Label htmlFor="trips-asc">من الأدنى إلى الأعلى</Label>
                      </div>
                    </RadioGroup>
                  </AccordionContent>
                </AccordionItem>

                {/* Sort by City */}
                <AccordionItem
                  value="city"
                  className="border border-gray200 rounded-6 px-2"
                >
                  <AccordionTrigger className="flex items-center gap-2 w-full border-none">
                    <ArrowLeftFilter />
                    <span className="text-14 text-textSubText font-[600]">
                      المدينة
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="grid grid-cols-1 gap-3 mt-5">
                    <RadioGroup
                      onValueChange={(val) => setFieldValue("sorts.city", val)}
                      value={values.sorts.city}
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="desc" id="city-desc" />
                        <Label htmlFor="city-desc">من الأعلى إلى الأدنى</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="asc" id="city-asc" />
                        <Label htmlFor="city-asc">من الأدنى إلى الأعلى</Label>
                      </div>
                    </RadioGroup>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

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

export default DriverSortingComponent;
