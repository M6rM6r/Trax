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

interface TripsSortingComponentProps {
  onSort?: (sortConfig: { field: string; direction: "asc" | "desc" }[]) => void;
}

const TripsSortingComponent = ({ onSort }: TripsSortingComponentProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // parse existing sortBy param into initial sorts
  const parseInitialSorts = () => {
    const initial = { price: "", ride_distance: "", ride_duration: "" };
    const sortBy = searchParams.get("sortBy") || "";
    if (!sortBy) return initial;
    sortBy?.split(",").forEach((pair) => {
      const [k, v] = pair?.split("=");
      if (k && v && Object.prototype.hasOwnProperty?.call(initial, k)) {
        initial[k as keyof typeof initial] = v as "asc" | "desc";
      }
    });
    return initial;
  };

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
            sorts: parseInitialSorts(),
          }}
          onSubmit={(values) => {
            // Build sort string like: price=desc,ride_distance=asc
            const sortEntries = Object.entries(values.sorts)
              .filter(([_, dir]) => dir)
              .map(([key, dir]) => `${key}=${dir}`);

            const sortString = sortEntries.join(",");

            const params = new URLSearchParams(searchParams.toString());
            if (sortString) {
              params.set("sortBy", sortString);
            } else {
              params.delete("sortBy");
            }

            // Navigate to the same page with updated sortBy param (server will handle sorting)
            router.push(`?${params.toString()}`);
          }}
        >
          {({ values, setFieldValue }) => (
            <Form>
              <Accordion type="multiple" className="grid grid-cols-1 gap-5">
                {/* Sort by Price */}
                <AccordionItem
                  value="price"
                  className="border border-gray200 rounded-6 px-2"
                >
                  <AccordionTrigger className="flex items-center gap-2 w-full border-none">
                    <ArrowLeftFilter />
                    <span className="text-14 text-textSubText font-[600]">
                      السعر
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="grid grid-cols-1 gap-3 mt-5">
                    <RadioGroup
                      onValueChange={(val) => setFieldValue("sorts.price", val)}
                      value={values.sorts.price}
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="desc" id="price-desc" />
                        <Label htmlFor="price-desc">من الأعلى إلى الأدنى</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="asc" id="price-asc" />
                        <Label htmlFor="price-asc">من الأدنى إلى الأعلى</Label>
                      </div>
                    </RadioGroup>
                  </AccordionContent>
                </AccordionItem>

                {/* Sort by Ride Distance */}
                <AccordionItem
                  value="ride_distance"
                  className="border border-gray200 rounded-6 px-2"
                >
                  <AccordionTrigger className="flex items-center gap-2 w-full border-none">
                    <ArrowLeftFilter />
                    <span className="text-14 text-textSubText font-[600]">
                      المسافة المقطوعة
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="grid grid-cols-1 gap-3 mt-5">
                    <RadioGroup
                      onValueChange={(val) =>
                        setFieldValue("sorts.ride_distance", val)
                      }
                      value={values.sorts.ride_distance}
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="desc" id="ride_distance-desc" />
                        <Label htmlFor="ride_distance-desc">
                          من الأعلى إلى الأدنى
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="asc" id="ride_distance-asc" />
                        <Label htmlFor="ride_distance-asc">
                          من الأدنى إلى الأعلى
                        </Label>
                      </div>
                    </RadioGroup>
                  </AccordionContent>
                </AccordionItem>

                {/* Sort by Ride Duration */}
                <AccordionItem
                  value="ride_duration"
                  className="border border-gray200 rounded-6 px-2"
                >
                  <AccordionTrigger className="flex items-center gap-2 w-full border-none">
                    <ArrowLeftFilter />
                    <span className="text-14 text-textSubText font-[600]">
                      مدة الرحلة
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="grid grid-cols-1 gap-3 mt-5">
                    <RadioGroup
                      onValueChange={(val) =>
                        setFieldValue("sorts.ride_duration", val)
                      }
                      value={values.sorts.ride_duration}
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="desc" id="ride_duration-desc" />
                        <Label htmlFor="ride_duration-desc">
                          من الأعلى إلى الأدنى
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="asc" id="ride_duration-asc" />
                        <Label htmlFor="ride_duration-asc">
                          من الأدنى إلى الأعلى
                        </Label>
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
                    onClick={() => {
                      if (onSort) {
                        onSort([]);
                      }
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

export default TripsSortingComponent;
