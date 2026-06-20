"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50 dark:bg-slate-900">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 text-center">
            <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">
              حدث خطأ في التطبيق
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">{error.message}</p>
            <button
              onClick={reset}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
