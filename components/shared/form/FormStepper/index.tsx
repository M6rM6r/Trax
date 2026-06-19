/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from "react";
import { Formik, Form, FormikHelpers, FormikProps } from "formik";
import { Button } from "@/components/ui/button";
import * as Yup from "yup";
import { cn } from "@/lib/utils";

type MultiStepFormProps<T extends Record<string, unknown>> = {
  initialValues: T;
  validationSchemas: Yup.AnyObjectSchema[] | any;
  onSubmit: (values: T, helpers: FormikHelpers<T>) => void;
  onStepSubmit?: (step: number, values: T, helpers: FormikHelpers<T>) => Promise<void>;
  labels: string[];
  steps: ((formikProps: FormikProps<T>) => React.ReactNode)[];
  initialStep?: number;
};

const FormStepper = <T extends Record<string, unknown>>({
  initialValues,
  validationSchemas,
  onSubmit,
  onStepSubmit,
  labels,
  steps,
  initialStep = 1,
}: MultiStepFormProps<T>) => {
  const [step, setStep] = useState(initialStep);
  const totalSteps = steps.length;
  const isLastStep = step === totalSteps;
  const prevStep = () => step > 1 && setStep(step - 1);

  const handleSubmit = async (values: T, { setSubmitting }: FormikHelpers<T>) => {
    if (isLastStep) {
      onSubmit(values, { setSubmitting } as FormikHelpers<T>);
    } else {
      // Call onStepSubmit if provided
      if (onStepSubmit) {
        try {
          await onStepSubmit(step, values, { setSubmitting } as FormikHelpers<T>);
          setStep(step + 1);
        } catch (error) {
          console.error(`Error in step ${step}:`, error);
        } finally {
          setSubmitting(false);
        }
      } else {
        setStep(step + 1);
        setSubmitting(false);
      }
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchemas[step - 1]}
      onSubmit={handleSubmit}
    >
      {(props) => (
        <Form className="flex flex-col gap-5">
          <div className="flex mb-5">
            {labels.map((label, index) => (
              <button
                key={index}
                type="button"
                className={cn(
                  "text-18 border-b-[2px] pb-2 grow",
                  step === index + 1
                    ? "text-primaryColor border-b-primaryColor"
                    : "text-iconColor border-b-iconColor"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {steps[step - 1](props)}
          <div className="flex items-center justify-between flex-wrap gap-5 mt-5">
            {step > 1 && (
              <Button
                variant={"primaryLight"}
                className="px-5 md:px-8"
                type="button"
                onClick={prevStep}
              >
                السابق
              </Button>
            )}
            <Button
              variant={"primary"}
              className="ms-auto px-5 md:px-8"
              type="submit"
              disabled={props.isSubmitting}
            >
              {isLastStep ? "إضافة واستكمال البيانات" : "التالي"}
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default FormStepper;
