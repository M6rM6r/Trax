"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/shared/MainLayout";
import FullPageHead from "@/components/shared/FullPageHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Bell,
  Clock,
  MapPin,
  Zap,
  Building2,
  Save,
  Navigation,
  Timer,
  CalendarDays,
  Briefcase,
} from "lucide-react";
import { motion } from "framer-motion";
import { hapticTap, hapticSuccess, hapticError } from "@/lib/utils/haptics";
import { toastSuccess, toastError } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCompanySettingsStore } from "@/stores/useCompanySettingsStore";
import { useSaveCompanySettings } from "@/hooks/useApi";
import type { CompanySettings } from "@/lib/types/companySettings";

type TabId = "work" | "shifts" | "auto" | "notifications" | "session" | "geofence";

export default function CompanySettingsPage() {
  const { role } = useAuthStore();
  const settings = useCompanySettingsStore();
  const saveMutation = useSaveCompanySettings();
  const [activeTab, setActiveTab] = useState<TabId>("work");
  const [local, setLocal] = useState<CompanySettings | null>(null);

  useEffect(() => {
    if (settings.loaded) {
      const { loaded, setSettings, resetSettings, setLoaded, ...rest } = settings;
      void loaded;
      void setSettings;
      void resetSettings;
      void setLoaded;
      setLocal(rest as CompanySettings);
    }
  }, [settings.loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  if (role !== "boss" && role !== "manager") {
    return (
      <MainLayout>
        <div className="p-6 text-center">
          <p className="text-gray-500 dark:text-slate-400">هذه الصفحة متاحة للمشرفين فقط</p>
        </div>
      </MainLayout>
    );
  }

  if (!local) {
    return (
      <MainLayout>
        <div className="p-6 text-center">
          <p className="text-gray-500 dark:text-slate-400">جاري تحميل الإعدادات...</p>
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
      await saveMutation.mutateAsync(local);
      settings.setSettings(local);
      hapticSuccess();
      toastSuccess("تم حفظ إعدادات الشركة بنجاح");
    } catch (err) {
      console.error("[company-settings] save failed:", err);
      hapticError();
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg === "AUTH_EXPIRED") {
        toastError("انتهت الجلسة — يرجى تسجيل الدخول مرة أخرى");
      } else {
        toastError("فشل حفظ الإعدادات — حاول مرة أخرى");
      }
    }
  };

  const tabs: Array<{ id: TabId; label: string; icon: typeof Clock }> = [
    { id: "work", label: "ساعات العمل", icon: Clock },
    { id: "shifts", label: "أنواع الدوام", icon: Briefcase },
    { id: "auto", label: "الحضور التلقائي", icon: Navigation },
    { id: "notifications", label: "الإشعارات", icon: Bell },
    { id: "session", label: "الجلسة", icon: Timer },
    { id: "geofence", label: "النطاق الجغرافي", icon: MapPin },
  ];

  return (
    <MainLayout>
      <div className="p-6 space-y-6 min-h-screen">
        <FullPageHead
          head="إعدادات الشركة"
          description="تحكم كامل في إعدادات الحضور والإشعارات والنطاقات"
          Icon={<Building2 className="w-7 h-7" />}
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

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Work Hours Tab */}
          {activeTab === "work" && (
            <>
              <Card className="border-0 shadow-lg dark:bg-slate-800">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-900 dark:text-slate-100">
                      ساعات العمل
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 block">
                        وقت بدء العمل
                      </label>
                      <input
                        type="time"
                        value={local.workStartTime}
                        onChange={(e) => update("workStartTime", e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 block">
                        وقت انتهاء العمل
                      </label>
                      <input
                        type="time"
                        value={local.workEndTime}
                        onChange={(e) => update("workEndTime", e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 block">
                      فترة السماح (دقائق)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={60}
                      value={local.gracePeriodMinutes}
                      onChange={(e) => update("gracePeriodMinutes", Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100"
                    />
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                      عدد الدقائق بعد وقت بدء العمل قبل تسجيل التأخير
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 block">
                      حد التأخير (دقائق)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={local.lateThresholdMinutes}
                      onChange={(e) => update("lateThresholdMinutes", Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100"
                    />
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                      بعد هذا الحد يُعتبر الموظف متأخراً بشكل كبير
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 block">
                      أيام العطلة
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { day: 0, label: "الأحد" },
                        { day: 1, label: "الإثنين" },
                        { day: 2, label: "الثلاثاء" },
                        { day: 3, label: "الأربعاء" },
                        { day: 4, label: "الخميس" },
                        { day: 5, label: "الجمعة" },
                        { day: 6, label: "السبت" },
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
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300"
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

          {/* Shifts / Attendance Types Tab */}
          {activeTab === "shifts" && (
            <div className="space-y-6">
              <Card className="border-0 shadow-lg dark:bg-slate-800">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-white" />
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-900 dark:text-slate-100">
                      نوع الدوام الافتراضي
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 block">
                      نمط الحضور
                    </label>
                    <select
                      value={local.attendanceMode}
                      onChange={(e) =>
                        update("attendanceMode", e.target.value as typeof local.attendanceMode)
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100"
                    >
                      <option value="field">ميداني</option>
                      <option value="office_two_shift">مكتبي بفترتين</option>
                      <option value="hourly">بالساعة</option>
                    </select>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                      يحدد كيفية احتساب ساعات العمل والتأخير للموظفين الذين لا يملكون إعداداً خاصاً
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg dark:bg-slate-800">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-900 dark:text-slate-100">
                      {local.attendanceMode === "office_two_shift"
                        ? "فترات الدوام المكتبي"
                        : "الفترة الافتراضية للدوام"}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {local.attendanceMode === "office_two_shift" ? (
                    <>
                      <ShiftEditor
                        title="الفترة الصباحية"
                        shift={local.morningShift}
                        onChange={(shift) => update("morningShift", shift)}
                      />
                      <ShiftEditor
                        title="الفترة المسائية"
                        shift={local.eveningShift}
                        onChange={(shift) => update("eveningShift", shift)}
                      />
                    </>
                  ) : (
                    <ShiftEditor
                      title="الفترة الافتراضية"
                      shift={local.defaultShift}
                      onChange={(shift) => update("defaultShift", shift)}
                    />
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg dark:bg-slate-800">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
                      <CalendarDays className="w-5 h-5 text-white" />
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-900 dark:text-slate-100">
                      الدوام الموسمي (رمضان)
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                        تفعيل الدوام الموسمي تلقائياً
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                        يُطبق ساعات رمضان تلقائياً خلال الشهر الهجري التاسع
                      </p>
                    </div>
                    <Switch
                      checked={local.seasonalAttendanceEnabled}
                      onCheckedChange={() => {
                        hapticTap();
                        update("seasonalAttendanceEnabled", !local.seasonalAttendanceEnabled);
                      }}
                    />
                  </div>
                  {local.seasonalAttendanceEnabled && (
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 space-y-4">
                      <ShiftEditor
                        title="ساعات رمضان"
                        shift={local.seasonalShift}
                        onChange={(shift) => update("seasonalShift", shift)}
                      />
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        يتم احتساب التأخير والانصراف بناءً على هذه الفترة خلال رمضان فقط.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Auto Check-in Tab */}
          {activeTab === "auto" && (
            <Card className="border-0 shadow-lg dark:bg-slate-800">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                    <Navigation className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-slate-100">
                    الحضور التلقائي
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                      تفعيل الحضور التلقائي
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                      تسجيل الحضور تلقائياً عند دخول الموظف للنطاق الجغرافي
                    </p>
                  </div>
                  <Switch
                    checked={local.autoCheckInEnabled}
                    onCheckedChange={() => {
                      hapticTap();
                      update("autoCheckInEnabled", !local.autoCheckInEnabled);
                    }}
                  />
                </div>
                {local.autoCheckInEnabled && (
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 block">
                        مسافة التشغيل الإضافية (متر)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={500}
                        value={local.autoCheckInRadiusOffset}
                        onChange={(e) => update("autoCheckInRadiusOffset", Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100"
                      />
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                        مسافة إضافية بالأمتار خارج حدود النطاق لتفعيل الحضور التلقائي
                      </p>
                    </div>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        عند تفعيل هذه الميزة، سيتم تسجيل الحضور تلقائياً للموظف عند اقترابه من
                        النطاق الجغرافي المحدد له
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <Card className="border-0 shadow-lg dark:bg-slate-800">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-slate-100">
                    إعدادات الإشعارات
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                      تفعيل الإشعارات
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                      مفتاح رئيسي لجميع الإشعارات
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
                        title: "إشعارات التأخير",
                        desc: "تنبيه عند تأخر الموظف عن وقت الحضور",
                      },
                      {
                        key: "attendanceAlertsEnabled" as const,
                        title: "إشعارات الحضور",
                        desc: "تنبيه عند تسجيل الموظفين للحضور",
                      },
                      {
                        key: "geofenceBreachAlertsEnabled" as const,
                        title: "إشعارات الخروج من النطاق",
                        desc: "تنبيه عند خروج الموظف من النطاق الجغرافي",
                      },
                      {
                        key: "anomalyAlertsEnabled" as const,
                        title: "إشعارات الشذوذ",
                        desc: "تنبيه عند اكتشاف سلوك غير طبيعي",
                      },
                      {
                        key: "emailNotificationsEnabled" as const,
                        title: "إشعارات البريد الإلكتروني",
                        desc: "استلام الإشعارات عبر البريد",
                      },
                      {
                        key: "pushNotificationsEnabled" as const,
                        title: "إشعارات الدفع",
                        desc: "استلام إشعارات الدفع على الجوال",
                      },
                      {
                        key: "checkInReminderEnabled" as const,
                        title: "تذكير الحضور",
                        desc: "إرسال تذكير للموظفين قبل وقت الحضور",
                      },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                            {item.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                            {item.desc}
                          </p>
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
                    {local.checkInReminderEnabled && (
                      <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50">
                        <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 block">
                          وقت تذكير الحضور
                        </label>
                        <input
                          type="time"
                          value={local.checkInReminderTime}
                          onChange={(e) => update("checkInReminderTime", e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100"
                        />
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Session Tab */}
          {activeTab === "session" && (
            <Card className="border-0 shadow-lg dark:bg-slate-800">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
                    <Timer className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-slate-100">
                    إعدادات الجلسة
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 block">
                    مدة انتهاء الجلسة (دقائق)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={480}
                    value={local.sessionTimeoutMinutes}
                    onChange={(e) => update("sessionTimeoutMinutes", Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100"
                  />
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    يتم تسجيل الخروج تلقائياً بعد هذه المدة من عدم النشاط
                  </p>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                      تسجيل الانصراف التلقائي
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                      تسجيل انصراف تلقائي للموظفين بعد وقت محدد
                    </p>
                  </div>
                  <Switch
                    checked={local.autoSignOutEnabled}
                    onCheckedChange={() => {
                      hapticTap();
                      update("autoSignOutEnabled", !local.autoSignOutEnabled);
                    }}
                  />
                </div>
                {local.autoSignOutEnabled && (
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50">
                    <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 block">
                      وقت تسجيل الانصراف التلقائي
                    </label>
                    <input
                      type="time"
                      value={local.autoSignOutTime}
                      onChange={(e) => update("autoSignOutTime", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Geofence Tab */}
          {activeTab === "geofence" && (
            <Card className="border-0 shadow-lg dark:bg-slate-800">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-slate-100">
                    إعدادات النطاق الجغرافي
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                      اشتراط النطاق للحضور
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                      منع تسجيل الحضور خارج النطاق الجغرافي
                    </p>
                  </div>
                  <Switch
                    checked={local.requireGeofenceForCheckIn}
                    onCheckedChange={() => {
                      hapticTap();
                      update("requireGeofenceForCheckIn", !local.requireGeofenceForCheckIn);
                    }}
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                      السماح بالحضور خارج النطاق
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                      السماح للموظف بتسجيل الحضور حتى لو كان خارج النطاق
                    </p>
                  </div>
                  <Switch
                    checked={local.allowCheckInOutsideGeofence}
                    onCheckedChange={() => {
                      hapticTap();
                      update("allowCheckInOutsideGeofence", !local.allowCheckInOutsideGeofence);
                    }}
                  />
                </div>
              </CardContent>
            </Card>
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
            {saveMutation.isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}

type ShiftEditorValue = {
  startTime: string;
  endTime: string;
  gracePeriodMinutes: number;
  lateThresholdMinutes: number;
};

function ShiftEditor({
  title,
  shift,
  onChange,
}: {
  title: string;
  shift: ShiftEditorValue;
  onChange: (shift: ShiftEditorValue) => void;
}) {
  return (
    <div className="space-y-4 border-b border-gray-100 dark:border-slate-700 last:border-0 pb-4 last:pb-0">
      <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">{title}</p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-1 block">
            بدء العمل
          </label>
          <input
            type="time"
            value={shift.startTime}
            onChange={(e) => onChange({ ...shift, startTime: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-1 block">
            انتهاء العمل
          </label>
          <input
            type="time"
            value={shift.endTime}
            onChange={(e) => onChange({ ...shift, endTime: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-1 block">
            فترة السماح (دقائق)
          </label>
          <input
            type="number"
            min={0}
            max={120}
            value={shift.gracePeriodMinutes}
            onChange={(e) => onChange({ ...shift, gracePeriodMinutes: Number(e.target.value) })}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-1 block">
            حد التأخير (دقائق)
          </label>
          <input
            type="number"
            min={0}
            max={240}
            value={shift.lateThresholdMinutes}
            onChange={(e) => onChange({ ...shift, lateThresholdMinutes: Number(e.target.value) })}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100"
          />
        </div>
      </div>
    </div>
  );
}
