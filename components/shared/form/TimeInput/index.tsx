/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import {
  EyeInput,
  EyeSlash,
  InfoCircle,
  SelectArrowDown,
  SelectArrowUp,
} from "@/public/SVG";
import { ErrorMessage, Field, FormikProps } from "formik";
import { CopyCheck } from "lucide-react";
import { useState } from "react";

const Index = ({
  type,
  name,
  placeholder,
  formikProps,
  label,
  disabled = false,
  value,
  className,
  containerClassName,
  required = false,
  as = "input",
  optional = false,
  labelStyle,
  maxLength,
  inputMode,
  step,
  selectTime,
}: {
  type: string;
  name: string;
  placeholder: string;
  formikProps?: FormikProps<{ [key: string]: string | number | null }>;
  label: string;
  disabled?: boolean;
  value?: string;
  className?: string;
  containerClassName?: string;
  required?: boolean;
  as?: string;
  optional?: boolean;
  labelStyle?: string;
  maxLength?: number;
  inputMode?: string;
  step?: string;
  selectTime?: boolean;
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPasswordType = type === "password";
  const inputType = isPasswordType && isPasswordVisible ? "text" : type;
  const [period, setPeriod] = useState("صباحا"); // Default to morning (AM)

  const togglePeriod = () => {
    setPeriod((prev) => (prev === "صباحا" ? "مساءا" : "صباحا"));
  };

  const togglePasswordVisibility = () => setIsPasswordVisible((prev) => !prev);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (type === "number") {
      // Allow only non-negative numbers
      // e.target.value = e.target.value.replace(/[^0-9]/g, "");
      // Ensure the value is not negative
      if (e.target.value && parseFloat(e.target.value) < 0) {
        e.target.value = "";
      }
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${containerClassName}`}>
      <label
        htmlFor={name}
        className={`text-16 text-primarySlate700 font-[600] ${labelStyle}`}
      >
        {label}
      </label>
      <div className="relative w-full">
        <div className=" flex items-center gap-5">
          <Field
            type={inputType}
            name={name}
            id={name}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            as={as}
            min={type === "number" ? 0 : undefined}
            onInput={type === "number" ? handleInput : undefined}
            className={`h-[48px] grow w-full outline-none border border-textBorder bg-white rounded-6 px-3 text-textMain text-16 font-[600] ${className}`}
            maxLength={maxLength || undefined}
            pattern={inputMode === "numeric" ? "[0-9]*" : undefined}
            inputMode={inputMode}
            step={step}
          />
          {selectTime && (
            <div className="h-[48px] grow w-full outline-none border border-textBorder bg-white rounded-6 px-3 text-textMain text-16 font-[600] relative flex items-center">
              <button onClick={togglePeriod} className="absolute top-3 end-3  ">
                <SelectArrowUp />
              </button>
              <span className="text-center py-2">{period}</span>
              <button
                onClick={togglePeriod}
                className="absolute bottom-3 end-3 "
              >
                <SelectArrowDown />
              </button>
            </div>
          )}
        </div>
        {isPasswordType && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer"
            aria-label={isPasswordVisible ? "Hide password" : "Show password"}
          >
            {isPasswordVisible ? <EyeInput /> : <EyeSlash />}
          </button>
        )}
      </div>
      {optional && (
        <div className=" flex items-center gap-2">
          <InfoCircle />
          <span className="text-12 text-textSubText">اختياري</span>
        </div>
      )}
      <ErrorMessage
        component={"div"}
        name={name}
        className="text-14 text-red-500"
      />
    </div>
  );
};

export default Index;
