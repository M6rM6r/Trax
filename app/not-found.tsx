"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();
  const [countdown, setCountdown] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
    setCountdown(20);
  }, []);

  // Countdown for automatic redirect
  useEffect(() => {
    if (!mounted || countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      router.push("/");
    }
  }, [countdown, router, mounted]);

  const goHome = () => router.push("/");
  const goBack = () => router.back();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-muted to-muted/50 p-4 transition-colors duration-300">
      <div className="bg-card shadow-2xl rounded-3xl p-8 md:p-12 text-center max-w-md w-full mx-auto border border-border">
        {/* Animated Icon */}
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-[hsl(48_96%_53%/0.15)] dark:bg-[hsl(48_96%_53%/0.15)] rounded-full flex items-center justify-center animate-pulse">
            <svg
              className="w-12 h-12 text-[hsl(48_96%_53%)]"
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
        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 bg-[hsl(48_96%_53%/0.15)] dark:bg-[hsl(48_96%_53%/0.15)] text-[hsl(48_96%_53%)]">
          خطأ 404 - الصفحة غير موجودة
        </div>

        {/* Main Content */}
        <h1 className="text-2xl md:text-3xl font-bold text-foreground text-foreground mb-4">
          🗺️ الصفحة غير موجودة
        </h1>

        <p className="text-muted-foreground mb-3 text-lg leading-relaxed">
          عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها.
        </p>

        <p className="text-muted-foreground mb-6 text-sm">
          قد يكون هناك خطأ في العنوان، أو الصفحة تم نقلها أو إزالتها.
        </p>

        {/* Suggestions */}
        <div className="bg-primary/5 border border-primary/20 border-primary/30 rounded-lg p-4 mb-6 text-right">
          <h3 className="text-primary text-primary font-semibold mb-2">💡 اقتراحات:</h3>
          <ul className="text-primary text-primary/70 text-sm space-y-1">
            <li>• تأكد من كتابة العنوان بشكل صحيح</li>
            <li>• استخدم زر الرجوع للعودة للصفحة السابقة</li>
            <li>• انتقل للصفحة الرئيسية واستكشف الموقع</li>
            <li>• استخدم خاصية البحث للعثور على ما تريد</li>
          </ul>
        </div>

        {/* Countdown Timer */}
        <div className="bg-[hsl(48_96%_53%/0.1)] dark:bg-[hsl(48_96%_53%/0.1)] border border-[hsl(48_96%_53%/0.2)] dark:border-[hsl(48_96%_53%/0.3)] rounded-lg p-3 mb-6">
          <p className="text-[hsl(48_96%_53%)] text-sm font-medium">
            سيتم تحويلك تلقائياً إلى الصفحة الرئيسية خلال{" "}
            <span className="font-bold text-[hsl(48_96%_53%)] text-lg">
              {countdown}
            </span>{" "}
            ثانية
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={goHome}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            الصفحة الرئيسية
          </button>

          <button
            onClick={goBack}
            className="bg-gray-600 hover:bg-gray-700 text-primary-foreground px-6 py-3 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            الرجوع للخلف
          </button>
        </div>

        {/* Current Path Info */}
        <div className="mt-6">
          <p className="text-xs text-muted-foreground/70">
            المسار الحالي: {typeof window !== "undefined" ? window.location.pathname : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
