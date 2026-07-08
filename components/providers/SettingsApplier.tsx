"use client";

import { useEffect } from "react";

const ACCENT_MAP: Record<string, string> = {
  blue: "59 130 246",
  purple: "139 92 246",
  green: "34 197 94",
  orange: "249 115 22",
  red: "239 68 68",
  pink: "236 72 153",
};

const FONT_SIZE_MAP: Record<string, string> = {
  small: "14px",
  medium: "16px",
  large: "18px",
  "x-large": "20px",
};

export default function SettingsApplier() {
  useEffect(() => {
    try {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
      document.documentElement.style.colorScheme = "dark";

      const raw = localStorage.getItem("trax_settings");
      if (!raw) return;
      const s = JSON.parse(raw);

      if (s.accentColor && ACCENT_MAP[s.accentColor]) {
        document.documentElement.style.setProperty("--accent-rgb", ACCENT_MAP[s.accentColor]);
      }

      if (s.fontSize && FONT_SIZE_MAP[s.fontSize]) {
        document.documentElement.style.setProperty("--base-font-size", FONT_SIZE_MAP[s.fontSize]);
      }

      if (s.reduceMotion) {
        document.documentElement.classList.add("reduce-motion");
      } else {
        document.documentElement.classList.remove("reduce-motion");
      }
    } catch {}
  }, []);

  return null;
}
