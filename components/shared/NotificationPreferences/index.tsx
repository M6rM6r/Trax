"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, Clock, MapPin, AlertTriangle, Megaphone, FileText } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useFCM } from "@/hooks/useFCM";
import { useAuthStore } from "@/stores/useAuthStore";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/config/firebase";

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

const items = [
  {
    key: "check_in_reminder" as const,
    label: "تذكير تسجيل الحضور",
    icon: Clock,
    desc: "إشعار عند موعد بدء الدوام",
  },
  {
    key: "late_check_in_alert" as const,
    label: "تنبيه التأخير",
    icon: AlertTriangle,
    desc: "إشعار عند تأخر الموظف عن الحضور",
  },
  {
    key: "geofence_entry_exit" as const,
    label: "دخول/خروج النطاق",
    icon: MapPin,
    desc: "إشعار عند دخول أو خروج الموظف من النطاق الجغرافي",
  },
  {
    key: "company_announcement" as const,
    label: "إعلانات الشركة",
    icon: Megaphone,
    desc: "إشعارات عامة من إدارة الشركة",
  },
  {
    key: "trial_expiring" as const,
    label: "انتهاء الفترة التجريبية",
    icon: AlertTriangle,
    desc: "تذكير قبل انتهاء الفترة التجريبية",
  },
  {
    key: "attendance_report" as const,
    label: "تقارير الحضور",
    icon: FileText,
    desc: "إشعار عند توفر التقرير اليومي",
  },
];

export default function NotificationPreferences() {
  const { permission, supported, requestPermission, revokePermission } = useFCM();
  const { user } = useAuthStore();
  const [settings, setSettings] = useState<NotificationSettings>(defaults);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id || !db) return;
    const firestore = db;
    const load = async () => {
      const snap = await getDoc(doc(firestore, "notification_settings", String(user.id)));
      if (snap.exists()) {
        setSettings({ ...defaults, ...(snap.data() as Partial<NotificationSettings>) });
      }
    };
    load();
  }, [user?.id]);

  const toggle = async (key: keyof NotificationSettings) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    if (user?.id && db) {
      setSaving(true);
      await setDoc(doc(db, "notification_settings", String(user.id)), next, { merge: true });
      setSaving(false);
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
          <p className="text-sm">الإشعارات غير مدعومة في هذا المتصفح</p>
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
              <h3 className="font-semibold text-foreground">الإشعارات</h3>
              <p className="text-xs text-muted-foreground">
                {permission === "granted"
                  ? "الإشعارات مفعلة"
                  : permission === "denied"
                    ? "الإشعارات محظورة — يرجى تغيير إعدادات المتصفح"
                    : "الإشعارات غير مفعلة"}
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
          <h4 className="font-semibold text-foreground">تفضيلات الإشعارات</h4>
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
                  <p className="text-sm font-medium text-foreground">ساعات الهدوء</p>
                  <p className="text-xs text-muted-foreground">إيقاف الإشعارات خلال هذه الفترة</p>
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
                      setDoc(
                        doc(db, "notification_settings", String(user.id)),
                        { quiet_hours_start: settings.quiet_hours_start },
                        { merge: true }
                      );
                    }
                  }}
                  className="px-3 py-1.5 border border-input rounded-lg bg-transparent text-sm"
                />
                <span className="text-muted-foreground text-sm">حتى</span>
                <input
                  type="time"
                  value={settings.quiet_hours_end}
                  onChange={(e) => {
                    const next = { ...settings, quiet_hours_end: e.target.value };
                    setSettings(next);
                  }}
                  onBlur={() => {
                    if (user?.id && db) {
                      setDoc(
                        doc(db, "notification_settings", String(user.id)),
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
