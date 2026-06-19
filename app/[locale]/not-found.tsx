"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function NotFound() {
  const router = useRouter();
  const t = useTranslations("NotFound");
  const [countdown, setCountdown] = useState(20);

  // Countdown for automatic redirect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      router.push("/");
    }
  }, [countdown, router]);

  const goHome = () => router.push("/");
  const goBack = () => router.back();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-slate-900 dark:to-slate-800 p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-800 shadow-2xl rounded-3xl p-8 md:p-12 text-center max-w-md w-full mx-auto border border-gray-200 dark:border-slate-700">
        {/* Animated Icon */}
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center animate-pulse">
            <svg
              className="w-12 h-12 text-yellow-600 dark:text-yellow-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {/* Error Code Badge */}
        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">
          خطأ 404 - {t("title")}
        </div>

        {/* Main Content */}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-slate-100 mb-4">
          🗺️ {t("title")}
        </h1>

        <p className="text-gray-600 dark:text-slate-300 mb-3 text-lg leading-relaxed">
          {t("subtitle")}
        </p>

        <p className="text-gray-500 dark:text-slate-400 mb-6 text-sm">{t("description")}</p>

        {/* Suggestions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 text-right">
          <h3 className="text-blue-800 dark:text-blue-400 font-semibold mb-2">
            💡 {t("suggestions.title")}
          </h3>
          <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-1">
            <li>• {t("suggestions.checkUrl")}</li>
            <li>• {t("suggestions.goBack")}</li>
            <li>• {t("suggestions.goHome")}</li>
            <li>• {t("suggestions.search")}</li>
          </ul>
        </div>

        {/* Countdown Timer */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-6">
          <p className="text-yellow-700 dark:text-yellow-400 text-sm font-medium">
            {t("redirectMessage")}{" "}
            <span className="font-bold text-yellow-800 dark:text-yellow-300 text-lg">
              {countdown}
            </span>{" "}
            {t("seconds")}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={goHome}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            {t("goHome")}
          </button>

          <button
            onClick={goBack}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            {t("goBack")}
          </button>
        </div>

        {/* Current Path Info */}
        <div className="mt-6">
          <p className="text-xs text-gray-400 dark:text-slate-500">
            {t("currentPath")} {typeof window !== "undefined" ? window.location.pathname : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
