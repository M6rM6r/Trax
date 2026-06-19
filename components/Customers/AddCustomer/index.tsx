/* eslint-disable @typescript-eslint/no-unused-expressions */
"use client";
import { Button } from "@/components/ui/button";
import { Form, Formik } from "formik";
import { fetcherClient } from "@/lib/fetcherClient";
import { useResponseToast } from "@/lib/toastUtils";
import { useRouter } from "next/navigation";
import React from "react";
import CustomFileImage, {
  EImageType,
} from "@/components/shared/form/CustomFileImage";
import CustomInput from "@/components/shared/form/CustomInput";
import CustomPhoneNumber from "@/components/shared/form/CustomPhoneNumber";
import dynamic from "next/dynamic";
import { BasicFormValues } from "@/lib/types/formTypes";
import { validationSchemaBasic } from "@/lib/types/validationTypes";
const CustomSelect = dynamic(
  () => import("@/components/shared/form/CustomSelect")
);

const Index = ({ onSuccess }: { onSuccess?: () => void }) => {
  const router = useRouter();
  const { showResponseToast } = useResponseToast();
  return (
    <Formik<BasicFormValues>
      initialValues={{
        image: null,
        name: "",
        gender: "",
        mobile: "",
        email: "",
        country_code: "",
        phone: "",
      }}
      validationSchema={validationSchemaBasic}
      onSubmit={async (values, { setSubmitting, resetForm }) => {
        try {
          const formdata: any = new FormData();

          // If no image is selected, use placeholder image
          if (values.image) {
            formdata.append("profile_image", values.image);
          } else {
            // Fetch placeholder image and convert to File
            try {
              const response = await fetch("/images/placeholder.png");
              if (!response.ok) {
                throw new Error("Failed to fetch placeholder image");
              }
              const blob = await response.blob();
              const placeholderFile = new File([blob], "placeholder.png", {
                type: "image/png",
              });
              formdata.append("profile_image", placeholderFile);
            } catch (fetchError) {
              console.error("Error fetching placeholder:", fetchError);
              throw new Error("فشل في تحميل الصورة الافتراضية");
            }
          }

          formdata.append("name", values.name);
          formdata.append("email", values.email);
          formdata.append("gender", values.gender);
          formdata.append("mobile", values.phone);
          formdata.append("country_code", values.country_code);

          const response: any = await fetcherClient("/customers", {
            method: "POST",
            body: formdata,
            cache: "no-store",
          });

          showResponseToast(response);

          // Reset form to clear all fields
          resetForm();

          // Force router refresh to update the customer list
          router.refresh();

          // Close the dialog if onSuccess callback is provided
          onSuccess?.();
        } catch (error: any) {
          console.error("Submit error:", error);
          showResponseToast(error.info || { message: error.message });
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {(props) => (
        <Form className=" flex flex-col gap-5">
          <CustomFileImage
            name="image"
            formikProps={props}
            imageType={EImageType.image}
          />
          <div className=" grid grid-cols-1 md:grid-cols-2 gap-5">
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
              formikProps={props}
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
              formikProps={props}
            />
            <CustomInput
              type="email"
              name="email"
              label="البريد الالكتروني"
              placeholder="أدخل البريد الإلكتروني"
              optional
            />
          </div>
          <Button
            type="submit"
            variant={"primary"}
            className="ms-auto"
            disabled={props.isSubmitting}
          >
            اضافة
          </Button>
        </Form>
      )}
    </Formik>
  );
};

export default Index;
