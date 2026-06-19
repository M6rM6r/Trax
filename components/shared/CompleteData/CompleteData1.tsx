"use client";
import { FormikProps } from "formik";
import CustomFileImage, {
  EImageType,
  CustomFileImageHandle,
} from "../form/CustomFileImage";
import DateInput from "../form/DateInput";
import { Driver } from "@/lib/types/responseTypes";
import { cn } from "@/lib/utils";
import { EVehicleType } from "@/lib/types/enums";
import { Download, Eye, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ImagePreviewModal } from "../ImagePreviewDialog";
import { fetcherClient } from "@/lib/fetcherClient";
import { handleDownload } from "@/lib/utils";

const CompleteData1 = ({
  formikProps,
  profileData,
  vehicleType,
}: {
  formikProps: FormikProps<any>;
  profileData: Driver;
  vehicleType: EVehicleType;
}) => {
  const idRef = useRef<CustomFileImageHandle>(null);
  const licenseRef = useRef<CustomFileImageHandle>(null);
  const carFormRef = useRef<CustomFileImageHandle>(null);

  //  local image URLs
  const [idImage, setIdImage] = useState(profileData.front_side_identity || "");
  const [licenseImage, setLicenseImage] = useState(
    profileData.front_side_license || ""
  );
  const [carFormImage, setCarFormImage] = useState(
    profileData.front_side_vehicle_form || ""
  );

  //  update if profileData changes
  useEffect(() => {
    setIdImage(profileData.front_side_identity || "");
    setLicenseImage(profileData.front_side_license || "");
    setCarFormImage(profileData.front_side_vehicle_form || "");
  }, [profileData]);

  //   const idImage = formikProps.values.front_side_identity;
  // const licenseImage = formikProps.values.front_side_license;
  // const carFormImage = formikProps.values.front_side_vehicle_form;

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const driverId = profileData?.id;

  //  upload handler
  const handleImageUpload = async (
    file: File,
    type: "id" | "license" | "carForm"
  ) => {
    const fieldMap: Record<string, string> = {
      id: "front_side_identity",
      license: "front_side_license",
      carForm: "front_side_vehicle_form",
    };

    const fieldName = fieldMap[type];
    if (!fieldName) throw new Error("Invalid upload type");

    try {
      // Ensure uploaded file has a filename with an extension. Some browsers or sources
      // may produce Files without extensions which causes downstream storage/URLs
      // to be created without extensions. Create a new File with a default/derived
      // extension when missing.
      let uploadFile = file;
      const hasExt = /\.[a-zA-Z0-9]{1,6}$/.test(file.name || "");
      if (!hasExt) {
        const mime = file.type || "";
        let ext = ".jpg";
        if (mime.includes("png")) ext = ".png";
        else if (mime.includes("jpeg") || mime.includes("jpg")) ext = ".jpg";
        else if (mime.includes("webp")) ext = ".webp";
        else if (mime.includes("gif")) ext = ".gif";

        const baseName =
          file.name && file.name.length > 0 ? file.name : "upload";
        const newName = `${baseName}${ext}`;
        try {
          uploadFile = new File([file], newName, {
            type: file.type || "image/jpeg",
          });
        } catch (err) {
          // In older environments where File constructor may not work reliably,
          // fall back to the original file.
          uploadFile = file;
        }
      }

      const formData = new FormData();
      formData.append(fieldName, uploadFile, uploadFile.name);
      // Provide original filename and content-type to the backend so it can
      // preserve extensions when storing files (useful if backend generates its own keys).
      formData.append("original_filename", uploadFile.name);
      formData.append("original_content_type", uploadFile.type || "image/jpeg");
      const extMatch = /\.([a-zA-Z0-9]{1,6})$/.exec(uploadFile.name);
      formData.append("original_extension", extMatch ? extMatch[1] : "jpg");

      const res: any = await fetcherClient(`/drivers/${driverId}`, {
        method: "PUT",
        body: formData,
      });

      if (!res.success) throw new Error(res.message || "Upload failed");

      const uploadedUrl = res.data?.url || URL.createObjectURL(file);

      //  Store in Formik (single source of truth)
      formikProps.setFieldValue(fieldName, uploadedUrl);
      formikProps.setFieldTouched(fieldName, true);

      // Optional: if you still keep local state for UI responsiveness
      switch (type) {
        case "id":
          setIdImage(uploadedUrl);
          break;
        case "license":
          setLicenseImage(uploadedUrl);
          break;
        case "carForm":
          setCarFormImage(uploadedUrl);
          break;
      }
    } catch (err: any) {
      console.error("Upload failed:", err);
      alert("فشل تحميل الصورة. حاول مرة أخرى.");
    }
  };

  const handlePreview = (url: string | null) => {
    if (!url) return;

    // If it's a data or blob URL, just open it
    if (url.startsWith("data:") || url.startsWith("blob:")) {
      setPreviewImage(url);
      setPreviewOpen(true);
      return;
    }

    // Ensure URL has a file extension; if not, add a default (.jpg)
    try {
      // Try using the URL constructor to separate parts (works for absolute and relative URLs)
      const parsed = new URL(
        url,
        typeof window !== "undefined" ? window.location.origin : undefined
      );
      const pathname = parsed.pathname || "";
      // check if pathname ends with .ext (1-6 alnum chars)
      const hasExt = /\.[a-zA-Z0-9]{1,6}$/.test(pathname);
      if (!hasExt) {
        // append default extension before any query
        parsed.pathname = pathname + ".jpg";
        setPreviewImage(parsed.toString());
        setPreviewOpen(true);
        return;
      }
      setPreviewImage(parsed.toString());
      setPreviewOpen(true);
      return;
    } catch (err) {
      // Fallback: handle manually (preserve query string)
      const qIndex = url.indexOf("?");
      const base = qIndex === -1 ? url : url.slice(0, qIndex);
      const query = qIndex === -1 ? "" : url.slice(qIndex);
      const hasExt = /\.[a-zA-Z0-9]{1,6}$/.test(base);
      const finalUrl = hasExt ? url : `${base}.jpg${query}`;
      setPreviewImage(finalUrl);
      setPreviewOpen(true);
      return;
    }
  };

  const triggerAndUpload = async (
    ref: React.RefObject<CustomFileImageHandle | null>,
    type: "id" | "license" | "carForm"
  ) => {
    const file = await ref.current?.triggerFileSelect();
    if (file) await handleImageUpload(file, type);
  };

  return (
    <>
      <div
        className={cn(
          "grid grid-cols-1 md:grid-cols-2 gap-5",
          vehicleType !== EVehicleType.driver_without_car
            ? "lg:grid-cols-3"
            : "lg:grid-cols-2"
        )}
      >
        {/* ID */}
        <div className="border border-textBorder rounded-8 p-4 flex flex-col gap-5">
          <div className="flex justify-between items-center">
            <p className="text-16 text-textMain font-[600]">صورة الهوية</p>
            <div className="flex items-center gap-2">
              <Download
                onClick={() => handleDownload(idImage, "id-card.jpg")}
                className="cursor-pointer text-gray600 w-5"
              />
            </div>
          </div>

          <CustomFileImage
            ref={idRef}
            name="front_side_identity"
            formikProps={formikProps}
            imageType={EImageType.id}
            value={idImage}
            onFileChange={(fileOrUrl) => {
              if (typeof fileOrUrl === "string") setIdImage(fileOrUrl);
              formikProps.setFieldValue("front_side_identity", fileOrUrl);
            }}
          />
        </div>

        {/* License */}
        <div className="border border-textBorder rounded-8 p-4 flex flex-col gap-5">
          <div className="flex justify-between items-center">
            <p className="text-16 text-textMain font-[600]">رخصة القيادة</p>
            <div className="flex items-center gap-2">
              <Download
                onClick={() => handleDownload(licenseImage, "license.jpg")}
                className="cursor-pointer text-gray600 w-5"
              />
            </div>
          </div>

          <CustomFileImage
            ref={licenseRef}
            name="front_side_license"
            formikProps={formikProps}
            imageType={EImageType.license}
            value={licenseImage}
            onFileChange={(fileOrUrl) => {
              if (typeof fileOrUrl === "string") setLicenseImage(fileOrUrl);
              formikProps.setFieldValue("front_side_license", fileOrUrl);
            }}
          />
        </div>

        {/* Car Form */}
        {vehicleType !== EVehicleType.driver_without_car && (
          <div className="border border-textBorder rounded-8 p-4 flex flex-col gap-5">
            <div className="flex justify-between items-center">
              <p className="text-16 text-textMain font-[600]">
                استمارة السيارة
              </p>
              <div className="flex items-center gap-2">
                <Download
                  onClick={() => handleDownload(carFormImage, "car-form.jpg")}
                  className="cursor-pointer text-gray600 w-5"
                />
              </div>
            </div>

            <CustomFileImage
              ref={carFormRef}
              name="front_side_vehicle_form"
              formikProps={formikProps}
              imageType={EImageType.carForm}
              value={carFormImage}
              onFileChange={(fileOrUrl) => {
                if (typeof fileOrUrl === "string") setCarFormImage(fileOrUrl);
                formikProps.setFieldValue("front_side_vehicle_form", fileOrUrl);
              }}
            />
          </div>
        )}
      </div>

      {/*  Preview modal */}
      <ImagePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        imageUrl={previewImage || ""}
      />
    </>
  );
};

export default CompleteData1;
