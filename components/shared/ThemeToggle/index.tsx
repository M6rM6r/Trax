"use client";

import { Moon } from "lucide-react";

export default function ThemeToggle() {
  return (
    <button
      type="button"
      disabled
      className="w-9 h-9 rounded-lg flex items-center justify-center text-gray500 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
      aria-label="الوضع الداكن مفعل"
      title="الوضع الداكن مفعل"
    >
      <Moon className="w-5 h-5" />
    </button>
  );
}
