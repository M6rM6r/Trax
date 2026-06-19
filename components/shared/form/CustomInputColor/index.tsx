/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { EyeInput, EyeSlash, InfoCircle } from "@/public/SVG";
import { ErrorMessage, Field, FormikProps } from "formik";
import { CopyCheck } from "lucide-react";
import { useState } from "react";

const Index = ({
  name,
  placeholder,
  formikProps,
  label,
  disabled = false,
  value,
  className,
  containerClassName,
  required = false,
  optional = false,
}: {
  name: string;
  placeholder: string;
  formikProps?: FormikProps<{ [key: string]: string | number | null }>;
  label: string;
  disabled?: boolean;
  value?: string;
  className?: string;
  containerClassName?: string;
  required?: boolean;
  optional?: boolean;
}) => {
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {};

  return (
    <div className={`flex flex-col gap-2 ${containerClassName}`}>
      <label htmlFor={name} className="text-16 text-primarySlate700 font-[600]">
        {label}
      </label>
      <div
        className={`relative h-[48px] w-full outline-none border border-textBorder bg-white rounded-6 px-3 text-textMain text-16 font-[600] ${className} flex items-center`}
      >
        <Field
          type={"color"}
          name={name}
          id={name}
          className="w-6 h-6 border-none outline-none bg-white rounded-6"
        />
        <label htmlFor={name} className="grow opacity-0">
          select color
        </label>
      </div>
      <ErrorMessage
        component={"div"}
        name={name}
        className="text-14 text-red-500"
      />
    </div>
  );
};

export default Index;
