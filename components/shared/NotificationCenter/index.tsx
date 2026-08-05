"use client";

import { useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Warning, AlertTriangle, Notepad, Notification } from "@/public/SVG";
import { Trash2, Check, X } from "lucide-react";
import {
  useNotificationStore,
  type NotificationType,
  type AppNotification,
} from "@/stores/useNotificationStore";
import { useTranslations } from "next-intl";

const NOTIFICATION_ICONS: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  check_in: CheckCircle,
  late_arrival: Warning,
  missing_check_in: AlertTriangle,
  check_out: CheckCircle,
  check_out_early: Warning,
  overtime: Warning,
  absence: AlertTriangle,
  geofence_breach: AlertTriangle,
  anomaly_detected: AlertTriangle,
  system: Notepad,
  announcement: Notepad,
  shift_change: Notepad,
  leave_request: Notepad,
  leave_approved: CheckCircle,
  leave_rejected: AlertTriangle,
  payroll: Notepad,
  document: Notepad,
  meeting: Notepad,
  training: Notepad,
  emergency: AlertTriangle,
  maintenance: Notepad,
  policy_update: Notepad,
  birthday: Notepad,
  work_anniversary: Notepad,
  performance_review: Notepad,
  schedule_change: Notepad,
  location_change: AlertTriangle,
  device_change: AlertTriangle,
  reminder: Notepad,
};

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  check_in: "text-primary",
  late_arrival: "text-[hsl(48_96%_53%)]",
  missing_check_in: "text-destructive",
  check_out: "text-primary",
  check_out_early: "text-[hsl(48_96%_53%)]",
  overtime: "text-[hsl(48_96%_53%)]",
  absence: "text-destructive",
  geofence_breach: "text-destructive",
  anomaly_detected: "text-accent-foreground",
  system: "text-primary",
  announcement: "text-primary",
  shift_change: "text-primary",
  leave_request: "text-primary",
  leave_approved: "text-primary",
  leave_rejected: "text-destructive",
  payroll: "text-primary",
  document: "text-primary",
  meeting: "text-primary",
  training: "text-primary",
  emergency: "text-destructive",
  maintenance: "text-primary",
  policy_update: "text-primary",
  birthday: "text-primary",
  work_anniversary: "text-primary",
  performance_review: "text-primary",
  schedule_change: "text-primary",
  location_change: "text-destructive",
  device_change: "text-destructive",
  reminder: "text-primary",
};

function formatTimeAgo(
  timestamp: string,
  t: (key: string, values?: Record<string, number | string>) => string
): string {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now.getTime() - past.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return t("now");
  if (diffMin < 60) return t("minutesAgo", { count: diffMin });
  if (diffHour < 24) return t("hoursAgo", { count: diffHour });
  return t("daysAgo", { count: diffDay });
}

export default function NotificationCenter() {
  const t = useTranslations("Notifications");
  const notifications = useNotificationStore((s) => s.notifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const removeNotification = useNotificationStore((s) => s.removeNotification);

  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");

  const visibleNotifications = useMemo<AppNotification[]>(() => {
    const sorted = [...notifications].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const deduped: AppNotification[] = [];
    const seen = new Set<string>();
    for (const n of sorted) {
      const key = `${n.type}:${n.title}:${n.message}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(n);
    }
    if (activeTab === "unread") return deduped.filter((n) => !n.read);
    return deduped;
  }, [activeTab, notifications]);

  const displayedUnreadCount = useMemo(
    () => visibleNotifications.filter((n) => !n.read).length,
    [visibleNotifications]
  );

  const grouped = useMemo(() => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const todayStr = today.toDateString();
    const yesterdayStr = yesterday.toDateString();

    const buckets: Record<string, AppNotification[]> = { today: [], yesterday: [], earlier: [] };
    for (const n of visibleNotifications) {
      const d = new Date(n.timestamp).toDateString();
      if (d === todayStr) buckets.today.push(n);
      else if (d === yesterdayStr) buckets.yesterday.push(n);
      else buckets.earlier.push(n);
    }
    return buckets;
  }, [visibleNotifications]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative cursor-pointer"
          aria-label={
            t("notificationsAria") +
            (displayedUnreadCount > 0 ? t("unread", { count: displayedUnreadCount }) : "")
          }
        >
          {displayedUnreadCount > 0 && (
            <span className="w-[12px] h-[12px] bg-destructive rounded-full border border-background absolute top-0 right-0 flex items-center justify-center text-[8px] text-destructive-foreground font-bold">
              <span className="absolute inset-0 rounded-full bg-destructive animate-ping opacity-75" />
              <span className="relative">
                {displayedUnreadCount > 9 ? "9+" : displayedUnreadCount}
              </span>
            </span>
          )}
          <Notification />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(520px,95vw)] max-h-[80vh] rounded-2xl p-0 overflow-hidden bg-popover border-border shadow-xl"
        align="end"
      >
        <div className="flex flex-col h-full max-h-[80vh]">
          <div className="flex items-center justify-between gap-3 p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <p className="text-base font-semibold text-foreground">{t("title")}</p>
              {displayedUnreadCount > 0 && (
                <Badge variant="secondary" className="h-5 px-2 text-xs">
                  {displayedUnreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={markAllAsRead}
                disabled={displayedUnreadCount === 0}
                aria-label={t("markAllRead")}
                title={t("markAllRead")}
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => useNotificationStore.getState().clearAll()}
                disabled={notifications.length === 0}
                aria-label={t("clearAll")}
                title={t("clearAll")}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "all" | "unread")}
            className="px-4 pt-4"
          >
            <TabsList className="w-full grid grid-cols-2 h-9">
              <TabsTrigger value="all" className="text-sm">
                {t("all")}
              </TabsTrigger>
              <TabsTrigger value="unread" className="text-sm">
                {t("unreadTab")}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div
            className="flex-1 overflow-y-auto p-4 space-y-6"
            role="list"
            aria-live="polite"
            aria-label={t("notificationList")}
          >
            {visibleNotifications.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-muted-foreground/70">{t("noNotifications")}</p>
              </div>
            ) : (
              (["today", "yesterday", "earlier"] as const).map((group) => {
                const items = grouped[group];
                if (items.length === 0) return null;
                return (
                  <div key={group}>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                      {t(group)}
                    </h3>
                    <div className="flex flex-col gap-2">
                      {items.map((notif) => {
                        const Icon = NOTIFICATION_ICONS[notif.type] ?? Notepad;
                        const colorClass =
                          NOTIFICATION_COLORS[notif.type] ?? "text-muted-foreground";
                        return (
                          <div
                            key={notif.id}
                            onClick={() => markAsRead(notif.id)}
                            role="listitem"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                markAsRead(notif.id);
                              }
                            }}
                            aria-label={`${notif.title}: ${notif.message}`}
                            className="group flex items-start gap-3 p-3 rounded-xl border border-border/60 bg-card hover:bg-accent/50 cursor-pointer transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <div
                              className={`shrink-0 p-2 rounded-full bg-primary/10 ${colorClass}`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground leading-tight">
                                {notif.title}
                              </p>
                              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                                {notif.message}
                              </p>
                              <p className="text-xs text-muted-foreground/70 mt-1.5">
                                {formatTimeAgo(notif.timestamp, t)}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeNotification(notif.id);
                                }}
                                className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                                aria-label={t("remove")}
                                title={t("remove")}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                              {!notif.read && <span className="w-2 h-2 rounded-full bg-primary" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
