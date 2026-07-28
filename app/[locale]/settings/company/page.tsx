"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/shared/MainLayout";
import FullPageHead from "@/components/shared/FullPageHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Bell, Clock, MapPin, Zap, Building2, Save, Navigation, Timer } from "lucide-react";
import { motion } from "framer-motion";
import { hapticTap, hapticSuccess, hapticError } from "@/lib/utils/haptics";
import { toastSuccess, toastError } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCompanySettingsStore } from "@/stores/useCompanySettingsStore";
import { useSaveCompanySettings } from "@/hooks/useApi";
import type { CompanySettings } from "@/lib/types/companySettings";

type TabId = "work" | "auto" | "notifications" | "session" | "geofence";

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

  if (role !== "company") {
    return (
      <MainLayout>
        <div className="p-6 text-center">
          <p className="text-muted-foreground">هذه الصفحة متاحة للمشرفين فقط</p>
        </div>
      </MainLayout>
    );
  }

  if (!local) {
    return (
      <MainLayout>
        <div className="p-6 text-center">
          <p className="text-muted-foreground">جاري تحميل الإعدادات...</p>
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
                    <CardTitle className="text-lg font-bold text-foreground">ساعات العمل</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        وقت بدء العمل
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
                        وقت انتهاء العمل
                      </label>
                      <input
                        type="time"
                        value={local.workEndTime}
                        onChange={(e) => update("workEndTime", e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-foreground"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      فترة السماح (دقائق)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={60}
                      value={local.gracePeriodMinutes}
                      onChange={(e) => update("gracePeriodMinutes", Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-foreground"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      عدد الدقائق بعد وقت بدء العمل قبل تسجيل التأخير
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      حد التأخير (دقائق)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={local.lateThresholdMinutes}
                      onChange={(e) => update("lateThresholdMinutes", Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-foreground"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      بعد هذا الحد يُعتبر الموظف متأخراً بشكل كبير
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
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
                    الحضور التلقائي
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <div>
                    <p className="text-sm font-medium text-foreground">تفعيل الحضور التلقائي</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
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
                  <div className="p-4 rounded-xl bg-primary/10 space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        مسافة التشغيل الإضافية (متر)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={500}
                        value={local.autoCheckInRadiusOffset}
                        onChange={(e) => update("autoCheckInRadiusOffset", Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-foreground"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        مسافة إضافية بالأمتار خارج حدود النطاق لتفعيل الحضور التلقائي
                      </p>
                    </div>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5">
                      <Zap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-xs text-primary/70">
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
            <Card className="border-0 shadow-lg bg-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[hsl(48_96%_53%/0.1)]0 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-lg font-bold text-foreground">
                    إعدادات الإشعارات
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <div>
                    <p className="text-sm font-medium text-foreground">تفعيل الإشعارات</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
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
                        key: "checkInReminderEnabled" as const,
                        title: "تذكير الحضور",
                        desc: "إرسال تذكير للموظفين قبل وقت الحضور",
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
                    {local.checkInReminderEnabled && (
                      <div className="p-4 rounded-xl bg-muted/50">
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                          وقت تذكير الحضور
                        </label>
                        <input
                          type="time"
                          value={local.checkInReminderTime}
                          onChange={(e) => update("checkInReminderTime", e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-foreground"
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
            <Card className="border-0 shadow-lg bg-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                    <Timer className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-lg font-bold text-foreground">
                    إعدادات الجلسة
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    مدة انتهاء الجلسة (دقائق)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={480}
                    value={local.sessionTimeoutMinutes}
                    onChange={(e) => update("sessionTimeoutMinutes", Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-foreground"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    يتم تسجيل الخروج تلقائياً بعد هذه المدة من عدم النشاط
                  </p>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <div>
                    <p className="text-sm font-medium text-foreground">تسجيل الانصراف التلقائي</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
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
                  <div className="p-4 rounded-xl bg-muted/50">
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      وقت تسجيل الانصراف التلقائي
                    </label>
                    <input
                      type="time"
                      value={local.autoSignOutTime}
                      onChange={(e) => update("autoSignOutTime", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-foreground"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Geofence Tab */}
          {activeTab === "geofence" && (
            <Card className="border-0 shadow-lg bg-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-lg font-bold text-foreground">
                    إعدادات النطاق الجغرافي
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <div>
                    <p className="text-sm font-medium text-foreground">اشتراط النطاق للحضور</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
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
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      السماح بالحضور خارج النطاق
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
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
