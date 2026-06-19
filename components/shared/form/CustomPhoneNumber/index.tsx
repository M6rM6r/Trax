/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import "react-phone-number-input/style.css";
import PhoneInput, {
  isValidPhoneNumber,
  parsePhoneNumber,
} from "react-phone-number-input";
import { useState } from "react";
import { ErrorMessage, FormikProps } from "formik";
import ar from "react-phone-number-input/locale/ar";
const Index = ({
  name,
  formikProps,
  title,
}: {
  name: string;
  formikProps: FormikProps<any>;
  title: string;
}) => {
  const [value, setValue] = useState<string>(formikProps.values[name]);

  const handleChange = (value: any) => {
    setValue(value);
    if (value) {
      const phoneNumber = parsePhoneNumber(value);
      if (phoneNumber) {
        const countryCode = phoneNumber.countryCallingCode; // e.g., "20" for Egypt
        const nationalNumber = phoneNumber.nationalNumber; // e.g., "1234567890"
        formikProps.setFieldValue("country_code", countryCode);
        formikProps.setFieldValue("phone", nationalNumber);
        formikProps.setFieldValue(name, value);
      }
    }
  };

  return (
    <div className=" flex flex-col gap-2">
      {title && (
        <p className="text-16 text-primarySlate700 font-[600]">{title}</p>
      )}
      <div
        className={`border border-textBorder h-[48px] w-full  rounded-6 flex items-center px-3 relative`}
      >
        <span className=" absolute  top-[11px] z-20 opacity-0 start-[16px] w-[1.7rem] h-[1.7rem]"></span>
        <PhoneInput
          placeholder="1-000-000-000"
          value={value}
          onChange={handleChange}
          defaultCountry="SA"
          className="w-full"
          error={
            value
              ? isValidPhoneNumber(value)
                ? undefined
                : "Invalid phone number"
              : "Phone number required"
          }
          labels={ar}
          focusInputOnCountrySelection
        />
      </div>
      {formikProps.errors[name] && (
        <ErrorMessage
          component={"div"}
          name={name}
          className="text-14 text-red-500"
        />
      )}
      <p className="text-14 text-red-500  font-[600]">
        {value &&
          value.length > 0 &&
          !isValidPhoneNumber(value) &&
          "الجوال غير صحيح"}
      </p>
    </div>
  );
};

export default Index;
