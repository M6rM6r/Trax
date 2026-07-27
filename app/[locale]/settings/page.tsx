"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/shared/MainLayout";
import FullPageHead from "@/components/shared/FullPageHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Shield,
  Bell,
  Settings as SettingsIcon,
  Palette,
  Type,
  Globe,
  Clock,
  UserCheck,
  MapPin,
  User,
  Building2,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { hapticTap, hapticSuccess } from "@/lib/utils/haptics";
import { toastSuccess } from "@/hooks/use-toast";
import AvatarUpload from "@/components/shared/AvatarUpload";
import { useAuthStore } from "@/stores/useAuthStore";
import { Switch } from "@/components/ui/switch";

type TabId = "profile" | "general" | "appearance" | "notifications" | "security" | "company";

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <Switch
      checked={enabled}
      onCheckedChange={() => {
        hapticTap();
        onChange();
      }}
    />
  );
}

const themeColors = [
  { name: "أزرق", value: "blue", color: "bg-[#3B82F6]" },
  { name: "أخضر", value: "green", color: "bg-[#22C55E]" },
  { name: "بنفسجي", value: "purple", color: "bg-[#8B5CF6]" },
  { name: "برتقالي", value: "orange", color: "bg-[#F97316]" },
  { name: "وردي", value: "pink", color: "bg-[#EC4899]" },
  { name: "سماوي", value: "cyan", color: "bg-[#06B6D4]" },
];

const fontSizes = [
  { name: "صغير", value: "small", size: "text-sm" },
  { name: "متوسط", value: "medium", size: "text-base" },
  { name: "كبير", value: "large", size: "text-lg" },
];

const accentColorMap: Record<string, string> = {
  blue: "59 130 246",
  green: "34 197 94",
  purple: "168 85 247",
  orange: "249 115 22",
  pink: "236 72 153",
  cyan: "6 182 212",
};

