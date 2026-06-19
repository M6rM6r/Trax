"use client";
import { FormikProps } from "formik";
import dynamic from "next/dynamic";
const CustomSelect = dynamic(
  () => import("@/components/shared/form/CustomSelect")
);

const Index = ({ formikProps }: { formikProps: FormikProps<any> }) => {
  return (
    <CustomSelect
      name="type"
      title="نوع السطحة"
      placeholder="- اختر ـ"
      formikProps={formikProps}
      options={[
        {
          label: "هيدروليكي",
          value: "hydraulic",
        },
        {
          label: "أساسي",
          value: "basic",
        },
        {
          label: "رافعه",
          value: "fork",
        },
      ]}
      label="label"
      value="value"
      initialValue={formikProps.values.type}
    />
  );
};

export default Index;
