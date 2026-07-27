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

        <Card className="border-0 shadow-lg bg-card animate-slide-up">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-primary-foreground" />
              </div>
              <CardTitle className="text-lg font-bold text-foreground">
                المصادقة الثنائية
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div>
                <p className="text-sm font-medium text-foreground">
                  تطلب المصادقة الثنائية
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  يتطلب رمز تحقق إضافي عند تسجيل الدخول
                </p>
              </div>
              <ToggleSwitch enabled={twoFactor} onChange={() => setTwoFactor(!twoFactor)} />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div>
                <p className="text-sm font-medium text-foreground">
                  إشعار تسجيل الدخول الجديد
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  إرسال إشعار عند تسجيل الدخول من جهاز جديد
                </p>
              </div>
              <ToggleSwitch enabled={loginAlerts} onChange={() => setLoginAlerts(!loginAlerts)} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-card animate-slide-up">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[hsl(48_96%_53%/0.1)]0 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary-foreground" />
              </div>
              <CardTitle className="text-lg font-bold text-foreground">
                إدارة الجلسة
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div>
                <p className="text-sm font-medium text-foreground">
                  انتهاء الجلسة التلقائي
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  تسجيل الخروج تلقائياً بعد فترة عدم النشاط
                </p>
              </div>
              <ToggleSwitch enabled={autoLogout} onChange={() => setAutoLogout(!autoLogout)} />
            </div>

            {autoLogout && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    مدة انتهاء الجلسة
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    اختر مدة عدم النشاط قبل تسجيل الخروج
                  </p>
                </div>
                <select
                  value={autoLogoutTime}
                  onChange={(e) => setAutoLogoutTime(e.target.value)}
                  className="border border-input rounded-lg px-3 py-2 bg-transparent bg-card text-muted-foreground text-sm"
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

        <Card className="border-0 shadow-lg bg-card animate-slide-up">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/50 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-primary-foreground" />
              </div>
              <CardTitle className="text-lg font-bold text-foreground">
                كلمة المرور
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-muted-foreground/70" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    تغيير كلمة المرور
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    آخر تغيير: منذ 30 يوماً
                  </p>
                </div>
              </div>
              <Button variant="outline" className="text-muted-foreground border-input">
                تغيير
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
