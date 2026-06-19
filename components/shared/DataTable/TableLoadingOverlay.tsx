import { Loader2 } from "lucide-react";

interface TableLoadingOverlayProps {
  isLoading: boolean;
}

export function TableLoadingOverlay({ isLoading }: TableLoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-[12px]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-14 text-gray600 font-medium">جاري تحميل البيانات...</p>
      </div>
    </div>
  );
}
