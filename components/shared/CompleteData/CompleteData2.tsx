/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { FormikProps } from "formik";
import dynamic from "next/dynamic";
import CustomInput from "../form/CustomInput";
import DateInput from "../form/DateInput";
import CustomPhoneNumber from "../form/CustomPhoneNumber";
import { Driver } from "@/lib/types/responseTypes";
import { EVehicleType } from "@/lib/types/enums";
const CustomSelect = dynamic(
  () => import("@/components/shared/form/CustomSelect")
);

const Index = ({
  formikProps,
  profileData,
  vehicleType,
}: {
  formikProps: FormikProps<any>;
  profileData: Driver;
  vehicleType: EVehicleType;
}) => {
  return (
    <>
      <div className=" grid grid-cols-1 md:grid-cols-2 gap-5">
        <CustomInput
          type="number"
          name="id"
          placeholder="43356778"
          label="رقم الهوية الرقمية"
          className="prevent-arrows"
        />
        <DateInput
          name="dop"
          label="تاريخ الميلاد الميلادي"
          formikProps={formikProps}
          initialValue={formikProps.values.dop}
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
        />
        {vehicleType != EVehicleType.driver_without_car && (
          <>
            <CustomSelect
              name="boardType"
              title="نوع اللوحة"
              placeholder="- اختر ـ"
              formikProps={formikProps}
              options={[
                { label: "نقل عام", value: 2 },
                { label: "خاص", value: 1 },
                { label: "اجره", value: 6 },
              ]}
              label="label"
              value="value"
              initialValue={formikProps.values.boardType}
            />
            <CustomInput
              type="number"
              name="serialNumber"
              placeholder="43356778"
              label="رقم التسلسل"
              className="prevent-arrows"
            />
          </>
        )}
      </div>
      {vehicleType != EVehicleType.driver_without_car && (
        <div className=" grid grid-cols-2 lg:grid-cols-4 gap-5">
          <CustomInput
            type="number"
            name="carBoardType"
            placeholder="- - -"
            label="رقم لوحة السيارة"
            maxLength={4}
            className="prevent-arrows"
          />
          <CustomInput
            type="text"
            name="rightCharacter"
            placeholder="ر"
            label="حرف اللوحة الأيمن"
            maxLength={1}
          />
          <CustomInput
            type="text"
            name="middleCaracter"
            placeholder="ض"
            label="حرف اللوحة الأوسط"
            maxLength={1}
          />
          <CustomInput
            type="text"
            name="leftCharacter"
            placeholder="خ"
            label="حرف اللوحة الأيسر"
            maxLength={1}
          />
        </div>
      )}
    </>
  );
};

export default Index;
