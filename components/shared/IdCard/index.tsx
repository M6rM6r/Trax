"use client";

import Image, { StaticImageData } from "next/image";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Eye } from "lucide-react";
import { useState } from "react";
import CustomDialog, { Colors } from "../CustomDialog";

interface IdCardProps {
  title: string;
  image: string | StaticImageData;
  onDownload?: () => void;
  downloading?: boolean;
  color?: string;
  customAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}

const IdCard = ({
  title,
  image,
  onDownload,
  downloading,
  color = "blue",
  customAction,
}: IdCardProps) => {
  const [showImageDialog, setShowImageDialog] = useState(false);

  const colorClasses = {
    blue: "from-blue-50 to-blue-100/30 border-blue-200 text-blue-800",
    green: "from-green-50 to-green-100/30 border-green-200 text-green-800",
    purple: "from-purple-50 to-purple-100/30 border-purple-200 text-purple-800",
  };

  const currentColor =
    colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

  return (
    <Card
      className={`rounded-2xl border bg-gradient-to-br ${
        currentColor?.split(" ")[0]
      } ${
        currentColor?.split(" ")[1]
      } border-${color}-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group`}
    >
      <CardHeader className="pb-3 flex flex-row items-center justify-between bg-white/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className={`p-2 bg-${color}-100 rounded-lg`}>
            <FileText className={`w-4 h-4 text-${color}-600`} />
          </div>
          <CardTitle
            className={`text-lg font-semibold ${currentColor?.split(" ")[2]}`}
          >
            {title}
          </CardTitle>
        </div>

        {onDownload && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDownload}
            disabled={downloading}
            className={`text-${color}-600 hover:text-${color}-700 hover:bg-${color}-50 rounded-xl transition-all duration-200`}
          >
            <Download
              className={`h-5 w-5 ${
                downloading ? "animate-pulse" : "group-hover:scale-110"
              }`}
            />
          </Button>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-4 p-4">
        <div className="relative w-full h-48 overflow-hidden rounded-xl bg-white border border-gray-200 group-hover:border-gray-300 transition-colors">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Eye Icon to view full image */}
          <button
            onClick={() => setShowImageDialog(true)}
            className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
            aria-label="عرض الصورة"
          >
            <Eye className="w-8 h-8 text-white" />
          </button>
        </div>

        {customAction && (
          <Button
            onClick={customAction.onClick}
            className={`w-full bg-${color}-600 hover:bg-${color}-700 text-white rounded-xl transition-all duration-200 flex items-center justify-center gap-2`}
          >
            {customAction.icon}
            {customAction.label}
          </Button>
        )}
      </CardContent>

      {/* Image Preview Dialog */}
      <CustomDialog
        title={title}
        color={Colors.primary}
        open={showImageDialog}
        onOpenChange={setShowImageDialog}
        trigger={null}
        content={
          <div className="flex items-center justify-center p-4">
            <div className="relative w-full max-w-2xl">
              <Image
                src={image}
                alt={title}
                width={800}
                height={600}
                className="w-full h-auto rounded-xl object-contain"
              />
            </div>
          </div>
        }
      />
    </Card>
  );
};

export default IdCard;
