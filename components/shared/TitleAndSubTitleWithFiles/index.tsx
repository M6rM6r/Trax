"use client";

import { fetcherClient } from "@/lib/fetcherClient";
import { handleDownload, handleDownloadFiles } from "@/lib/utils";
import Image from "next/image";

const Index = ({
  title,
  files,
  showImages,
}: {
  title: string;
  files: any[];
  showImages?: boolean;
}) => {
  return (
    <>
      <div>
        <p className="text-gray600 text-16 font-[600] mb-2">{title}</p>
        <p className="text-18 text-textMain font-[600] overflow-hidden text-ellipsis  flex items-center justify-between">
          تم إرفاق {files.length} ملف{" "}
          {files.length > 0 && (
            <span
              className="text-16 text-primaryColor ms-2 cursor-pointer hover:underline"
              onClick={() => handleDownloadFiles(files)}
            >
              تحميل الكل
            </span>
          )}
        </p>
      </div>
      {showImages && (
        <div className="flex gap-2 flex-wrap">
          {files.map((file) => (
            <div key={file.id} className="relative">
              <Image
                src={file.name}
                alt="file"
                width={72}
                height={72}
                className="w-[72px] aspect-square object-cover rounded-[4px]"
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default Index;
