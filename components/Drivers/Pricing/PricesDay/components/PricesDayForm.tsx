"use client";
import { Form, Formik } from "formik";
import { ReactNode, useEffect, useState } from "react";
import { validationForPrices } from "@/lib/types/validationTypes";
import ServiceSwitches from "./ServiceSwitches";
import PaymentMethods from "./PaymentMethods";

interface PricesDayFormProps {
  initialValues: any;
  enableReinitialize: boolean;
  onSubmit: (values: any, formikHelpers: any) => void;
  service_settings: any[];
  children: (props: any) => ReactNode;
}

const PricesDayForm = ({
  initialValues,
  enableReinitialize,
  onSubmit,
  service_settings,
  children,
}: PricesDayFormProps) => {
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  useEffect(() => {
    const filteredMethods = service_settings.filter(
      (item: any) => item.key === "payment_method"
    );
    setPaymentMethods(filteredMethods);
  }, [service_settings]);

  return (
    <Formik
      initialValues={{
        ...initialValues,
        ...paymentMethods.reduce((acc, method) => {
          return { ...acc, [method.title_key]: method.value };
        }, {}),
      }}
      enableReinitialize={enableReinitialize}
      validationSchema={validationForPrices}
      onSubmit={onSubmit}
    >
      {(props) => (
        <Form className="flex flex-col gap-5">
          {/* Service Switches */}
          <ServiceSwitches
            is_coming_soon={props.values.is_coming_soon == "1"}
            is_hidden={props.values.is_hidden == "1"}
            onIsComingSoonChange={(value) => {
              props.setFieldValue("is_coming_soon", value ? 1 : 0);
            }}
            onIsHiddenChange={(value) => {
              props.setFieldValue("is_hidden", value ? 1 : 0);
            }}
          />

          {/* Payment Methods */}
          <PaymentMethods
            paymentMethods={paymentMethods}
            values={props.values}
            setFieldValue={props.setFieldValue}
          />

          {/* Pricing Section */}
          <div className="p-5 border border-gray200 rounded-6">
            <h3 className="text-20 text-textMain font-[700] mb-5">
              الاسعار على مدار اليوم
            </h3>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-5">
              {children(props)}
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default PricesDayForm;
