"use client";
import { ArrowLeftFilter, Filter } from "@/public/SVG";
import CustomDialog, { Colors } from "../CustomDialog";
import { Button } from "@/components/ui/button";
import { Form, Formik } from "formik";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Index = () => {
  return (
    <CustomDialog
      title="فلتر حسب"
      color={Colors.primary}
      className="max-w-[628px]"
      trigger={
        <Button variant={"primaryLight"} className=" text-textMain me-auto">
          <Filter />
          فلتر
        </Button>
      }
      content={
        <Formik
          initialValues={{
            dopStart: "",
            dopEnd: "",
            rideFrom: "",
            rideEnd: "",
            paymentFrom: "",
            paymentEnd: "",
            rides: [],
            payments: [],
            status: "1",
            region_id: "",
          }}
          onSubmit={(values) => {
            const params = new URLSearchParams();
            //   if (values.dopStart)
            //     params.append("filters[ride_date][min]", values.dopStart);
            //   if (values.dopEnd)
            //     params.append("filters[ride_date][max]", values.dopEnd);
            params.append("page", "1");
            if (values.rideFrom)
              params.append("filters[ride_date][min]", values.rideFrom);
            if (values.rideEnd)
              params.append("filters[ride_date][max]", values.rideEnd);
            //   if (values.paymentFrom)
            //     params.append("paymentFrom", values.paymentFrom);
            //   if (values.paymentEnd) params.append("paymentEnd", values.paymentEnd);
            if (values.rides.length > 0) {
              params.append("filters[rides_count][min]", values.rides[0]);
              params.append("filters[rides_count][max]", values.rides[1]);
            }
            if (values.payments.length > 0) {
              params.append("filters[rides_amount][min]", values.payments[0]);
              params.append("filters[rides_amount][max]", values.payments[1]);
            }
            if (values.status)
              params.append("filters[is_active]", values.status);
            if (values.region_id)
              params.append("filters[region_id]", values.region_id);
            // setIsFiltered(true);
            // router.push(`${window.location.pathname}?${params.toString()}`);
          }}
        >
          {() => (
            <Form>
              <Accordion
                type="multiple"
                className=" grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <AccordionItem
                  value="item-1"
                  className="border border-textBorder  rounded-6 px-2 w-full  "
                >
                  <AccordionTrigger className="flex items-center gap-2  w-full border-none ">
                    <ArrowLeftFilter />
                    <span className="text-14 text-textSubText font-[600]">
                      التقييم
                    </span>
                    {/* <span className="w-2 h-2 rounded-full bg-primaryColor block"></span> */}
                  </AccordionTrigger>
                  <AccordionContent className=" grid grid-cols-1 md:grid-cols-2 gap-5 mt-5"></AccordionContent>
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
                  <AccordionContent className=" grid grid-cols-1 md:grid-cols-2 gap-5 mt-5"></AccordionContent>
                </AccordionItem>
                <AccordionItem
                  value="item-3"
                  className="border border-textBorder  rounded-6 px-2 w-full md:col-span-2 "
                >
                  <AccordionTrigger className="flex items-center gap-2  w-full border-none ">
                    <ArrowLeftFilter />
                    <span className="text-14 text-textSubText font-[600]">
                      رصيد المحفظة
                    </span>
                    {/* <span className="w-2 h-2 rounded-full bg-primaryColor block"></span> */}
                  </AccordionTrigger>
                  <AccordionContent className=" grid grid-cols-1 md:grid-cols-2 gap-5 mt-5"></AccordionContent>
                </AccordionItem>
                <AccordionItem
                  value="item-4"
                  className="border border-textBorder  rounded-6 px-2 w-full md:col-span-2 "
                >
                  <AccordionTrigger className="flex items-center gap-2  w-full border-none ">
                    <ArrowLeftFilter />
                    <span className="text-14 text-textSubText font-[600]">
                      نوع العميل
                    </span>
                    {/* <span className="w-2 h-2 rounded-full bg-primaryColor block"></span> */}
                  </AccordionTrigger>
                  <AccordionContent className=" grid grid-cols-1 md:grid-cols-2 gap-5 mt-5"></AccordionContent>
                </AccordionItem>
                <AccordionItem
                  value="item-5"
                  className="border border-textBorder  rounded-6 px-2 w-full "
                >
                  <AccordionTrigger className="flex items-center gap-2  w-full border-none ">
                    <ArrowLeftFilter />
                    <span className="text-14 text-textSubText font-[600]">
                      نوع الرخصة
                    </span>
                    {/* <span className="w-2 h-2 rounded-full bg-primaryColor block"></span> */}
                  </AccordionTrigger>
                  <AccordionContent className=" grid grid-cols-1 md:grid-cols-2 gap-5 mt-5"></AccordionContent>
                </AccordionItem>
                <AccordionItem
                  value="item-6"
                  className="border border-textBorder  rounded-6 px-2 w-full  "
                >
                  <AccordionTrigger className="flex items-center gap-2  w-full border-none ">
                    <ArrowLeftFilter />
                    <span className="text-14 text-textSubText font-[600]">
                      المنطقة
                    </span>
                    {/* <span className="w-2 h-2 rounded-full bg-primaryColor block"></span> */}
                  </AccordionTrigger>
                  <AccordionContent className=" grid grid-cols-1 md:grid-cols-2 gap-5 mt-5"></AccordionContent>
                </AccordionItem>
                <AccordionItem
                  value="item-7"
                  className="border border-textBorder  rounded-6 px-2 w-full md:col-span-2 "
                >
                  <AccordionTrigger className="flex items-center gap-2  w-full border-none ">
                    <ArrowLeftFilter />
                    <span className="text-14 text-textSubText font-[600]">
                      التواريخ
                    </span>
                    {/* <span className="w-2 h-2 rounded-full bg-primaryColor block"></span> */}
                  </AccordionTrigger>
                  <AccordionContent className=" grid grid-cols-1 md:grid-cols-2 gap-5 mt-5"></AccordionContent>
                </AccordionItem>
                <AccordionItem
                  value="item-8"
                  className="border border-textBorder  rounded-6 px-2 w-full md:col-span-2 "
                >
                  <AccordionTrigger className="flex items-center gap-2  w-full border-none ">
                    <ArrowLeftFilter />
                    <span className="text-14 text-textSubText font-[600]">
                      تفاصيل المركبة
                    </span>
                    {/* <span className="w-2 h-2 rounded-full bg-primaryColor block"></span> */}
                  </AccordionTrigger>
                  <AccordionContent className=" grid grid-cols-1 md:grid-cols-2 gap-5 mt-5"></AccordionContent>
                </AccordionItem>
              </Accordion>
              <div className="flex items-center justify-between gap-3 mt-5 ">
                <Button type="submit" variant="primary" className=" px-10">
                  تطبيق
                </Button>
                <Button type="button" variant="primaryLight" className=" px-10">
                  إلغاء
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      }
    />
  );
};

export default Index;
