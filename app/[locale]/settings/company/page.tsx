"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import MainLayout from "@/components/shared/MainLayout";
import FullPageHead from "@/components/shared/FullPageHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Bell,
  Clock,
  Save,
  Navigation,
  Palette,
  Type,
  Check,
  Settings as SettingsIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { hapticTap, hapticSuccess, hapticError } from "@/lib/utils/haptics";
import { toastSuccess, toastError } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCompanySettingsStore } from "@/stores/useCompanySettingsStore";
import { useSaveCompanySettings } from "@/hooks/useApi";
import type { CompanySettings } from "@/lib/types/companySettings";
import {
  getEffectiveDefaultShift,
  parseTimeToMinutes,
  formatMinutesAsTime,
} from "@/lib/utils/shifts";

function getThemeColors(t: (key: string) => string) {
  return [
    { name: t("theme.blue"), value: "blue", color: "bg-[#3B82F6]" },
    { name: t("theme.green"), value: "green", color: "bg-[#22C55E]" },
    { name: t("theme.purple"), value: "purple", color: "bg-[#8B5CF6]" },
    { name: t("theme.orange"), value: "orange", color: "bg-[#F97316]" },
    { name: t("theme.pink"), value: "pink", color: "bg-[#EC4899]" },
    { name: t("theme.cyan"), value: "cyan", color: "bg-[#06B6D4]" },
  ];
}

function getFontSizes(t: (key: string) => string) {
  return [
    { name: t("theme.small"), value: "small", size: "text-sm" },
    { name: t("theme.medium"), value: "medium", size: "text-base" },
    { name: t("theme.large"), value: "large", size: "text-lg" },
  ];
}

const accentColorMap: Record<string, string> = {
  blue: "59 130 246",
  green: "34 197 94",
  purple: "168 85 247",
  orange: "249 115 22",
  pink: "236 72 153",
  cyan: "6 182 212",
};

const accentHslMap: Record<string, { primary: string; accent: string; ring: string }> = {
  blue: { primary: "217 91% 60%", accent: "217 91% 60%", ring: "217 91% 60%" },
  green: { primary: "142 71% 45%", accent: "142 71% 45%", ring: "142 71% 45%" },
  purple: { primary: "271 81% 56%", accent: "271 81% 56%", ring: "271 81% 56%" },
  orange: { primary: "25 95% 53%", accent: "25 95% 53%", ring: "25 95% 53%" },
  pink: { primary: "330 81% 60%", accent: "330 81% 60%", ring: "330 81% 60%" },
  cyan: { primary: "168 72% 40%", accent: "38 88% 55%", ring: "168 72% 40%" },
};

function applyAccentColor(colorKey: string) {
  const rgb = accentColorMap[colorKey];
  const hsl = accentHslMap[colorKey];
  if (!rgb || !hsl) return;
  const root = document.documentElement;
  root.style.setProperty("--accent-rgb", rgb);
  root.style.setProperty("--primary", hsl.primary);
  root.style.setProperty("--ring", hsl.ring);
  root.style.setProperty("--sidebar-primary", hsl.primary);
  root.style.setProperty("--sidebar-ring", hsl.ring);
  root.style.setProperty("--chart-1", hsl.primary);
}

const fontSizeMap: Record<string, string> = {
  small: "14px",
  medium: "16px",
  large: "18px",
};

