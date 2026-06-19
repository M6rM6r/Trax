import React, {
  useState,
  useRef,
  DragEvent,
  ChangeEvent,
  useEffect,
} from "react";
import { File as FileIcon, X, Image as ImageIcon } from "lucide-react";
import { FormikProps } from "formik";
import { Link } from "@/public/SVG";
import Image from "next/image";

interface FileItem {
  file: File;
  id: string;
  name: string;
  size: string;
  type: string;
  previewUrl?: string; // رابط معاينة للصور
}

interface CustomFileInputProps {
  containerClassName?: string;
  label: string;
  name: string;
  formikProps: FormikProps<any>;
  onFilesChange?: (files: File[]) => void;
  onUpload?: (files: File[]) => void;
  acceptedTypes?: string;
  maxFiles?: number;
  maxSize?: number; // in bytes
  multiple?: boolean;
}

const CustomFileInput: React.FC<CustomFileInputProps> = ({
  containerClassName,
  label,
  name,
  formikProps,
  onFilesChange,
  //   onUpload,
  acceptedTypes = "*",
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB default
  multiple = true,
}) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const value = formikProps.initialValues[name];
    if (!value) return;

    // In case the value is actually a file
    // This check added for working in future if needed
    if (value instanceof File) {
      const previewUrl = URL.createObjectURL(value);

      const fileItem: FileItem = {
        file: value,
        id: Math.random().toString(36).substr(2, 9),
        name: value.name,
        size: formatFileSize(value.size),
        type: value.type,
        previewUrl,
      };

      setFiles([fileItem]);

      return () => URL.revokeObjectURL(previewUrl);
    }

    // In case the value is a string
    // Initial value from the formikProps.initialValues[name]
    if (typeof value === "string") {
      // Faking a file from the string value (URL)
      const fakeFile = new File([], value?.split("/").pop() || "file", {
        type: "image/*",
      });

      const fileItem: FileItem = {
        file: fakeFile,
        id: Math.random().toString(36).substr(2, 9),
        name: fakeFile.name,
        size: "0 KB",
        type: fakeFile.type,
        previewUrl: value, // formikProps.initialValues[name] - URL from backend
      };

      setFiles([fileItem]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formikProps.initialValues[name]]);

  const handleDrag = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `الملف ${file.name} كبير جداً. الحد الأقصى ${formatFileSize(
        maxSize
      )}`;
    }

    if (acceptedTypes !== "*") {
      const allowedTypes = acceptedTypes?.split(",").map((type) => type.trim());
      const fileExtension = "." + file.name?.split(".").pop()?.toLowerCase();
      const mimeType = file.type;

      const isAllowed = allowedTypes.some(
        (type) =>
          type === mimeType ||
          type === fileExtension ||
          (type.endsWith("/*") && mimeType.startsWith(type.replace("/*", "")))
      );

      if (!isAllowed) {
        return `نوع الملف ${file.name} غير مدعوم`;
      }
    }

    return null;
  };

  const handleFiles = (fileList: FileList): void => {
    const newErrors: string[] = [];
    const validFiles: FileItem[] = [];

    // For single file mode, only take the first file and replace existing
    const filesToProcess = multiple ? Array.from(fileList) : [fileList[0]];

    // Check max files limit (only for multiple mode)
    if (multiple && files.length + filesToProcess.length > maxFiles) {
      newErrors.push(`لا يمكن رفع أكثر من ${maxFiles} ملف`);
      setErrors(newErrors);
      return;
    }

    filesToProcess.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        newErrors.push(error);
      } else {
        // For multiple mode, check for duplicate files
        // For single mode, skip duplicate check since we're replacing
        if (multiple) {
          const isDuplicate = files.some(
            (existingFile) =>
              existingFile.name === file.name &&
              existingFile.size === formatFileSize(file.size)
          );

          if (!isDuplicate) {
            const fileItem: FileItem = {
              file,
              id: Math.random().toString(36).substr(2, 9),
              name: file.name,
              size: formatFileSize(file.size),
              type: file.type,
            };

            // إنشاء معاينة للصور
            if (file.type.startsWith("image/")) {
              fileItem.previewUrl = URL.createObjectURL(file);
            }

            validFiles.push(fileItem);
          } else {
            newErrors.push(`الملف ${file.name} موجود بالفعل`);
          }
        } else {
          // Single mode - just add the file
          const fileItem: FileItem = {
            file,
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            size: formatFileSize(file.size),
            type: file.type,
          };

          // إنشاء معاينة للصور
          if (file.type.startsWith("image/")) {
            fileItem.previewUrl = URL.createObjectURL(file);
          }

          validFiles.push(fileItem);
        }
      }
    });

    setErrors(newErrors);

    if (validFiles.length > 0) {
      // For single mode, replace all files. For multiple mode, add to existing
      const updatedFiles = multiple ? [...files, ...validFiles] : validFiles;
      setFiles(updatedFiles);
      formikProps.setFieldValue(
        name,
        multiple ? updatedFiles.map((item) => item.file) : updatedFiles[0]?.file
      );
      // Call callback with actual File objects
      if (onFilesChange) {
        onFilesChange(updatedFiles.map((item) => item.file));
      }
    }

    // Reset input value to allow selecting the same file again
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const removeFile = (id: string): void => {
    const fileToRemove = files.find((file) => file.id === id);

    // تحرير الذاكرة المستخدمة لمعاينة الصور
    if (fileToRemove?.previewUrl) {
      URL.revokeObjectURL(fileToRemove.previewUrl);
    }

    const updatedFiles = files.filter((file) => file.id !== id);
    setFiles(updatedFiles);

    // Update formik value
    formikProps.setFieldValue(
      name,
      multiple
        ? updatedFiles.map((item) => item.file)
        : updatedFiles[0]?.file || ""
    );

    if (onFilesChange) {
      onFilesChange(updatedFiles.map((item) => item.file));
    }
  };

  const clearErrors = (): void => {
    setErrors([]);
  };

  // تنظيف معاينات الصور عند إلغاء التثبيت
  useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.previewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
      });
    };
  }, [files]);

  return (
    <div className={`flex flex-col gap-2 ${containerClassName}`}>
      <p className={`text-16 text-primarySlate700 font-[600] `}>{label}</p>
      <div className="flex flex-col gap-2">
        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="rounded-6 border border-textBorder p-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                {errors.map((error, index) => (
                  <p key={index} className="text-sm text-red-600 text-right">
                    {error}
                  </p>
                ))}
              </div>
              <button
                onClick={clearErrors}
                className="text-red-400 hover:text-red-600 focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* File Input Area */}
        <div
          className={`h-[48px] relative rounded-6 border border-textBorder transition-all duration-200 ${
            dragActive ? "border-primaryColor bg-primaryColorLight" : "bg-white"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            multiple={multiple}
            accept={acceptedTypes}
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex items-center justify-between gap-5 h-full px-3">
            <span className="text-16 text-textMain font-[600]">- اختر ـ</span>
            <Link />
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className=" flex flex-col gap-2">
            <h3 className="text-12 text-[#3D4A5C] font-[600]">
              تم إرفاق{" "}
              <span className=" text-primaryColor">{files.length} ملف</span>
            </h3>
            <div className="flex flex-col gap-2">
              {files.map((fileItem) => (
                <div
                  key={fileItem.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-center space-x-3 space-x-reverse">
                    {fileItem.previewUrl ? (
                      // عرض معاينة الصورة
                      // width and height are required props for next/image
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-gray-200">
                        <Image
                          src={fileItem.previewUrl}
                          alt={fileItem.name}
                          width={20}
                          height={20}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : fileItem.type.startsWith("image/") ? (
                      // أيقونة للصور التي ليس لها معاينة
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-blue-600" />
                      </div>
                    ) : (
                      // أيقونة للملفات الأخرى
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileIcon className="w-5 h-5 text-blue-600" />
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-14 text-textMain font-[600]">
                        {fileItem.name}
                      </p>
                      <p className="text-12 text-gray600 font-[600]">
                        {fileItem.size}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFile(fileItem.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-200 focus:outline-none"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomFileInput;
