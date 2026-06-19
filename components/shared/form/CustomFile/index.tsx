/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Link } from "@/public/SVG";
import { ErrorMessage, Field, FormikProps, isString } from "formik";
import { useEffect, useState } from "react";

const Index = ({
  name,
  formikProps,
  label,
  value,
}: {
  name: string;
  formikProps: FormikProps<any>;
  label: string;
  value?: any;
}) => {
  const [isTouched, setIsTouched] = useState(false);
  const [image, setImage] = useState<{ url: string; name: string }>({
    url: "",
    name: "",
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.readyState === 2) {
          setImage({ url: reader.result as string, name: file.name });
        }
      };
      reader.readAsDataURL(file);
      formikProps.setFieldValue(name, file);
    }
  };
  const handleBlur = () => {
    setIsTouched(true); // Mark as touched on blur
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-16 text-primarySlate700 font-[600]">
        {label}
      </label>
      <div className="relative w-full h-[48px] flex items-center justify-between  outline-none border border-textBorder bg-white rounded-6 px-3 text-textMain text-16 font-[600]">
        {image?.name ? (
          <p className="text-16 text-textMain font-[600]">{image.name}</p>
        ) : (
          <p className="text-16 text-[#a3a9b5]">- اختر ـ</p>
        )}
        <Link />
        <Field
          type="file"
          name={name}
          className=" absolute top-0 left-0 w-full h-full bg-red-500 opacity-0 "
          value={undefined}
          onChange={handleChange}
          onBlur={handleBlur}
          accept="image/jpeg,image/png,image/gif,image/bmp,image/webp,application/pdf"
        />
      </div>
      {(isTouched || (formikProps.touched[name] && !value)) && (
        <ErrorMessage
          component={"div"}
          name={name}
          className="text-14 text-red-500"
        />
      )}
    </div>
  );
};

export default Index;
