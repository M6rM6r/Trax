/* eslint-disable @typescript-eslint/no-unused-expressions */
"use client";
import { Button } from "@/components/ui/button";
import { Form, Formik } from "formik";
import CustomFileImage, { EImageType } from "../form/CustomFileImage";
import CustomInput from "../form/CustomInput";
import CustomSelect from "../form/CustomSelect";
import CustomPhoneNumber from "../form/CustomPhoneNumber";
import { fetcherClient } from "@/lib/fetcherClient";
import { useResponseToast } from "@/lib/toastUtils";
import { EVehicleType } from "@/lib/types/enums";
import { useRouter } from "next/navigation";
import React from "react";
import { Driver } from "@/lib/types/responseTypes";
import { BasicFormValues } from "@/lib/types/formTypes";
import { validationSchemaBasic } from "@/lib/types/validationTypes";
import { revalidateDrivers } from "@/app/actions/revalidate";

const Index = ({
  vehicleType,
  setShowBasicData,
  setProfileData,
}: {
  vehicleType: EVehicleType;
  setShowBasicData: React.Dispatch<React.SetStateAction<boolean>>;
  setProfileData: React.Dispatch<React.SetStateAction<Driver>>;
}) => {
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
        action: 1,
      }}
      validationSchema={validationSchemaBasic}
      onSubmit={async (values, { setSubmitting }) => {
        const formdata: any = new FormData();
        formdata.append("profile_image", values.image);
        formdata.append("name", values.name);
        formdata.append("email", values.email);
        formdata.append("gender", values.gender);
        formdata.append("mobile", values.phone);
        formdata.append("country_code", values.country_code);
        formdata.append("step", "1");
        switch (vehicleType) {
          case EVehicleType.taxi:
            formdata.append("vehicle_type", EVehicleType.taxi);
            formdata.append("available_for_important_dates", 0);
            formdata.append("driver_without_car", 0);
            break;
          case EVehicleType.fontas:
            formdata.append("vehicle_type", EVehicleType.fontas);
            formdata.append("fontas_unit_id", 4);
            formdata.append("driver_without_car", 0);
            break;
          case EVehicleType.wensh:
            formdata.append("vehicle_type", EVehicleType.wensh);
            formdata.append("wensh_type", "basic");
            formdata.append("driver_without_car", 0);

            break;
          case EVehicleType.light_transportation:
            formdata.append("vehicle_type", EVehicleType.light_transportation);
            formdata.append("light_transportation_type", "single_cabin");
            formdata.append("driver_without_car", 0);
            break;
          case EVehicleType.driver_without_car:
            formdata.append("driver_without_car", 1);
            break;
          case EVehicleType.fast_support:
            formdata.append("vehicle_type", EVehicleType.fast_support);
            formdata.append("driver_without_car", 0);
            break;
          case EVehicleType.fuel:
            formdata.append("vehicle_type", EVehicleType.fuel);
            formdata.append("driver_without_car", 0);
            break;
          case EVehicleType.towing:
            formdata.append("vehicle_type", EVehicleType.towing);
            formdata.append("driver_without_car", 0);
            break;
        }
        try {
          const response: any = await fetcherClient("/drivers", {
            method: "POST",
            body: formdata,
          });

          showResponseToast(response);
          setProfileData(response.data.driver);
          values.action === 2 && setShowBasicData(false);

          // Revalidate driver pages and refresh
          await revalidateDrivers();
          router.refresh();
        } catch (error: any) {
          showResponseToast(error.info);
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
            value={props.values?.image}
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
              placeholder="4oD2n@example.com"
              optional
            />
          </div>
          <div className=" flex justify-between gap-5">
            <Button
              type="submit"
              variant={"primary"}
              className="me-auto"
              disabled={props.isSubmitting}
              onClick={() => props.setFieldValue("action", 1)}
            >
              حفظ
            </Button>
            <Button
              type="submit"
              variant={"primary"}
              disabled={props.isSubmitting}
              onClick={() => props.setFieldValue("action", 2)}
            >
              حفظ واستكمال الييانات
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default Index;
