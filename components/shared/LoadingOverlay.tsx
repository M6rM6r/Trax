"use client";
import { useLoading } from "@/contexts/LoadingContext";
import { Loader2 } from "lucide-react";

const LoadingOverlay = () => {
  const { isLoading } = useLoading();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-lg bg-background p-8 shadow-xl">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-18 font-[600] text-foreground">جاري التحميل...</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
