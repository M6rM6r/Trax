"use client";

import Image from "next/image";

interface AvatarUploadProps {
  currentUrl?: string | null;
  name?: string;
  size?: number;
  shape?: "circle" | "square";
}

export default function AvatarUpload({
  currentUrl,
  name = "U",
  size = 96,
  shape = "circle",
}: AvatarUploadProps) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const borderRadius = shape === "circle" ? "9999px" : "12px";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative select-none" style={{ width: size, height: size }}>
        <div
          className="w-full h-full overflow-hidden border-2 border-gray-200 dark:border-slate-600 transition-all duration-200"
          style={{ borderRadius }}
        >
          {currentUrl ? (
            <Image
              src={currentUrl}
              alt={name}
              width={size}
              height={size}
              className="object-cover w-full h-full"
              style={{ borderRadius }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/40 text-emerald-700 dark:text-emerald-300 font-bold"
              style={{ fontSize: size * 0.35, borderRadius }}
            >
              {initials}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
