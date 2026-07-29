"use client";

import { useState } from "react";
import MainLayout from "@/components/shared/MainLayout";
import FullPageHead from "@/components/shared/FullPageHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, UserCheck, Clock, MapPin, Mail, Smartphone } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useTranslations } from "next-intl";

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return <Switch checked={enabled} onCheckedChange={onChange} />;
}

export default function NotificationSettingsPage() {
  const t = useTranslations("NotificationSettings");
  const [attendanceAlerts, setAttendanceAlerts] = useState(true);
  const [lateAlerts, setLateAlerts] = useState(true);
  const [geofenceExitAlerts, setGeofenceExitAlerts] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  const notificationItems = [
    {
      icon: UserCheck,
      title: t("attendanceAlerts"),
      description: t("attendanceAlertsDescription"),
      enabled: attendanceAlerts,
      onToggle: () => setAttendanceAlerts(!attendanceAlerts),
    },
    {
      icon: Clock,
      title: t("lateAlerts"),
      description: t("lateAlertsDescription"),
      enabled: lateAlerts,
      onToggle: () => setLateAlerts(!lateAlerts),
    },
    {
      icon: MapPin,
      title: t("geofenceExitAlerts"),
      description: t("geofenceExitAlertsDescription"),
      enabled: geofenceExitAlerts,
      onToggle: () => setGeofenceExitAlerts(!geofenceExitAlerts),
    },
    {
      icon: Mail,
      title: t("emailNotifications"),
      description: t("emailNotificationsDescription"),
      enabled: emailNotifications,
      onToggle: () => setEmailNotifications(!emailNotifications),
    },
    {
      icon: Smartphone,
      title: t("pushNotifications"),
      description: t("pushNotificationsDescription"),
      enabled: pushNotifications,
      onToggle: () => setPushNotifications(!pushNotifications),
    },
  ];

  return (
    <MainLayout>
      <div className="p-6 space-y-6 min-h-screen">
        <FullPageHead
          head={t("title")}
          description={t("description")}
          Icon={<Bell className="w-7 h-7" />}
        />

        <Card className="border-0 shadow-lg bg-card animate-slide-up">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[hsl(48_96%_53%/0.7)] flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary-foreground" />
              </div>
              <CardTitle className="text-lg font-bold text-foreground">{t("typesTitle")}</CardTitle>
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
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
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
