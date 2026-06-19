"use client";

import Image from "next/image";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ImageIcon } from "lucide-react";
import { Danger } from "@/public/SVG";
import { handleDownload } from "@/lib/utils";
import { useState } from "react";

interface AttachmentCardProps {
  title: string;
  image: string;
  rejectionReason?: string | null;
}

const AttachmentCard = ({
  title,
  image,
  rejectionReason,
}: AttachmentCardProps) => {
  const [downloading, setDownloading] = useState(false);
  const hasRejection = rejectionReason != null;

  const translateArabicToEnglishFileName = (name: string): string => {
    const safe = name
      .trim()
      .replace(/[^a-zA-Z0-9\u0600-\u06FF\s]/g, "")
      .trim()
      .replace(/\s+/g, "_")
      .toLowerCase();

    return safe || "attachment";
  };

  const handleDownloadClick = () => {
    setDownloading(true);
    handleDownload(
      image,
      `${translateArabicToEnglishFileName(title)}.png`
    );
    setTimeout(() => setDownloading(false), 1000);
  };

  return (
    <Card
      className={`rounded-2xl border ${
        hasRejection
          ? "bg-gradient-to-br from-red-50 to-red-100/30 border-red-200"
          : "bg-gradient-to-br from-gray-50 to-gray-100/30 border-gray-200"
      } shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group`}
    >
      <CardHeader className="pb-3 flex flex-row items-center justify-between bg-white/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 ${
              hasRejection ? "bg-red-100" : "bg-gray-100"
            } rounded-lg`}
          >
            {hasRejection ? (
              <Danger className="w-4 h-4" />
            ) : (
              <ImageIcon
                className={`w-4 h-4 ${
                  hasRejection ? "text-red-600" : "text-gray-600"
                }`}
              />
            )}
          </div>

          <CardTitle
            className={`text-lg font-semibold ${
              hasRejection ? "text-red-800" : "text-gray-800"
            }`}
          >
            {title}
          </CardTitle>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleDownloadClick}
          disabled={downloading}
          className={`${
            hasRejection
              ? "text-red-600 hover:text-red-800 hover:bg-red-100"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
          } rounded-xl transition-all duration-200`}
        >
          <Download
            className={`h-5 w-5 ${
              downloading ? "animate-pulse" : "group-hover:scale-110"
            }`}
          />
        </Button>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 p-4">
        <div className="relative w-full h-48 overflow-hidden rounded-xl bg-white border border-gray-200 group-hover:border-gray-300 transition-colors">
          <Image
            src={image}
            alt={title}
            fill
            className="object-contain transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {hasRejection && (
          <div className="flex flex-col gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm font-semibold text-red-700">سبب الرفض:</p>
            <p className="text-sm text-red-600">{rejectionReason}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AttachmentCard;