export default function CompanySettingsPage() {
  const t = useTranslations("CompanySettings");
  const role = useAuthStore((s) => s.role);
  const loaded = useCompanySettingsStore((s) => s.loaded);
  const setSettings = useCompanySettingsStore((s) => s.setSettings);
  const saveMutation = useSaveCompanySettings();
  const [activeTab, setActiveTab] = useState<TabId>("work");
  const [local, setLocal] = useState<CompanySettings | null>(null);
  const [accentColor, setAccentColor] = useState("blue");
  const [fontSize, setFontSize] = useState("medium");

  // Initialize local state from store on mount and when loaded changes
  useEffect(() => {
    const snap = useCompanySettingsStore.getState();
    const { loaded: _l, setSettings: _ss, resetSettings: _rs, setLoaded: _sl, ...rest } = snap;
    void _l;
    void _ss;
    void _rs;
    void _sl;
    setLocal(rest as CompanySettings);
  }, []); // Run once on mount

  useEffect(() => {
    if (loaded) {
      const snap = useCompanySettingsStore.getState();
      const { loaded: _l, setSettings: _ss, resetSettings: _rs, setLoaded: _sl, ...rest } = snap;
      void _l;
      void _ss;
      void _rs;
      void _sl;
      setLocal(rest as CompanySettings);
    }
  }, [loaded]);

  useEffect(() => {
    const saved = localStorage.getItem("trax_settings");
    if (saved) {
      const parsed = JSON.parse(saved);
      const ac = parsed.accentColor || "blue";
      const fs = parsed.fontSize || "medium";
      setAccentColor(ac);
      setFontSize(fs);
      applyAccentColor(ac);
      document.documentElement.style.setProperty("--base-font-size", fontSizeMap[fs] || "16px");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (role !== "company") {
    return (
      <MainLayout>
        <div className="p-6 text-center">
          <p className="text-muted-foreground">{t("adminOnly")}</p>
        </div>
      </MainLayout>
    );
  }

  if (!local) {
    return (
      <MainLayout>
        <div className="p-6 text-center">
          <p className="text-muted-foreground">{t("loading")}</p>
        </div>
      </MainLayout>
    );
  }

  const update = <K extends keyof CompanySettings>(key: K, value: CompanySettings[K]) => {
    setLocal({ ...local, [key]: value });
  };

  const handleSave = async () => {
    hapticTap();
    try {
      const toSave = { ...local, defaultShift: getEffectiveDefaultShift(local) };
      await saveMutation.mutateAsync(toSave);
      setSettings(toSave);
      hapticSuccess();
      toastSuccess(t("saveSuccess"));
    } catch (err) {
      console.error("[company-settings] save failed:", err);
      hapticError();
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg === "AUTH_EXPIRED") {
        toastError(t("sessionExpired"));
      } else {
        toastError(t("saveFailed"));
      }
    }
  };

  const saveLocalSetting = (key: string, value: string) => {
    const saved = localStorage.getItem("trax_settings");
    const current = saved ? JSON.parse(saved) : {};
    current[key] = value;
    localStorage.setItem("trax_settings", JSON.stringify(current));
    if (key === "accentColor" && typeof value === "string") {
      applyAccentColor(value);
    }
    if (key === "fontSize" && typeof value === "string") {
      document.documentElement.style.setProperty("--base-font-size", fontSizeMap[value] || "16px");
    }
    hapticSuccess();
    toastSuccess(t("saved"));
  };

  const checkoutReferenceMinutes = (() => {
    const start = parseTimeToMinutes(local.workStartTime);
    const checkout = parseTimeToMinutes(local.checkoutStartTime);
    return Number.isFinite(start) && Number.isFinite(checkout) && checkout >= start
      ? checkout - start
      : 0;
  })();

  const handleCheckoutReferenceChange = (minutes: number) => {
    const start = parseTimeToMinutes(local.workStartTime);
    if (Number.isFinite(start)) {
      update("checkoutStartTime", formatMinutesAsTime(start + Math.max(0, minutes)));
    }
  };

  type TabId = "work" | "auto" | "notifications" | "appearance";

  const tabs: Array<{ id: TabId; label: string; icon: typeof Clock }> = [
    { id: "work", label: t("tabs.work"), icon: Clock },
    { id: "auto", label: t("tabs.auto"), icon: Navigation },
    { id: "notifications", label: t("tabs.notifications"), icon: Bell },
    { id: "appearance", label: t("tabs.appearance"), icon: Palette },
  ];

  return (
    <MainLayout>
      <div className="p-6 space-y-6 min-h-screen">
        <FullPageHead
          head={t("title")}
          description={t("description")}
          Icon={<SettingsIcon className="w-7 h-7" />}
        />

        {/* Tab Bar */}
        <div className="flex items-center gap-1 bg-muted rounded-xl p-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  hapticTap();
                  setActiveTab(tab.id);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-muted shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-muted-foreground dark:hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Work Hours Tab */}
          {activeTab === "work" && (
            <>
              <Card className="border-0 shadow-lg bg-card">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/50 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-lg font-bold text-foreground">
                      {t("work.title")}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        {t("work.startTime")}
                      </label>
                      <input
                        type="time"
                        value={local.workStartTime}
                        onChange={(e) => update("workStartTime", e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-foreground"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        {t("work.endTime")}
                      </label>
                      <input
                        type="time"
                        value={local.workEndTime}
                        onChange={(e) => update("workEndTime", e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-foreground"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        {t("work.gracePeriod")}
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={120}
                        value={local.gracePeriodMinutes}
                        onChange={(e) => update("gracePeriodMinutes", Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-foreground"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("work.gracePeriodHelper")}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        {t("work.checkoutReference")}
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={1440}
                        value={checkoutReferenceMinutes}
                        onChange={(e) => handleCheckoutReferenceChange(Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-foreground"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("work.checkoutReferenceHelper")}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      {t("work.weekendDays")}
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { day: 0, label: t("days.sunday") },
                        { day: 1, label: t("days.monday") },
                        { day: 2, label: t("days.tuesday") },
                        { day: 3, label: t("days.wednesday") },
                        { day: 4, label: t("days.thursday") },
                        { day: 5, label: t("days.friday") },
                        { day: 6, label: t("days.saturday") },
                      ].map((d) => (
                        <button
                          key={d.day}
                          onClick={() => {
                            hapticTap();
                            const days = local.weekendDays.includes(d.day)
                              ? local.weekendDays.filter((x) => x !== d.day)
                              : [...local.weekendDays, d.day];
                            update("weekendDays", days);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            local.weekendDays.includes(d.day)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Auto Check-in Tab */}
          {activeTab === "auto" && (
            <Card className="border-0 shadow-lg bg-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                    <Navigation className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-lg font-bold text-foreground">
                    {t("auto.title")}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <div>
                    <p className="text-sm font-medium text-foreground">{t("auto.enable")}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t("auto.enableHelper")}</p>
                  </div>
                  <Switch
                    checked={local.autoCheckInEnabled}
                    onCheckedChange={() => {
                      hapticTap();
                      update("autoCheckInEnabled", !local.autoCheckInEnabled);
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <>
              <Card className="border-0 shadow-lg bg-card">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[hsl(48_96%_53%/0.7)] flex items-center justify-center">
                      <Bell className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-lg font-bold text-foreground">
                      {t("notifications.title")}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {t("notifications.enable")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t("notifications.enableHelper")}
                      </p>
                    </div>
                    <Switch
                      checked={local.notificationsEnabled}
                      onCheckedChange={() => {
                        hapticTap();
                        update("notificationsEnabled", !local.notificationsEnabled);
                      }}
                    />
                  </div>
                  {local.notificationsEnabled && (
                    <>
                      {[
                        {
                          key: "lateAlertsEnabled" as const,
                          title: t("notifications.lateAlerts"),
                          desc: t("notifications.lateAlertsHelper"),
                        },
                        {
                          key: "attendanceAlertsEnabled" as const,
                          title: t("notifications.attendanceAlerts"),
                          desc: t("notifications.attendanceAlertsHelper"),
                        },
                        {
                          key: "checkoutAlertsEnabled" as const,
                          title: t("notifications.checkoutAlerts"),
                          desc: t("notifications.checkoutAlertsHelper"),
                        },
                      ].map((item) => (
                        <div
                          key={item.key}
                          className="flex items-center justify-between p-4 rounded-xl bg-muted/50"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">{item.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                          </div>
                          <Switch
                            checked={local[item.key]}
                            onCheckedChange={() => {
                              hapticTap();
                              update(item.key, !local[item.key]);
                            }}
                          />
                        </div>
                      ))}
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Appearance Tab */}
          {activeTab === "appearance" && (
            <div className="space-y-6">
              <Card className="border-0 shadow-lg bg-card">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-foreground">
                    {t("appearance.livePreview")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full h-24 rounded-xl overflow-hidden border border-border bg-background">
                    <div
                      className="absolute right-0 top-0 bottom-0 w-3"
                      style={{ backgroundColor: `rgb(${accentColorMap[accentColor]})` }}
                    />
                    <div className="absolute top-0 left-0 right-3 h-5 bg-muted" />
                    <div className="absolute top-8 right-5 left-3 space-y-2">
                      <div className="h-3 w-4/5 rounded-md bg-muted" />
                      <div className="h-3 w-3/5 rounded-md bg-muted" />
                      <div
                        className="h-4 w-16 rounded-lg"
                        style={{
                          backgroundColor: `rgb(${accentColorMap[accentColor]})`,
                          opacity: 0.8,
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-card">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-foreground">
                    {t("theme.color")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-6 gap-3">
                    {getThemeColors(t).map((color) => (
                      <button
                        key={color.value}
                        onClick={() => {
                          hapticTap();
                          setAccentColor(color.value);
                          saveLocalSetting("accentColor", color.value);
                        }}
                        title={color.name}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                          accentColor === color.value ? "scale-110" : "hover:scale-105"
                        }`}
                      >
                        <div
                          className={`relative w-8 h-8 rounded-full ${color.color} shadow-md ${
                            accentColor === color.value
                              ? "ring-2 ring-offset-2 ring-gray-900 dark:ring-background"
                              : ""
                          }`}
                        >
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 to-transparent" />
                        </div>
                        <span className="text-xs text-muted-foreground">{color.name}</span>
                        {accentColor === color.value && (
                          <Check className="w-3 h-3 text-foreground text-primary-foreground" />
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-card">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-foreground">
                    {t("theme.fontSize")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {getFontSizes(t).map((font) => (
                      <button
                        key={font.value}
                        onClick={() => {
                          hapticTap();
                          setFontSize(font.value);
                          saveLocalSetting("fontSize", font.value);
                        }}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          fontSize === font.value
                            ? "border-primary bg-primary/5"
                            : "border-input hover:border-input"
                        }`}
                      >
                        <Type
                          className={`w-5 h-5 ${fontSize === font.value ? "text-primary" : "text-muted-foreground/70"}`}
                        />
                        <span
                          className={`${font.size} ${fontSize === font.value ? "text-primary font-medium" : "text-muted-foreground"}`}
                        >
                          {font.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>

        {/* Save Button */}
        <div className="sticky bottom-4 z-10">
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="w-full h-12 text-base font-bold gap-2 shadow-xl"
          >
            <Save className="w-5 h-5" />
            {saveMutation.isPending ? t("saving") : t("save")}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
