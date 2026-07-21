"use client";

import { useState } from "react";
import MainLayout from "@/components/shared/MainLayout";
import FullPageHead from "@/components/shared/FullPageHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Lock, KeyRound, Smartphone, Clock } from "lucide-react";
import { Switch } from "@/components/ui/switch";

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return <Switch checked={enabled} onCheckedChange={onChange} />;
}

export default function SecuritySettingsPage() {
  const [twoFactor, setTwoFactor] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [autoLogout, setAutoLogout] = useState(false);
  const [autoLogoutTime, setAutoLogoutTime] = useState("30");

  return (
    <MainLayout>
      <div className="p-6 space-y-6 min-h-screen">
        <FullPageHead
          head="إعدادات الأمان"
          description="إدارة إعدادات الأمان والتحقق الثنائي"
          Icon={<Shield className="w-7 h-7" />}
        />

        <Card className="border-0 shadow-lg dark:bg-slate-800 animate-slide-up">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-lg font-bold text-gray-900 dark:text-slate-100">
                المصادقة الثنائية
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                  تطلب المصادقة الثنائية
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  يتطلب رمز تحقق إضافي عند تسجيل الدخول
                </p>
              </div>
              <ToggleSwitch enabled={twoFactor} onChange={() => setTwoFactor(!twoFactor)} />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                  إشعار تسجيل الدخول الجديد
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  إرسال إشعار عند تسجيل الدخول من جهاز جديد
                </p>
              </div>
              <ToggleSwitch enabled={loginAlerts} onChange={() => setLoginAlerts(!loginAlerts)} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg dark:bg-slate-800 animate-slide-up">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-lg font-bold text-gray-900 dark:text-slate-100">
                إدارة الجلسة
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                  انتهاء الجلسة التلقائي
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  تسجيل الخروج تلقائياً بعد فترة عدم النشاط
                </p>
              </div>
              <ToggleSwitch enabled={autoLogout} onChange={() => setAutoLogout(!autoLogout)} />
            </div>

            {autoLogout && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                    مدة انتهاء الجلسة
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    اختر مدة عدم النشاط قبل تسجيل الخروج
                  </p>
                </div>
                <select
                  value={autoLogoutTime}
                  onChange={(e) => setAutoLogoutTime(e.target.value)}
                  className="border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-transparent dark:bg-slate-800 dark:text-slate-300 text-sm"
                >
                  <option value="15">15 دقيقة</option>
                  <option value="30">30 دقيقة</option>
                  <option value="60">ساعة واحدة</option>
                  <option value="120">ساعتان</option>
                </select>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg dark:bg-slate-800 animate-slide-up">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-lg font-bold text-gray-900 dark:text-slate-100">
                كلمة المرور
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                    تغيير كلمة المرور
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    آخر تغيير: منذ 30 يوماً
                  </p>
                </div>
              </div>
              <Button variant="outline" className="dark:text-slate-300 dark:border-slate-600">
                تغيير
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
