"use client";

import { Moon } from "lucide-react";
import { useTranslations } from "next-intl";

export default function ThemeToggle() {
  const t = useTranslations("Common.state");
  return (
    <button
      type="button"
      disabled
      className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
      aria-label={t("darkModeActive")}
      title={t("darkModeActive")}
    >
      <Moon className="w-5 h-5" />
    </button>
  );
}
