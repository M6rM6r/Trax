"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="max-w-md w-full bg-card text-card-foreground rounded-2xl shadow-lg p-8 text-center">
        <h1 className="text-xl font-bold text-foreground mb-2">حدث خطأ في الصفحة</h1>
        <p className="text-sm text-muted-foreground mb-6">{error.message}</p>
        <button
          onClick={reset}
          className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
        >
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
}
