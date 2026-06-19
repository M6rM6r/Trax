"use client";
import { DocumentText, Edit, PersonalCard, Profile } from "@/public/SVG";
import { ErrorMessage, FormikProps } from "formik";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { getFullImageUrl } from "@/lib/utils";
import Image from "next/image";

export enum EImageType {
  image = "image",
  id = "id",
  license = "license",
  carForm = "carForm",
}

export const allowedFileTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/bmp",
  "image/webp",
];

export interface CustomFileImageHandle {
  triggerFileSelect: () => Promise<File | null>;
}

const CustomFileImage = forwardRef<
  CustomFileImageHandle,
  {
    name: string;
    formikProps: FormikProps<any>;
    imageType: EImageType;
    value?: string | File | null;
    onFileChange?: (newFileOrUrl: string | File) => void;
  }
>(({ name, formikProps, imageType, value, onFileChange }, ref) => {
  const [preview, setPreview] = useState<string>("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!value) {
      setPreview("");
      return;
    }

    if (typeof value === "string") {
      setPreview(getFullImageUrl(value));
      return;
    }

    if (value instanceof Blob) {
      const url = URL.createObjectURL(value);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [value]);

  // 🔄 Ensure preview re-sync when formikProps.values[name] changes (initial load)
  useEffect(() => {
    const val = formikProps.values?.[name];
    if (val && !preview) {
      if (typeof val === "string") setPreview(getFullImageUrl(val));
    }
  }, [formikProps.values?.[name]]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreview(url);
    formikProps.setFieldValue(name, file);
    onFileChange?.(file);
  };

  useImperativeHandle(ref, () => ({
    triggerFileSelect: () =>
      new Promise<File | null>((resolve) => {
        if (!inputRef.current) return resolve(null);
        const handler = (e: Event) => {
          const target = e.target as HTMLInputElement;
          const file = target.files?.[0] ?? null;
          if (file) {
            formikProps.setFieldValue(name, file);
            onFileChange?.(file);
            const url = URL.createObjectURL(file);
            setPreview(url);
          }
          inputRef.current?.removeEventListener("change", handler);
          resolve(file);
        };
        inputRef.current.addEventListener("change", handler, { once: true });
        inputRef.current.click();
      }),
  }));

  const icons = {
    [EImageType.image]: <Profile className="w-10 text-primaryColor" />,
    [EImageType.id]: <PersonalCard className="w-12 text-iconColor" />,
    [EImageType.license]: <DocumentText className="w-12 text-iconColor" />,
    [EImageType.carForm]: <DocumentText className="w-12 text-iconColor" />,
  };

  return (
    <div>
      <div
        className={`${
          imageType === EImageType.image
            ? "w-[80px] h-[80px] rounded-full bg-primaryColorLight overflow-hidden"
            : "border border-dashed border-textBorder min-w-[264px] h-[115px] w-full overflow-hidden"
        } flex flex-col gap-5 items-center justify-center relative`}
      >
        {preview ? (
          //  plain img instead of next/image for reliability
          <Image
            width={50}
            height={50}
            src={preview}
            alt="Preview"
            className={`object-cover w-full h-full ${
              imageType === EImageType.image ? "rounded-full" : "rounded-8"
            }`}
            onError={() => setPreview("")}
          />
        ) : (
          icons[imageType]
        )}

        {imageType === EImageType.image && (
          <span className="w-[25px] h-[25px] bg-primaryColorLight rounded-full border border-white flex items-center justify-center absolute bottom-0 left-0">
            <Edit className="w-[15px] text-primaryColor" />
          </span>
        )}

        <input
          ref={inputRef}
          type="file"
          name={name}
          className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleChange}
          accept={allowedFileTypes.join(",")}
        />
      </div>

      <ErrorMessage
        component="div"
        name={name}
        className="text-14 text-red-500"
      />
    </div>
  );
});

CustomFileImage.displayName = "CustomFileImage";
export default CustomFileImage;
