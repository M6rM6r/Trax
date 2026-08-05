"use client";

import { useMemo, useCallback } from "react";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { useTranslations, useLocale } from "next-intl";
import { Bell, X, Check, Clock, Mail, Smartphone, Bell as BellIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  attendance: Clock,
  leave: Mail,
  payroll: Smartphone,
  system: BellIcon,
  social: Bell,
  security: Smartphone,
  schedule: Clock,
};

const PRIORITY_COLORS = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  normal: "bg-primary/10 text-primary border-primary/20",
  low: "bg-muted text-muted-foreground border-muted",
};

export function NotificationBell() {
  const { unreadCount } = useNotificationStore();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        className="w-[min(24rem,95vw)] max-h-[80vh] p-0 overflow-hidden"
      >
        <NotificationCenter />
      </PopoverContent>
    </Popover>
  );
}

export function NotificationCenter() {
  const t = useTranslations("Notifications");
  const locale = useLocale();
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } =
    useNotificationStore();

  const groupedNotifications = useMemo(() => {
    const groups = new Map<string, typeof notifications>();
    const sorted = [...notifications]
      .filter((n) => !isNaN(new Date(n.timestamp).getTime()))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    for (const n of sorted) {
      const date = new Date(n.timestamp).toLocaleDateString(locale, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!groups.has(date)) groups.set(date, []);
      groups.get(date)!.push(n);
    }
    return Array.from(groups.entries()).sort((a, b) => {
      const aTimes = a[1].map((n) => new Date(n.timestamp).getTime()).filter((v) => !isNaN(v));
      const bTimes = b[1].map((n) => new Date(n.timestamp).getTime()).filter((v) => !isNaN(v));
      const aNewest = aTimes.length ? Math.max(...aTimes) : -Infinity;
      const bNewest = bTimes.length ? Math.max(...bTimes) : -Infinity;
      return bNewest - aNewest;
    });
  }, [notifications, locale]);

  const handleMarkAllRead = useCallback(async () => {
    await markAllAsRead();
  }, [markAllAsRead]);

  const handleClearAll = useCallback(async () => {
    await clearAll();
  }, [clearAll]);

  return (
    <div className="flex flex-col h-[min(600px,80vh)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">{t("center.title")}</h3>
          {unreadCount > 0 && (
            <Badge variant="default" className="bg-primary text-primary-foreground">
              {unreadCount} {t("center.unread")}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="h-8 w-8 p-0">
              <Check className="w-4 h-4" />
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <Bell className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">{t("center.empty")}</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {groupedNotifications.map(([date, items]) => (
              <div key={date} className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground px-2">{date}</div>
                {items.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={markAsRead}
                    onRemove={removeNotification}
                    locale={locale}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationItem({
  notification,
  onMarkRead,
  onRemove,
  locale,
}: {
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    priority?: "low" | "normal" | "high";
    employeeId?: string;
    employeeName?: string;
    data?: Record<string, string>;
  };
  onMarkRead: (id: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  locale: string;
}) {
  const t = useTranslations("Notifications");
  const category = getCategoryForType(notification.type);
  const CategoryIcon = CATEGORY_ICONS[category] || Bell;
  const priority = notification.priority || "normal";

  return (
    <div
      className={`group flex items-start gap-3 p-3 rounded-xl border transition-all ${
        notification.read ? "bg-card border-border" : "bg-primary/5 border-primary/20"
      }`}
    >
      <div
        className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${PRIORITY_COLORS[priority]}`}
      >
        <CategoryIcon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground break-words leading-tight">
          {notification.title}
        </p>
        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2 break-words">
          {notification.message}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(notification.timestamp), {
              addSuffix: true,
              locale: locale === "ar" ? ar : enUS,
            })}
          </span>
        </div>
      </div>
      <div className="shrink-0 flex flex-col items-center gap-1">
        {!notification.read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
            onClick={() => onMarkRead(notification.id)}
          >
            <Check className="w-4 h-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(notification.id)}
          aria-label={t("remove")}
          title={t("remove")}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function getCategoryForType(type: string): string {
  const attendanceTypes = [
    "attendance",
    "check_in",
    "late_arrival",
    "check_out",
    "check_out_early",
    "overtime",
    "absence",
  ];
  const leaveTypes = ["leave_request", "leave_approved", "leave_rejected"];
  const payrollTypes = ["payroll", "document"];
  const systemTypes = [
    "system",
    "announcement",
    "policy_update",
    "maintenance",
    "emergency",
    "reminder",
  ];
  const socialTypes = ["birthday", "work_anniversary", "performance_review"];
  const securityTypes = ["geofence_breach", "anomaly_detected", "device_change", "location_change"];
  const scheduleTypes = ["shift_change", "schedule_change", "meeting", "training"];

  if (attendanceTypes.includes(type)) return "attendance";
  if (leaveTypes.includes(type)) return "leave";
  if (payrollTypes.includes(type)) return "payroll";
  if (systemTypes.includes(type)) return "system";
  if (socialTypes.includes(type)) return "social";
  if (securityTypes.includes(type)) return "security";
  if (scheduleTypes.includes(type)) return "schedule";
  return "all";
}
