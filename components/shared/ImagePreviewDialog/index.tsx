"use client";
import Image from "next/image";
import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

interface ImagePreviewModalProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string | null;
}

export const ImagePreviewModal = ({
  open,
  onClose,
  imageUrl,
}: ImagePreviewModalProps) => {
  const [previewSrc, setPreviewSrc] = useState<string | null>(imageUrl);

  useEffect(() => {
    if (imageUrl) {
      const updatedUrl = imageUrl.startsWith("blob:")
        ? imageUrl
        : `${imageUrl}?t=${Date.now()}`; // bust cache for remote images
      setPreviewSrc(updatedUrl);
    } else {
      setPreviewSrc(null);
    }
  }, [imageUrl]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      {/*  Softer, cleaner overlay */}
      <DialogOverlay
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      <DialogContent
        className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
        max-w-4xl w-[90%] rounded-2xl bg-white p-6 flex flex-col items-center
        shadow-xl shadow-gray-400/20 transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition"
        >
          <X className="w-6 h-6" />
        </button>

        {previewSrc ? (
          <Image
            key={previewSrc} // force rerender when src changes
            src={previewSrc}
            alt="Preview"
            width={900}
            height={700}
            unoptimized // disable next/image cache
            className="rounded-lg object-contain max-h-[80vh]"
          />
        ) : (
          <p className="text-gray-500 mt-8">لا توجد صورة للعرض</p>
        )}
      </DialogContent>
    </Dialog>
  );
};
