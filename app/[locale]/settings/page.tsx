"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import MainLayout from "@/components/shared/MainLayout";
import FullPageHead from "@/components/shared/FullPageHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Shield,
  Bell,
  Settings as SettingsIcon,
  Palette,
  Sun,
  Moon,
  Monitor,
  Type,
  Globe,
  Clock,
  Calendar,
  UserCheck,
  MapPin,
  Mail,
  Smartphone,
  Check,
  Zap,
  User,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { hapticTap, hapticSuccess } from "@/lib/utils/haptics";
import { toastSuccess } from "@/hooks/use-toast";
import AvatarUpload from "@/components/shared/AvatarUpload";
import { useAuthStore } from "@/stores/useAuthStore";
import { Switch } from "@/components/ui/switch";

type TabId = "profile" | "general" | "appearance" | "notifications" | "security";

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
  { name: "أزرق", value: "blue", color: "bg-blue-500" },
  { name: "أخضر", value: "green", color: "bg-green-500" },
  { name: "بنفسجي", value: "purple", color: "bg-purple-500" },
  { name: "برتقالي", value: "orange", color: "bg-orange-500" },
  { name: "وردي", value: "pink", color: "bg-pink-500" },
  { name: "سماوي", value: "cyan", color: "bg-cyan-500" },
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

const fontSizeMap: Record<string, string> = {
  small: "14px",
  medium: "16px",
  large: "18px",
};