const accentHslMap: Record<string, { primary: string; accent: string; ring: string }> = {
  blue:   { primary: "217 91% 60%",  accent: "217 91% 60%",  ring: "217 91% 60%" },
  green:  { primary: "142 71% 45%",  accent: "142 71% 45%",  ring: "142 71% 45%" },
  purple: { primary: "271 81% 56%",  accent: "271 81% 56%",  ring: "271 81% 56%" },
  orange: { primary: "25 95% 53%",   accent: "25 95% 53%",   ring: "25 95% 53%" },
  pink:   { primary: "330 81% 60%",  accent: "330 81% 60%",  ring: "330 81% 60%" },
  cyan:   { primary: "168 72% 40%",  accent: "38 88% 55%",   ring: "168 72% 40%" },
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

export default function SettingsPage() {
  const { user, companyName, role } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [accentColor, setAccentColor] = useState<string>("blue");
  const [fontSize, setFontSize] = useState<string>("medium");
  const [language, setLanguage] = useState("ar");
  const [timezone, setTimezone] = useState("Asia/Riyadh");
  const [dateFormat, setDateFormat] = useState("gregorian");
  // Notification states
  const [attendanceAlerts, setAttendanceAlerts] = useState(true);
  const [lateAlerts, setLateAlerts] = useState(true);
  const [geofenceExitAlerts, setGeofenceExitAlerts] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("trax_settings");
    if (saved) {
      const parsed = JSON.parse(saved);
      const ac = parsed.accentColor || "blue";
      const fs = parsed.fontSize || "medium";
      setAccentColor(ac);
      setFontSize(fs);
      setLanguage(parsed.language || "ar");
      setTimezone(parsed.timezone || "Asia/Riyadh");
      setDateFormat(parsed.dateFormat || "gregorian");
      applyAccentColor(ac);
      document.documentElement.style.setProperty("--base-font-size", fontSizeMap[fs] || "16px");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveSettings = (key: string, value: string | boolean) => {
    const saved = localStorage.getItem("trax_settings");
    const current = saved ? JSON.parse(saved) : {};
    current[key] = value;
    localStorage.setItem("trax_settings", JSON.stringify(current));
    if (key === "accentColor") {
      applyAccentColor(value as string);
    }
    if (key === "fontSize") {
      document.documentElement.style.setProperty(
        "--base-font-size",
        fontSizeMap[value as string] || "16px"
      );
    }
    hapticSuccess();
    toastSuccess("تم حفظ الإعدادات");
  };

  const tabs: Array<{ id: TabId; label: string; icon: typeof SettingsIcon }> = [
    { id: "profile", label: "الملف الشخصي", icon: User },
    { id: "general", label: "عام", icon: SettingsIcon },
    { id: "appearance", label: "المظهر", icon: Palette },
    { id: "notifications", label: "الإشعارات", icon: Bell },
    { id: "security", label: "الأمان", icon: Shield },
    ...(role === "boss" || role === "manager"
      ? [{ id: "company" as TabId, label: "الشركة", icon: Building2 }]
      : []),
  ];

  const notificationItems = [
    {
      icon: UserCheck,
      title: "إشعارات الحضور",
      description: "تنبيه عند تسجيل الموظفين للحضور",
      enabled: attendanceAlerts,
      onToggle: () => {
        setAttendanceAlerts(!attendanceAlerts);
        saveSettings("attendanceAlerts", !attendanceAlerts);
      },
    },
    {
      icon: Clock,
      title: "إشعارات التأخير",
      description: "تنبيه عند تأخر الموظف عن وقت الحضور",
      enabled: lateAlerts,
      onToggle: () => {
        setLateAlerts(!lateAlerts);
        saveSettings("lateAlerts", !lateAlerts);
      },
    },
    {
      icon: MapPin,
      title: "إشعارات الخروج من النطاق",
      description: "تنبيه عند خروج الموظف من النطاق الجغرافي",
      enabled: geofenceExitAlerts,
      onToggle: () => {
        setGeofenceExitAlerts(!geofenceExitAlerts);
        saveSettings("geofenceExitAlerts", !geofenceExitAlerts);
      },
    },
  ];

  return (
    <MainLayout>
      <div className="p-6 space-y-6 min-h-screen">
        <FullPageHead
          head="الإعدادات"
          description="إدارة إعدادات النظام والتكوين"
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

        <AnimatePresence mode="wait">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <Card className="border-0 shadow-lg bg-card">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-foreground">
                    صورة الملف الشخصي
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6 pb-8">
                  <AvatarUpload
                    currentUrl={user?.profile_image || null}
                    name={user?.name ?? "U"}
                    size={120}
                    shape="circle"
                  />
                  <div className="text-center">
                    <p className="font-semibold text-foreground">
                      {user?.name ?? "المستخدم"}
                    </p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    {companyName && (
                      <span className="inline-block mt-2 text-xs px-3 py-1 rounded-full bg-primary/10 text-primary/70 font-medium">
                        {companyName}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* General Tab */}
          {activeTab === "general" && (
            <motion.div
              key="general"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card className="border-0 shadow-lg bg-card">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-foreground">
                    الإعدادات العامة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 bg-primary/10 flex items-center justify-center">
                        <Globe className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          اللغة
                        </p>
                        <p className="text-xs text-muted-foreground">لغة الواجهة</p>
                      </div>
                    </div>
                    <select
                      value={language}
                      onChange={(e) => {
                        setLanguage(e.target.value);
                        saveSettings("language", e.target.value);
                      }}
                      className="px-3 py-2 rounded-lg border border-border border-input bg-background text-sm text-foreground"
                    >
                      <option value="ar">العربية</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          المنطقة الزمنية
                        </p>
                        <p className="text-xs text-muted-foreground">التوقيت المحلي</p>
                      </div>
                    </div>
                    <select
                      value={timezone}
                      onChange={(e) => {
                        setTimezone(e.target.value);
                        saveSettings("timezone", e.target.value);
                      }}
                      className="px-3 py-2 rounded-lg border border-border border-input bg-background text-sm text-foreground"
                    >
                      <option value="Asia/Riyadh">الرياض</option>
                      <option value="Asia/Dubai">دبي</option>
                      <option value="Asia/Kuwait">الكويت</option>
                      <option value="Asia/Qatar">الدوحة</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-accent/15 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-accent-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          تنسيق التاريخ
                        </p>
                        <p className="text-xs text-muted-foreground">ميلادي أو هجري</p>
                      </div>
                    </div>
                    <select
                      value={dateFormat}
                      onChange={(e) => {
                        setDateFormat(e.target.value);
                        saveSettings("dateFormat", e.target.value);
                      }}
                      className="px-3 py-2 rounded-lg border border-border border-input bg-background text-sm text-foreground"
                    >
                      <option value="gregorian">ميلادي</option>
                      <option value="hijri">هجري</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Appearance Tab */}
          {activeTab === "appearance" && (
            <motion.div
              key="appearance"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Live Preview */}
              <Card className="border-0 shadow-lg bg-card">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-foreground">
                    معاينة مباشرة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full h-24 rounded-xl overflow-hidden border border-border bg-background">
                    {/* Fake sidebar strip */}
                    <div
                      className="absolute right-0 top-0 bottom-0 w-3"
                      style={{ backgroundColor: `rgb(${accentColorMap[accentColor]})` }}
                    />
                    {/* Fake header bar */}
                    <div className="absolute top-0 left-0 right-3 h-5 bg-muted" />
                    {/* Fake content rows */}
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
                    اللون المميز
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-6 gap-3">
                    {themeColors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => {
                          hapticTap();
                          setAccentColor(color.value);
                          saveSettings("accentColor", color.value);
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
                        <span className="text-xs text-muted-foreground">
                          {color.name}
                        </span>
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
                    حجم الخط
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {fontSizes.map((font) => (
                      <button
                        key={font.value}
                        onClick={() => {
                          hapticTap();
                          setFontSize(font.value);
                          saveSettings("fontSize", font.value);
                        }}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          fontSize === font.value
                            ? "border-primary bg-primary/5"
                            : "border-border border-input hover:border-input hover:border-input"
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

            </motion.div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card className="border-0 shadow-lg bg-card">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg font-bold text-foreground">
                      أنواع الإشعارات
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {notificationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.title}
                        className="flex items-center justify-between p-4 rounded-xl bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-card flex items-center justify-center shadow-sm">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {item.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <ToggleSwitch enabled={item.enabled} onChange={item.onToggle} />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <motion.div
              key="security"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card className="border-0 shadow-lg bg-card">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-destructive flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-lg font-bold text-foreground">
                      إعدادات الأمان
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-sm font-medium text-foreground">
                      كلمة المرور
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                      تغيير كلمة المرور
                    </p>
                    <button className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                      تغيير كلمة المرور
                    </button>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-sm font-medium text-foreground">
                      جلسات نشطة
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                      إدارة الأجهزة المتصلة
                    </p>
                    <button className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors">
                      تسجيل الخروج من جميع الأجهزة
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Company Tab */}
          {activeTab === "company" && (
            <motion.div
              key="company"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card className="border-0 shadow-lg bg-card">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/50 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-lg font-bold text-foreground">
                      إعدادات الشركة
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Link
                    href="settings/company"
                    className="block p-4 rounded-xl bg-muted/50 hover:bg-muted hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          التحكم الكامل في الشركة
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          ساعات العمل، الحضور التلقائي، الإشعارات، الجلسة، النطاق الجغرافي
                        </p>
                      </div>
                      <span className="text-xs text-primary">إدارة →</span>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
}
