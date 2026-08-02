"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, Clock, MapPin, AlertTriangle, Megaphone, FileText } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useFCM } from "@/hooks/useFCM";
import { useAuthStore } from "@/stores/useAuthStore";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/config/firebase";
import { useTranslations } from "next-intl";

interface NotificationSettings {
  check_in_reminder: boolean;
  late_check_in_alert: boolean;
  geofence_entry_exit: boolean;
  company_announcement: boolean;
  trial_expiring: boolean;
  attendance_report: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

const defaults: NotificationSettings = {
  check_in_reminder: true,
  late_check_in_alert: true,
  geofence_entry_exit: false,
  company_announcement: true,
  trial_expiring: true,
  attendance_report: true,
  quiet_hours_enabled: false,
  quiet_hours_start: "22:00",
  quiet_hours_end: "07:00",
};

function useNotificationItems() {
  const t = useTranslations("Notifications");
  return [
    {
      key: "check_in_reminder" as const,
      label: t("checkInReminder"),
      icon: Clock,
      desc: t("checkInReminderDesc"),
    },
    {
      key: "late_check_in_alert" as const,
      label: t("lateCheckInAlert"),
      icon: AlertTriangle,
      desc: t("lateCheckInAlertDesc"),
    },
    {
      key: "geofence_entry_exit" as const,
      label: t("geofenceEntryExit"),
      icon: MapPin,
      desc: t("geofenceEntryExitDesc"),
    },
    {
      key: "company_announcement" as const,
      label: t("companyAnnouncement"),
      icon: Megaphone,
      desc: t("companyAnnouncementDesc"),
    },
    {
      key: "trial_expiring" as const,
      label: t("trialExpiring"),
      icon: AlertTriangle,
      desc: t("trialExpiringDesc"),
    },
    {
      key: "attendance_report" as const,
      label: t("attendanceReport"),
      icon: FileText,
      desc: t("attendanceReportDesc"),
    },
  ];
}

export default function NotificationPreferences() {
  const t = useTranslations("Notifications");
  const items = useNotificationItems();
  const { permission, supported, requestPermission, revokePermission } = useFCM();
  const user = useAuthStore((s) => s.user);
  const [settings, setSettings] = useState<NotificationSettings>(defaults);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id || !db) return;
    const firestore = db;
    let mounted = true;
    const load = async () => {
      try {
        const snap = await getDoc(doc(firestore, "notification_settings", String(user.id)));
        if (mounted && snap.exists()) {
          setSettings({ ...defaults, ...(snap.data() as Partial<NotificationSettings>) });
        }
      } catch {
        // ignore — defaults are already set
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const toggle = async (key: keyof NotificationSettings) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    if (user?.id && db) {
      const firestore = db;
      setSaving(true);
      try {
        await setDoc(
          doc(firestore, "notification_settings", String(user.id)),
          { [key]: next[key] },
          { merge: true }
        );
      } catch {
        setSettings(settings); // revert on failure
      } finally {
        setSaving(false);
      }
    }
  };

  const handlePermissionToggle = async () => {
    if (permission === "granted") {
      await revokePermission();
    } else {
      await requestPermission();
    }
  };

  if (!supported) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <BellOff className="w-5 h-5" />
          <p className="text-sm">{t("browserNotSupported")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{t("title")}</h3>
              <p className="text-xs text-muted-foreground">
                {permission === "granted"
                  ? t("enabled")
                  : permission === "denied"
                    ? t("blocked")
                    : t("notEnabled")}
              </p>
            </div>
          </div>
          <Switch
            checked={permission === "granted"}
            onCheckedChange={handlePermissionToggle}
            disabled={permission === "denied" || saving}
          />
        </div>
      </div>

      {permission === "granted" && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h4 className="font-semibold text-foreground">{t("preferences")}</h4>
          {items.map(({ key, label, icon: Icon, desc }) => (
            <div
              key={key}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
              <Switch
                checked={settings[key]}
                onCheckedChange={() => toggle(key)}
                disabled={saving}
              />
            </div>
          ))}

          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{t("quietHours")}</p>
                  <p className="text-xs text-muted-foreground">{t("quietHoursDesc")}</p>
                </div>
              </div>
              <Switch
                checked={settings.quiet_hours_enabled}
                onCheckedChange={() => toggle("quiet_hours_enabled")}
                disabled={saving}
              />
            </div>
            {settings.quiet_hours_enabled && (
              <div className="flex items-center gap-3 mt-3">
                <input
                  type="time"
                  value={settings.quiet_hours_start}
                  onChange={(e) => {
                    const next = { ...settings, quiet_hours_start: e.target.value };
                    setSettings(next);
                  }}
                  onBlur={() => {
                    if (user?.id && db) {
                      const firestore = db;
                      setDoc(
                        doc(firestore, "notification_settings", String(user.id)),
                        { quiet_hours_start: settings.quiet_hours_start },
                        { merge: true }
                      );
                    }
                  }}
                  className="px-3 py-1.5 border border-input rounded-lg bg-transparent text-sm"
                />
                <span className="text-muted-foreground text-sm">{t("until")}</span>
                <input
                  type="time"
                  value={settings.quiet_hours_end}
                  onChange={(e) => {
                    const next = { ...settings, quiet_hours_end: e.target.value };
                    setSettings(next);
                  }}
                  onBlur={() => {
                    if (user?.id && db) {
                      const firestore = db;
                      setDoc(
                        doc(firestore, "notification_settings", String(user.id)),
                        { quiet_hours_end: settings.quiet_hours_end },
                        { merge: true }
                      );
                    }
                  }}
                  className="px-3 py-1.5 border border-input rounded-lg bg-transparent text-sm"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
