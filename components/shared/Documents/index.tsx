"use client";

import { useState } from "react";
import IdCard from "../IdCard";
import { handleDownload, handleDownloadFiles } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download } from "lucide-react";

interface DocumentsContainerProps {
  front_side_identity: string | null;
  front_side_license: string | null;
  front_side_vehicle_form: string | null;
  className?: string;
}

const DocumentsContainer = ({
  front_side_identity,
  front_side_license,
  front_side_vehicle_form,
  className,
}: DocumentsContainerProps) => {
  const [downloading, setDownloading] = useState<string | null>(null);

  const translateArabicToEnglishFileName = (name: string): string => {
    const map: Record<string, string> = {
      الهوية: "id_card",
      "صورة الهوية": "id_image",
      "بطاقة الهوية": "identity_card",
      الرخصة: "license",
      "رخصة القيادة": "driver_license",
      "صورة الرخصة": "license_image",
      "استمارة السيارة": "vehicle_form",
      "استمارة المركبة": "vehicle_registration",
      "صورة الاستمارة": "vehicle_form_image",
      التأمين: "insurance",
      السيارة: "car",
      المركبة: "vehicle",
      صورة: "document",
    };

    const exact = map[name.trim()];
    if (exact) return exact;

    const trimmed = name.trim().toLowerCase();
    for (const [arabic, english] of Object.entries(map)) {
      if (trimmed.includes(arabic)) return english;
    }

    const safe = trimmed
      .replace(/[^a-zA-Z0-9\u0600-\u06FF\s]/g, "")
      .trim()
      .replace(/\s+/g, "_")
      .toLowerCase();

    return safe || "document";
  };

  const documents = [
    {
      title: "صورة الهوية",
      image: front_side_identity,
      dateTitle: "تاريخ انتهاء الهوية",
      date: "01/01/2023",
      color: "blue",
    },
    {
      title: "رخصة القيادة",
      image: front_side_license,
      dateTitle: "تاريخ انتهاء رخصة القيادة",
      date: "01/01/2023",
      color: "green",
    },
    {
      title: "استمارة السيارة",
      image: front_side_vehicle_form,
      dateTitle: "تاريخ انتهاء استمارة السيارة",
      date: "01/01/2023",
      color: "purple",
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "from-blue-50 to-blue-100/30 border-blue-200",
      green: "from-green-50 to-green-100/30 border-green-200",
      purple: "from-purple-50 to-purple-100/30 border-purple-200",
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  if (!front_side_identity && !front_side_license && !front_side_vehicle_form) {
    return (
      <Card className="bg-gradient-to-br from-gray-50 to-gray-100/30 border-gray-200">
        <CardContent className="p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            لا توجد مستندات
          </h3>
          <p className="text-gray-500">لم يتم رفع أي مستندات حتى الآن</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 ${
        className || ""
      }`}
    >
      {documents.map(
        (doc) =>
          doc.image && (
            <IdCard
              key={doc.title}
              title={doc.title}
              image={doc.image}
              color={doc.color}
              onDownload={() =>
                handleDownload(
                  doc.image,
                  `${translateArabicToEnglishFileName(doc.title)}.png`
                )
              }
              downloading={downloading === doc.title}
            />
          )
      )}
    </div>
  );
};

export default DocumentsContainer;
