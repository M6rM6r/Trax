"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Error({
  error,
  reset,
}: {
  error?: Error & { digest?: string };
  reset?: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(30);
  const [errorType, setErrorType] = useState<
    "404" | "401" | "403" | "500" | "network" | "unknown"
  >("unknown");

  // Detect error type from various sources
  useEffect(() => {
    const detectErrorType = () => {
      // Check URL parameters first
      const errorParam = searchParams.get("error");
      if (errorParam === "404") return "404";
      if (errorParam === "401") return "401";
      if (errorParam === "403") return "403";
      if (errorParam === "500") return "500";

      // Check if it's a network error
      if (
        error?.message?.includes("fetch") ||
        error?.message?.includes("network") ||
        error?.message?.includes("request") ||
        error?.name === "TypeError"
      ) {
        return "network";
      }

      // Check for 404-like errors
      if (
        error?.message?.includes("404") ||
        error?.message?.includes("not found") ||
        window.location.pathname.includes("404")
      ) {
        return "404";
      }

      if (
        error?.message?.includes("401") ||
        error?.message?.includes("not found") ||
        window.location.pathname.includes("401")
      ) {
        return "401";
      }

      if (
        error?.message?.includes("403") ||
        error?.message?.includes("not found") ||
        window.location.pathname.includes("403")
      ) {
        return "403";
      }

      // Check for server errors (500, 502, 503, etc.)
      if (
        error?.message?.includes("500") ||
        error?.message?.includes("server") ||
        error?.message?.includes("internal")
      ) {
        return "500";
      }

      // Default to unknown
      return "unknown";
    };

    setErrorType(detectErrorType());
  }, [error, searchParams]);

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
  const contactSupport = () => {
    window.open("mailto:support@yourdomain.com", "_blank");
  };
  const retryPage = () => {
    if (reset) {
      reset();
    } else {
      window.location.reload();
    }
  };

  // Error type configurations
  const errorConfig = {
    "404": {
      icon: "🔍",
      title: "الصفحة غير موجودة",
      description: "عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.",
      details: "قد يكون هناك خطأ في العنوان أو الصفحة تم إزالتها.",
      color: "yellow",
      actions: ["home", "back"],
    },
    "401": {
      icon: "🔐",
      title: "غير مصرح لك",
      description: "يبدو أنك تحاول الوصول إلى صفحة تتطلب تسجيل الدخول.",
      details: "الرجاء تسجيل الدخول أولاً للتمكن من متابعة الوصول.",
      color: "orange",
      actions: ["login", "back"],
    },

    "403": {
      icon: "⛔",
      title: "وصول مرفوض",
      description: "ليس لديك الصلاحيات الكافية للوصول إلى هذه الصفحة.",
      details: "إذا كنت تعتقد أن هناك خطأ، يرجى التواصل مع المسؤول.",
      color: "red",
      actions: ["home", "back"],
    },

    "500": {
      icon: "⚙️",
      title: "خطأ في الخادم",
      description: "عذراً، حدث خطأ داخلي في الخادم.",
      details:
        "فريقنا الفني على علم بالمشكلة ويعمل على إصلاحها. الرجاء المحاولة مرة أخرى لاحقاً.",
      color: "red",
      actions: ["retry", "home", "support"],
    },
    network: {
      icon: "📡",
      title: "مشكلة في الاتصال",
      description: "تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.",
      details: "قد تكون هناك مشكلة في الشبكة أو الخادم غير متاح حاليًا.",
      color: "blue",
      actions: ["retry", "home", "support"],
    },
    unknown: {
      icon: "❓",
      title: "حدث خطأ غير متوقع",
      description: "عذراً، حدث خطأ غير متوقع.",
      details: "نعمل على حل المشكلة. الرجاء المحاولة مرة أخرى.",
      color: "gray",
      actions: ["retry", "home", "support"],
    },
  };

  const config = errorConfig[errorType];

  return (
    <div
      className={`flex items-center justify-center min-h-screen p-4 transition-colors duration-300 ${
        config.color === "red"
          ? "bg-gradient-to-br from-red-50 to-orange-100"
          : config.color === "yellow"
          ? "bg-gradient-to-br from-yellow-50 to-amber-100"
          : config.color === "blue"
          ? "bg-gradient-to-br from-blue-50 to-cyan-100"
          : "bg-gradient-to-br from-gray-50 to-slate-100"
      }`}
    >
      <div className="bg-white shadow-2xl rounded-3xl p-8 md:p-12 text-center max-w-md w-full mx-auto border border-gray-200">
        {/* Animated Icon */}
        <div className="mb-6">
          <div
            className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center animate-pulse ${
              config.color === "red"
                ? "bg-red-100"
                : config.color === "yellow"
                ? "bg-yellow-100"
                : config.color === "blue"
                ? "bg-blue-100"
                : "bg-gray-100"
            }`}
          >
            <span className="text-3xl">{config.icon}</span>
          </div>
        </div>

        {/* Error Code Badge */}
        <div
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 ${
            config.color === "red"
              ? "bg-red-100 text-red-800"
              : config.color === "yellow"
              ? "bg-yellow-100 text-yellow-800"
              : config.color === "blue"
              ? "bg-blue-100 text-blue-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {errorType === "404"
            ? "خطأ 404"
            : errorType === "401"
            ? "خطأ 401"
            : errorType === "403"
            ? "خطأ 403"
            : errorType === "500"
            ? "خطأ 500"
            : errorType === "network"
            ? "خطأ اتصال"
            : "خطأ غير معروف"}
        </div>

        {/* Main Content */}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
          {config.title}
        </h1>

        <p className="text-gray-600 mb-2 text-lg leading-relaxed">
          {config.description}
        </p>

        <p className="text-gray-500 mb-6 text-sm">{config.details}</p>

        {/* Error Details (for developers) */}
        {error && process.env.NODE_ENV === "development" && (
          <details className="mb-6 text-left bg-gray-50 rounded-lg p-3">
            <summary className="cursor-pointer font-medium text-gray-700">
              تفاصيل التقنية (للتصحيح)
            </summary>
            <pre className="mt-2 text-xs text-gray-600 overflow-auto">
              {error.message}
              {error.digest && `\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}

        {/* Countdown Timer */}
        <div
          className={`border rounded-lg p-3 mb-6 ${
            config.color === "red"
              ? "bg-red-50 border-red-200"
              : config.color === "yellow"
              ? "bg-yellow-50 border-yellow-200"
              : config.color === "blue"
              ? "bg-blue-50 border-blue-200"
              : "bg-gray-50 border-gray-200"
          }`}
        >
          <p
            className={`text-sm font-medium ${
              config.color === "red"
                ? "text-red-700"
                : config.color === "yellow"
                ? "text-yellow-700"
                : config.color === "blue"
                ? "text-blue-700"
                : "text-gray-700"
            }`}
          >
            سيتم تحويلك تلقائياً إلى الصفحة الرئيسية خلال{" "}
            <span
              className={`font-bold text-lg ${
                config.color === "red"
                  ? "text-red-800"
                  : config.color === "yellow"
                  ? "text-yellow-800"
                  : config.color === "blue"
                  ? "text-blue-800"
                  : "text-gray-800"
              }`}
            >
              {countdown}
            </span>{" "}
            ثانية
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {config.actions.includes("retry") && (
            <button
              onClick={retryPage}
              className={`px-6 py-3 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 font-medium ${
                config.color === "red"
                  ? "bg-red-600 hover:bg-red-700"
                  : config.color === "yellow"
                  ? "bg-yellow-600 hover:bg-yellow-700"
                  : config.color === "blue"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-600 hover:bg-gray-700"
              } text-white`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              إعادة المحاولة
            </button>
          )}

          {config.actions.includes("home") && (
            <button
              onClick={goHome}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 font-medium"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              الصفحة الرئيسية
            </button>
          )}

          {config.actions.includes("back") && (
            <button
              onClick={goBack}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 font-medium"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              الرجوع للخلف
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
