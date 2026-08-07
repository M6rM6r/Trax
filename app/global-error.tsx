"use client";

import { useEffect } from "react";
import { isChunkLoadError, recoverFromChunkLoadError } from "@/lib/utils/chunkLoadRecovery";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const chunkError = isChunkLoadError(error);

  useEffect(() => {
    if (recoverFromChunkLoadError(error)) return;
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-muted">
          <div className="max-w-md w-full bg-card rounded-2xl shadow-lg p-8 text-center">
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
              className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              {chunkError ? "إعادة تحميل الصفحة" : "إعادة المحاولة"}
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
