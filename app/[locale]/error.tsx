"use client";

import { useEffect } from "react";
import ErrorBoundary from "@/components/shared/ErrorBoundary";

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
    <ErrorBoundary>
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">حدث خطأ في الصفحة</h1>
          <p className="text-sm text-gray-500 mb-6">{error.message}</p>
          <button
            onClick={reset}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    </ErrorBoundary>
  );
}
