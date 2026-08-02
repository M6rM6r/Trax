"use client";

import MainLayout from "@/components/shared/MainLayout";
import FullPageHead from "@/components/shared/FullPageHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, UserCheck, Clock, MapPin, Mail, Smartphone } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useTranslations } from "next-intl";
import { useCompanySettingsStore } from "@/stores/useCompanySettingsStore";
import { useSaveCompanySettings } from "@/hooks/api/useCompanySettings";
import { toastSuccess } from "@/hooks/use-toast";
import NotificationPreferences from "@/components/shared/NotificationPreferences";

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return <Switch checked={enabled} onCheckedChange={onChange} />;
}

export default function NotificationSettingsPage() {
  const t = useTranslations("NotificationSettings");
  const attendanceAlertsEnabled = useCompanySettingsStore((s) => s.attendanceAlertsEnabled);
  const lateAlertsEnabled = useCompanySettingsStore((s) => s.lateAlertsEnabled);
  const geofenceBreachAlertsEnabled = useCompanySettingsStore((s) => s.geofenceBreachAlertsEnabled);
  const emailNotificationsEnabled = useCompanySettingsStore((s) => s.emailNotificationsEnabled);
  const pushNotificationsEnabled = useCompanySettingsStore((s) => s.pushNotificationsEnabled);
  const setSettings = useCompanySettingsStore((s) => s.setSettings);
  const saveSettings = useSaveCompanySettings();

  const toggleSetting = (
    key:
      | "attendanceAlertsEnabled"
      | "lateAlertsEnabled"
      | "geofenceBreachAlertsEnabled"
      | "emailNotificationsEnabled"
      | "pushNotificationsEnabled",
    label: string
  ) => {
    const current =
      key === "attendanceAlertsEnabled"
        ? attendanceAlertsEnabled
        : key === "lateAlertsEnabled"
          ? lateAlertsEnabled
          : key === "geofenceBreachAlertsEnabled"
            ? geofenceBreachAlertsEnabled
            : key === "emailNotificationsEnabled"
              ? emailNotificationsEnabled
              : pushNotificationsEnabled;
    const next = !current;
    setSettings({ [key]: next });
    saveSettings.mutate(
      { [key]: next },
      {
        onSuccess: () => toastSuccess(label),
        onError: () => {
          setSettings({ [key]: !next });
        },
      }
    );
  };

  const notificationItems = [
    {
      icon: UserCheck,
      title: t("attendanceAlerts"),
      description: t("attendanceAlertsDescription"),
      enabled: attendanceAlertsEnabled,
      onToggle: () => toggleSetting("attendanceAlertsEnabled", t("attendanceAlerts")),
    },
    {
      icon: Clock,
      title: t("lateAlerts"),
      description: t("lateAlertsDescription"),
      enabled: lateAlertsEnabled,
      onToggle: () => toggleSetting("lateAlertsEnabled", t("lateAlerts")),
    },
    {
      icon: MapPin,
      title: t("geofenceExitAlerts"),
      description: t("geofenceExitAlertsDescription"),
      enabled: geofenceBreachAlertsEnabled,
      onToggle: () => toggleSetting("geofenceBreachAlertsEnabled", t("geofenceExitAlerts")),
    },
    {
      icon: Mail,
      title: t("emailNotifications"),
      description: t("emailNotificationsDescription"),
      enabled: emailNotificationsEnabled,
      onToggle: () => toggleSetting("emailNotificationsEnabled", t("emailNotifications")),
    },
    {
      icon: Smartphone,
      title: t("pushNotifications"),
      description: t("pushNotificationsDescription"),
      enabled: pushNotificationsEnabled,
      onToggle: () => toggleSetting("pushNotificationsEnabled", t("pushNotifications")),
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

        <NotificationPreferences />
      </div>
    </MainLayout>
  );
}
