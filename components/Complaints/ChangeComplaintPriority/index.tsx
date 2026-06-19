"use client";

import { validationForChangingComplaintPriority } from "@/lib/types/validationTypes";
import { Form, Formik, FormikProps } from "formik";
import React, { forwardRef, useImperativeHandle, useRef } from "react";
import CustomSelect from "@/components/shared/form/CustomSelect";
import { useFetchEnums } from "@/hooks/useAllEnums";
import { Complaint } from "@/lib/types/responseTypes";

export interface ChangeComplaintPriorityRef {
  submitForm: () => void;
}

interface FormValues {
  priority: string;
}

const ChangeComplaintPriority = forwardRef<
  ChangeComplaintPriorityRef,
  {
    initialPriority: Complaint["priority"]["key"];
    updateComplaint: (priority: string) => Promise<any>;
  }
>(({ initialPriority, updateComplaint }, ref) => {
  const { data: dataEnums } = useFetchEnums();
  const formikRef = useRef<FormikProps<FormValues>>(null);

  useImperativeHandle(ref, () => ({
    submitForm: () => {
      if (formikRef.current) {
        formikRef.current.submitForm();
      }
    },
  }));

  return (
    <Formik<FormValues>
      innerRef={formikRef}
      enableReinitialize
      initialValues={{
        priority: initialPriority || "",
      }}
      validationSchema={validationForChangingComplaintPriority}
      onSubmit={async (values) => {
        if (values.priority) {
          await updateComplaint(values.priority);
        }
      }}
    >
      {(props) => (
        <Form className="flex flex-col gap-5 p-4 border border-gray200 rounded-12 bg-white">
          <CustomSelect
            name="priority"
            title="الأولوية"
            placeholder={initialPriority}
            options={
              dataEnums?.ComplaintPriorites
                ? Object.entries(dataEnums.ComplaintPriorites?.ar).map(
                    ([key, value]) => ({
                      label: value as string,
                      value: key,
                    })
                  )
                : []
            }
            formikProps={props}
            label="label"
            value="value"
            initialValue={props.values.priority}
          />
        </Form>
      )}
    </Formik>
  );
});

ChangeComplaintPriority.displayName = "ChangeComplaintPriority";

export default ChangeComplaintPriority;
