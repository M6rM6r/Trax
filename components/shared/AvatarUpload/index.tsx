"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { Camera, Loader2, X, Upload } from "lucide-react";
import { useFirebaseStorage, UploadFolder } from "@/hooks/useFirebaseStorage";
import { toastSuccess, toastError } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface AvatarUploadProps {
  currentUrl?: string | null;
  name?: string;
  size?: number;
  folder?: UploadFolder;
  onUpload: (url: string, path: string) => void;
  onRemove?: () => void;
  disabled?: boolean;
  shape?: "circle" | "square";
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_MB = 5;

export default function AvatarUpload({
  currentUrl,
  name = "U",
  size = 96,
  folder = "avatars",
  onUpload,
  onRemove,
  disabled = false,
  shape = "circle",
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { upload, progress, uploading, error } = useFirebaseStorage();

  const displayUrl = preview ?? currentUrl ?? null;
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED.includes(file.type)) {
        toastError("يُسمح فقط بملفات JPG أو PNG أو WebP أو GIF");
        return;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        toastError(`الحد الأقصى لحجم الصورة ${MAX_MB} MB`);
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      try {
        const result = await upload(file, folder);
        onUpload(result.url, result.path);
        toastSuccess("تم رفع الصورة بنجاح");
      } catch {
        setPreview(null);
        toastError(error ?? "فشل رفع الصورة. حاول مرة أخرى.");
      }
    },
    [upload, folder, onUpload, error]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onRemove?.();
  };

  const borderRadius = shape === "circle" ? "9999px" : "12px";

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative group cursor-pointer select-none"
        style={{ width: size, height: size }}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={!disabled ? handleDrop : undefined}
        role="button"
        aria-label="رفع صورة"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
      >
        {/* Avatar display */}
        <div
          className={`w-full h-full overflow-hidden border-2 transition-all duration-200 ${
            isDragging
              ? "border-blue-500 scale-105 shadow-lg shadow-blue-500/20"
              : "border-gray-200 dark:border-slate-600 group-hover:border-blue-400 dark:group-hover:border-blue-500"
          } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
          style={{ borderRadius }}
        >
          {displayUrl ? (
            <Image
              src={displayUrl}
              alt={name}
              width={size}
              height={size}
              className="object-cover w-full h-full"
              style={{ borderRadius }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 text-blue-700 dark:text-blue-300 font-bold"
              style={{ fontSize: size * 0.35, borderRadius }}
            >
              {initials}
            </div>
          )}
        </div>

        {/* Overlay */}
        {!disabled && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{ borderRadius }}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-1">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
                <span className="text-white text-xs font-medium">{progress}%</span>
              </div>
            ) : (
              <Camera className="w-6 h-6 text-white" />
            )}
          </div>
        )}

        {/* Progress ring */}
        <AnimatePresence>
          {uploading && (
            <motion.svg
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none"
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              style={{ borderRadius }}
            >
              <circle
                cx={size / 2}
                cy={size / 2}
                r={size / 2 - 3}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="3"
                strokeDasharray={`${((size / 2 - 3) * 2 * Math.PI * progress) / 100} ${(size / 2 - 3) * 2 * Math.PI}`}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                className="transition-all duration-200"
              />
            </motion.svg>
          )}
        </AnimatePresence>

        {/* Remove button */}
        {displayUrl && !uploading && !disabled && onRemove && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md transition-colors z-10"
            aria-label="حذف الصورة"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Label */}
      {!disabled && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors disabled:opacity-50"
        >
          <Upload className="w-3.5 h-3.5" />
          {uploading ? `جاري الرفع... ${progress}%` : displayUrl ? "تغيير الصورة" : "رفع صورة"}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || uploading}
      />
    </div>
  );
}