export default function SettingsPage() {
  const { setTheme } = useTheme();
  const { user, companyName } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [themeMode, setThemeMode] = useState<string>("system");
  const [accentColor, setAccentColor] = useState<string>("blue");
  const [fontSize, setFontSize] = useState<string>("medium");
  const [reduceMotion, setReduceMotion] = useState(false);
  const [language, setLanguage] = useState("ar");
  const [timezone, setTimezone] = useState("Asia/Riyadh");
  const [dateFormat, setDateFormat] = useState("gregorian");
  // Notification states
  const [attendanceAlerts, setAttendanceAlerts] = useState(true);
  const [lateAlerts, setLateAlerts] = useState(true);
  const [geofenceExitAlerts, setGeofenceExitAlerts] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [anomalyAlerts, setAnomalyAlerts] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("trax_settings");
    if (saved) {
      const parsed = JSON.parse(saved);
      const tm = parsed.themeMode || "system";
      const ac = parsed.accentColor || "blue";
      const fs = parsed.fontSize || "medium";
      const rm = parsed.reduceMotion || false;
      setThemeMode(tm);
      setAccentColor(ac);
      setFontSize(fs);
      setReduceMotion(rm);
      setLanguage(parsed.language || "ar");
      setTimezone(parsed.timezone || "Asia/Riyadh");
      setDateFormat(parsed.dateFormat || "gregorian");
      setTheme(tm);
      if (accentColorMap[ac])
        document.documentElement.style.setProperty("--accent-rgb", accentColorMap[ac]);
      document.documentElement.style.setProperty("--base-font-size", fontSizeMap[fs] || "16px");
      document.documentElement.classList.toggle("reduce-motion", rm);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveSettings = (key: string, value: string | boolean) => {
    const saved = localStorage.getItem("trax_settings");
    const current = saved ? JSON.parse(saved) : {};
    current[key] = value;
    localStorage.setItem("trax_settings", JSON.stringify(current));
    if (key === "themeMode") setTheme(value as string);
    if (key === "accentColor" && accentColorMap[value as string]) {
      document.documentElement.style.setProperty("--accent-rgb", accentColorMap[value as string]);
    }
    if (key === "fontSize") {
      document.documentElement.style.setProperty(
        "--base-font-size",
        fontSizeMap[value as string] || "16px"
      );
    }
    if (key === "reduceMotion") {
      document.documentElement.classList.toggle("reduce-motion", value as boolean);
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
    {
      icon: Shield,
      title: "إشعارات كشف الشذوذ",
      description: "تنبيه عند اكتشاف سلوك غير طبيعي",
      enabled: anomalyAlerts,
      onToggle: () => {
        setAnomalyAlerts(!anomalyAlerts);
        saveSettings("anomalyAlerts", !anomalyAlerts);
      },
    },
    {
      icon: Mail,
      title: "إشعارات البريد الإلكتروني",
      description: "استلام الإشعارات عبر البريد الإلكتروني",
      enabled: emailNotifications,
      onToggle: () => {
        setEmailNotifications(!emailNotifications);
        saveSettings("emailNotifications", !emailNotifications);
      },
    },
    {
      icon: Smartphone,
      title: "إشعارات الدفع",
      description: "استلام إشعارات الدفع على الجوال",
      enabled: pushNotifications,
      onToggle: () => {
        setPushNotifications(!pushNotifications);
        saveSettings("pushNotifications", !pushNotifications);
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
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 rounded-xl p-1 overflow-x-auto">
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
                    ? "bg-white dark:bg-slate-700 shadow-sm text-gray-900 dark:text-slate-100"
                    : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
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
              <Card className="border-0 shadow-lg dark:bg-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-slate-100">
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
                    <p className="font-semibold text-gray-900 dark:text-slate-100">
                      {user?.name ?? "المستخدم"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">{user?.email}</p>
                    {companyName && (
                      <span className="inline-block mt-2 text-xs px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium">
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
              <Card className="border-0 shadow-lg dark:bg-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-slate-100">
                    الإعدادات العامة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                          اللغة
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">لغة الواجهة</p>
                      </div>
                    </div>
                    <select
                      value={language}
                      onChange={(e) => {
                        setLanguage(e.target.value);
                        saveSettings("language", e.target.value);
                      }}
                      className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100"
                    >
                      <option value="ar">العربية</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                          المنطقة الزمنية
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">التوقيت المحلي</p>
                      </div>
                    </div>
                    <select
                      value={timezone}
                      onChange={(e) => {
                        setTimezone(e.target.value);
                        saveSettings("timezone", e.target.value);
                      }}
                      className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100"
                    >
                      <option value="Asia/Riyadh">الرياض</option>
                      <option value="Asia/Dubai">دبي</option>
                      <option value="Asia/Kuwait">الكويت</option>
                      <option value="Asia/Qatar">الدوحة</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                          تنسيق التاريخ
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">ميلادي أو هجري</p>
                      </div>
                    </div>
                    <select
                      value={dateFormat}
                      onChange={(e) => {
                        setDateFormat(e.target.value);
                        saveSettings("dateFormat", e.target.value);
                      }}
                      className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100"
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
              <Card className="border-0 shadow-lg dark:bg-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-slate-100">
                    وضع المظهر
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: "light", label: "فاتح", icon: Sun },
                      { value: "dark", label: "داكن", icon: Moon },
                      { value: "system", label: "النظام", icon: Monitor },
                    ].map((mode) => {
                      const Icon = mode.icon;
                      return (
                        <button
                          key={mode.value}
                          onClick={() => {
                            hapticTap();
                            setThemeMode(mode.value);
                            saveSettings("themeMode", mode.value);
                          }}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                            themeMode === mode.value
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                              : "border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500"
                          }`}
                        >
                          <Icon
                            className={`w-6 h-6 ${themeMode === mode.value ? "text-blue-600 dark:text-blue-400" : "text-gray-400"}`}
                          />
                          <span
                            className={`text-sm font-medium ${themeMode === mode.value ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-slate-300"}`}
                          >
                            {mode.label}
                          </span>
                          {themeMode === mode.value && <Check className="w-4 h-4 text-blue-500" />}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Live Preview */}
              <Card className="border-0 shadow-lg dark:bg-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-slate-100">
                    معاينة مباشرة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`relative w-full h-24 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 ${
                      themeMode === "dark"
                        ? "bg-slate-900"
                        : themeMode === "light"
                          ? "bg-white"
                          : "bg-gray-50 dark:bg-slate-900"
                    }`}
                  >
                    {/* Fake sidebar strip */}
                    <div
                      className="absolute right-0 top-0 bottom-0 w-3"
                      style={{ backgroundColor: `rgb(${accentColorMap[accentColor]})` }}
                    />
                    {/* Fake header bar */}
                    <div
                      className={`absolute top-0 left-0 right-3 h-5 ${
                        themeMode === "dark" ? "bg-slate-700" : "bg-gray-100"
                      }`}
                    />
                    {/* Fake content rows */}
                    <div className="absolute top-8 right-5 left-3 space-y-2">
                      <div
                        className={`h-3 w-4/5 rounded-md ${
                          themeMode === "dark" ? "bg-slate-700" : "bg-gray-200"
                        }`}
                      />
                      <div
                        className={`h-3 w-3/5 rounded-md ${
                          themeMode === "dark" ? "bg-slate-600" : "bg-gray-100"
                        }`}
                      />
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

              <Card className="border-0 shadow-lg dark:bg-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-slate-100">
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
                              ? "ring-2 ring-offset-2 ring-gray-900 dark:ring-white"
                              : ""
                          }`}
                        >
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 to-transparent" />
                        </div>
                        <span className="text-xs text-gray-600 dark:text-slate-300">
                          {color.name}
                        </span>
                        {accentColor === color.value && (
                          <Check className="w-3 h-3 text-gray-900 dark:text-white" />
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg dark:bg-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-slate-100">
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
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500"
                        }`}
                      >
                        <Type
                          className={`w-5 h-5 ${fontSize === font.value ? "text-blue-600 dark:text-blue-400" : "text-gray-400"}`}
                        />
                        <span
                          className={`${font.size} ${fontSize === font.value ? "text-blue-600 dark:text-blue-400 font-medium" : "text-gray-600 dark:text-slate-300"}`}
                        >
                          {font.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg dark:bg-slate-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                          تقليل الحركة
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                          تقليل الرسوم المتحركة
                        </p>
                      </div>
                    </div>
                    <ToggleSwitch
                      enabled={reduceMotion}
                      onChange={() => {
                        setReduceMotion(!reduceMotion);
                        saveSettings("reduceMotion", !reduceMotion);
                      }}
                    />
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
              <Card className="border-0 shadow-lg dark:bg-slate-800">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-900 dark:text-slate-100">
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
                        className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                            <Icon className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                              {item.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
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
              <Card className="border-0 shadow-lg dark:bg-slate-800">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-900 dark:text-slate-100">
                      إعدادات الأمان
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Link
                    href="settings/securitySettings"
                    className="block p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                          المصادقة الثنائية
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                          تعزيز أمان الحساب
                        </p>
                      </div>
                      <span className="text-xs text-blue-600 dark:text-blue-400">إدارة →</span>
                    </div>
                  </Link>
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50">
                    <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                      كلمة المرور
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 mb-3">
                      تغيير كلمة المرور
                    </p>
                    <button className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
                      تغيير كلمة المرور
                    </button>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50">
                    <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                      جلسات نشطة
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 mb-3">
                      إدارة الأجهزة المتصلة
                    </p>
                    <button className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors">
                      تسجيل الخروج من جميع الأجهزة
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
}
