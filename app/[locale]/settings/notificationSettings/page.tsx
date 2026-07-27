"use client";

import { useState } from "react";
import MainLayout from "@/components/shared/MainLayout";
import FullPageHead from "@/components/shared/FullPageHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, UserCheck, Clock, MapPin, Mail, Smartphone } from "lucide-react";
import { Switch } from "@/components/ui/switch";

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return <Switch checked={enabled} onCheckedChange={onChange} />;
}

export default function NotificationSettingsPage() {
  const [attendanceAlerts, setAttendanceAlerts] = useState(true);
  const [lateAlerts, setLateAlerts] = useState(true);
  const [geofenceExitAlerts, setGeofenceExitAlerts] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  const notificationItems = [
    {
      icon: UserCheck,
      title: "إشعارات الحضور",
      description: "تنبيه عند تسجيل الموظفين للحضور",
      enabled: attendanceAlerts,
      onToggle: () => setAttendanceAlerts(!attendanceAlerts),
    },
    {
      icon: Clock,
      title: "إشعارات التأخير",
      description: "تنبيه عند تأخر الموظف عن وقت الحضور",
      enabled: lateAlerts,
      onToggle: () => setLateAlerts(!lateAlerts),
    },
    {
      icon: MapPin,
      title: "إشعارات الخروج من النطاق",
      description: "تنبيه عند خروج الموظف من النطاق الجغرافي",
      enabled: geofenceExitAlerts,
      onToggle: () => setGeofenceExitAlerts(!geofenceExitAlerts),
    },
    {
      icon: Mail,
      title: "إشعارات البريد الإلكتروني",
      description: "استلام الإشعارات عبر البريد الإلكتروني",
      enabled: emailNotifications,
      onToggle: () => setEmailNotifications(!emailNotifications),
    },
    {
      icon: Smartphone,
      title: "إشعارات الدفع",
      description: "استلام إشعارات الدفع على الجوال",
      enabled: pushNotifications,
      onToggle: () => setPushNotifications(!pushNotifications),
    },
  ];

  return (
    <MainLayout>
      <div className="p-6 space-y-6 min-h-screen">
        <FullPageHead
          head="إعدادات الإشعارات"
          description="إدارة قوالب الإشعارات وتنبيهات النظام"
          Icon={<Bell className="w-7 h-7" />}
        />

        <Card className="border-0 shadow-lg bg-card animate-slide-up">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[hsl(48_96%_53%/0.1)]0 flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary-foreground" />
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
      </div>
    </MainLayout>
  );
}
