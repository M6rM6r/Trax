"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { isChunkLoadError, recoverFromChunkLoadError } from "@/lib/utils/chunkLoadRecovery";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const chunkError = isChunkLoadError(error);

  useEffect(() => {
    if (recoverFromChunkLoadError(error)) return;
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-muted dark:bg-background">
      <div className="max-w-md w-full bg-background rounded-2xl shadow-lg p-8 text-center border border-border">
        <div className="w-16 h-16 rounded-full bg-destructive/5 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-destructive" aria-hidden />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">
          {chunkError ? "يتوفر تحديث للتطبيق" : "حدث خطأ في التطبيق"}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {chunkError ? "تم نشر إصدار جديد. أعد تحميل الصفحة للمتابعة." : error.message}
        </p>
        <button
          onClick={() => {
            if (chunkError) {
              window.location.reload();
              return;
            }
            reset();
          }}
          className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {chunkError ? "إعادة تحميل الصفحة" : "إعادة المحاولة"}
        </button>
      </div>
    </div>
  );
}
