"use client";
import CustomFileImage, { EImageType } from "@/components/shared/form/CustomFileImage";
import CustomInput from "@/components/shared/form/CustomInput";
import CustomSelect from "@/components/shared/form/CustomSelect";
import CustomPhoneNumber from "@/components/shared/form/CustomPhoneNumber";
import { FormikProps } from "formik";

const Step1 = ({ formikProps }: { formikProps: FormikProps<any> }) => {
  return (
    <>
      <CustomFileImage
        name="image"
        formikProps={formikProps}
        imageType={EImageType.image}
        value={formikProps.values?.image}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <CustomInput
          type="text"
          name="name"
          label="الاسم بالكامل"
          placeholder="أدخل الاسم الكامل"
        />
        <CustomSelect
          name="gender"
          title="الجنس"
          placeholder="- اختر ـ"
          formikProps={formikProps}
          options={[
            { label: "ذكر", value: "male" },
            { label: "انثى", value: "female" },
          ]}
          label="label"
          value="value"
        />
        <CustomPhoneNumber
          name="mobile"
          title="الجوال"
          formikProps={formikProps}
        />
        <CustomInput
          type="email"
          name="email"
          label="البريد الالكتروني"
          placeholder="4oD2n@example.com"
          optional
        />
      </div>
    </>
  );
};

export default Step1;
