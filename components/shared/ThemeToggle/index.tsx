"use client";

import { Moon } from "lucide-react";

export default function ThemeToggle() {
  return (
    <button
      type="button"
      disabled
      className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
      aria-label="الوضع الداكن مفعل"
      title="الوضع الداكن مفعل"
    >
      <Moon className="w-5 h-5" />
    </button>
  );
}
