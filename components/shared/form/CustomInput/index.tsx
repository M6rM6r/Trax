/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { EyeInput, EyeSlash, InfoCircle } from "@/public/SVG";
import React, { useState } from "react";

import { ErrorMessage, Field, type FormikProps, useFormikContext } from "formik";

const Index = ({
  type,
  name,
  placeholder,
  label,
  disabled = false,
  className,
  containerClassName,
  required = false,
  as = "input",
  optional = false,
  labelStyle,
  maxLength,
  inputMode,
  step,
  preventLeadingZero = false,
  maxDecimals,
  autoComplete,
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
  preventLeadingZero?: boolean;
  maxDecimals?: number;
  autoComplete?: string;
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPasswordType = type === "password";
  const inputType = isPasswordType && isPasswordVisible ? "text" : type;
  const { setFieldValue } = useFormikContext();

  const togglePasswordVisibility = () => setIsPasswordVisible((prev) => !prev);

  const formatDecimalValue = (value: string): string => {
    if (!value) return value;

    // Remove any negative signs
    value = value.replace(/-/g, "");

    // If maxDecimals is defined, enforce decimal limits
    if (maxDecimals !== undefined) {
      const parts = value.split(".");

      if (parts.length === 2) {
        // If there's a decimal part, limit it to maxDecimals
        const integerPart = parts[0];
        let decimalPart = parts[1];

        if (decimalPart.length > maxDecimals) {
          decimalPart = decimalPart.slice(0, maxDecimals);
        }

        return `${integerPart}.${decimalPart}`;
      }
    }

    return value;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    if (type === "number") {
      // Allow only numbers and decimal point
      value = value.replace(/[^0-9.]/g, "");

      // Remove multiple decimal points
      const decimalCount = (value.match(/\./g) || []).length;
      if (decimalCount > 1) {
        const parts = value.split(".");
        value = parts[0] + "." + parts.slice(1).join("");
      }

      // Format decimal value
      value = formatDecimalValue(value);

      // Prevent leading zeros (except 0.x)
      if (preventLeadingZero) {
        if (value.length > 1 && value.startsWith("0") && !value.startsWith("0.")) {
          value = value.replace(/^0+/, "");
        }
      }

      // Update the field value
      setFieldValue(name, value);
      return; // Don't call the default Formik handler
    }

    // For non-number types, let Formik handle it via setFieldValue
    setFieldValue(name, value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (type === "number") {
      // Prevent arrow keys from changing the numeric value
      if (["ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
      }

      // Block minus and plus keys
      if (e.key === "-" || e.key === "+") {
        e.preventDefault();
      }

      // Prevent decimal point if maxDecimals is 0
      if (maxDecimals === 0 && e.key === ".") {
        e.preventDefault();
      }

      const currentValue = e.currentTarget.value;

      // Prevent typing more decimal places than allowed
      if (currentValue.includes(".") && maxDecimals !== undefined) {
        const decimalPart = currentValue.split(".")[1];
        const cursorPosition = e.currentTarget.selectionStart || 0;
        const decimalPosition = currentValue.indexOf(".");

        // If cursor is after decimal point and we're at max decimals, prevent input
        if (cursorPosition > decimalPosition && decimalPart.length >= maxDecimals) {
          if (!["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Enter"].includes(e.key)) {
            e.preventDefault();
          }
        }
      }

      // Prevent typing zero as first character if the prop is true
      if (
        preventLeadingZero &&
        e.key === "0" &&
        (currentValue === "" || e.currentTarget.selectionStart === 0) &&
        !currentValue.includes(".")
      ) {
        e.preventDefault();
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (type === "number" && e.target.value) {
      let value = e.target.value;

      // Format to ensure proper decimal places
      if (maxDecimals !== undefined && maxDecimals > 0) {
        if (value.includes(".")) {
          const parts = value.split(".");
          const integerPart = parts[0];
          let decimalPart = parts[1] || "";

          // Pad with zeros if needed
          while (decimalPart.length < maxDecimals) {
            decimalPart += "0";
          }

          value = `${integerPart}.${decimalPart}`;
        } else {
          // Add decimal point with zeros if it's a whole number
          value = `${value}.${"0".repeat(maxDecimals)}`;
        }

        setFieldValue(name, value);
      }
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${containerClassName}`}>
      <label
        htmlFor={name}
        className={`text-16 text-primarySlate700 dark:text-slate-300 font-[600] ${labelStyle}`}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative w-full">
        <Field name={name}>
          {({ field, form }: any) => (
            <input
              {...field}
              type={inputType}
              id={name}
              placeholder={placeholder}
              disabled={disabled}
              required={required}
              aria-invalid={!!form.errors[name] && !!form.touched[name]}
              aria-describedby={`${name}-error`}
              min={type === "number" ? 0 : undefined}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                handleChange(e);
              }}
              onKeyDown={type === "number" ? handleKeyDown : undefined}
              onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                field.onBlur(e);
                if (type === "number") {
                  handleBlur(e);
                }
              }}
              className={`h-[48px] grow w-full outline-none border border-textBorder dark:border-slate-600 bg-white dark:bg-slate-900 rounded-6 px-3 text-textMain dark:text-slate-100 text-16 font-[600] ${className} ${
                as === "textarea" ? "pt-2 h-20" : ""
              }`}
              maxLength={maxLength || undefined}
              pattern={
                maxDecimals !== undefined
                  ? maxDecimals === 0
                    ? "[0-9]+"
                    : `[0-9]+(\\.[0-9]{1,${maxDecimals}})?`
                  : undefined
              }
              inputMode={inputMode}
              autoComplete={autoComplete}
              step={
                maxDecimals !== undefined
                  ? maxDecimals === 0
                    ? "1"
                    : `0.${"0".repeat(maxDecimals - 1)}1`
                  : step
              }
              onWheel={(e: any) => e.target.blur()}
            />
          )}
        </Field>
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
        id={`${name}-error`}
        name={name}
        className="text-14 text-red-500"
      />
    </div>
  );
};

export default Index;
