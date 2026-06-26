"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="w-9 h-9 rounded-lg flex items-center justify-center text-gray500">
        <Sun className="w-5 h-5" />
      </button>
    );
  }

  const isDark = theme === "dark";

  const handleToggle = () => {
    setIsAnimating(true);
    setTheme(isDark ? "light" : "dark");
    setTimeout(() => setIsAnimating(false), 500);
  };

  return (
    <button
      onClick={handleToggle}
      className="w-9 h-9 rounded-lg flex items-center justify-center text-gray500 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
      aria-label={isDark ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}
    >
      {isDark ? (
        <Sun className={`w-5 h-5 ${isAnimating ? "animate-theme-toggle" : ""}`} />
      ) : (
        <Moon className={`w-5 h-5 ${isAnimating ? "animate-theme-toggle" : ""}`} />
      )}
    </button>
  );
}
