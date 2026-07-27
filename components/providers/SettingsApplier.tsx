"use client";

import { useEffect } from "react";

const ACCENT_RGB: Record<string, string> = {
  blue: "59 130 246",
  green: "34 197 94",
  purple: "168 85 247",
  orange: "249 115 22",
  pink: "236 72 153",
  cyan: "6 182 212",
};

const ACCENT_HSL: Record<string, { primary: string; accent: string; ring: string }> = {
  blue:   { primary: "217 91% 60%",  accent: "217 91% 60%",  ring: "217 91% 60%" },
  green:  { primary: "142 71% 45%",  accent: "142 71% 45%",  ring: "142 71% 45%" },
  purple: { primary: "271 81% 56%",  accent: "271 81% 56%",  ring: "271 81% 56%" },
  orange: { primary: "25 95% 53%",   accent: "25 95% 53%",   ring: "25 95% 53%" },
  pink:   { primary: "330 81% 60%",  accent: "330 81% 60%",  ring: "330 81% 60%" },
  cyan:   { primary: "168 72% 40%",  accent: "38 88% 55%",   ring: "168 72% 40%" },
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

      if (s.accentColor) {
        const rgb = ACCENT_RGB[s.accentColor];
        const hsl = ACCENT_HSL[s.accentColor];
        if (rgb) document.documentElement.style.setProperty("--accent-rgb", rgb);
        if (hsl) {
          const root = document.documentElement;
          root.style.setProperty("--primary", hsl.primary);
          root.style.setProperty("--ring", hsl.ring);
          root.style.setProperty("--sidebar-primary", hsl.primary);
          root.style.setProperty("--sidebar-ring", hsl.ring);
          root.style.setProperty("--chart-1", hsl.primary);
        }
      }

      if (s.fontSize && FONT_SIZE_MAP[s.fontSize]) {
        document.documentElement.style.setProperty("--base-font-size", FONT_SIZE_MAP[s.fontSize]);
      }
    } catch {}
  }, []);

  return null;
}
