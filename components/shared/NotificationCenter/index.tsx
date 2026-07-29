"use client";

import { useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Warning, AlertTriangle, Notepad, Notification } from "@/public/SVG";
import { Trash2 } from "lucide-react";
import { useNotificationStore, type NotificationType } from "@/stores/useNotificationStore";
import { subscribeRealtimeEvents } from "@/lib/services/realtime";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";

const NOTIFICATION_ICONS: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  late_arrival: Warning,
  geofence_breach: AlertTriangle,
  anomaly_detected: AlertTriangle,
  attendance: CheckCircle,
  system: Notepad,
};

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  late_arrival: "text-[hsl(48_96%_53%)]",
  geofence_breach: "text-destructive",
  anomaly_detected: "text-accent-foreground",
  attendance: "text-primary",
  system: "text-primary",
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
  const { notifications, unreadCount, markAsRead, markAllAsRead, addNotification } =
    useNotificationStore();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = subscribeRealtimeEvents({
      onAnomalyDetected: (data) => {
        addNotification({
          type: "anomaly_detected",
          title: t("anomalyAlert"),
          message: data.details,
          employeeId: data.employeeId,
        });
        toast({
          title: t("aiAlert"),
          description: data.details,
          variant: "destructive",
        });
      },
      onGeofenceBreach: (data) => {
        addNotification({
          type: "geofence_breach",
          title: t("geofenceBreach"),
          message: t("geofenceBreachMessage", {
            name: data.employeeName,
            geofence: data.geofenceName,
          }),
          employeeId: data.employeeId,
          employeeName: data.employeeName,
        });
        toast({
          title: t("geofenceBreach"),
          description: t("geofenceBreachMessage", {
            name: data.employeeName,
            geofence: data.geofenceName,
          }),
          variant: "destructive",
        });
      },
      onAttendanceCheckIn: (data) => {
        addNotification({
          type: "attendance",
          title: t("checkIn"),
          message: t("checkInMessage", { name: data.employeeName, time: data.checkInTime }),
          employeeId: data.employeeId,
          employeeName: data.employeeName,
        });
      },
    });

    return () => unsubscribe();
  }, [addNotification, toast, t]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative cursor-pointer"
          aria-label={
            t("notificationsAria") + (unreadCount > 0 ? t("unread", { count: unreadCount }) : "")
          }
        >
          {unreadCount > 0 && (
            <span className="w-[12px] h-[12px] bg-destructive rounded-full border border-background absolute top-0 right-0 flex items-center justify-center text-[8px] text-destructive-foreground font-bold">
              <span className="absolute inset-0 rounded-full bg-destructive animate-ping opacity-75" />
              <span className="relative">{unreadCount > 9 ? "9+" : unreadCount}</span>
            </span>
          )}
          <Notification />
        </button>
      </PopoverTrigger>
      <PopoverContent className="max-w-[372px] max-h-[500px] rounded-12 p-0 overflow-auto hideScrollbar bg-popover border-border">
        <div className="flex items-center justify-between gap-5 py-4 px-6">
          <p className="text-16 text-foreground font-[600]">
            {t("notificationsAria")} {unreadCount > 0 && `(${unreadCount})`}
          </p>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-14 text-primary hover:underline">
                {t("markAllRead")}
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={() => useNotificationStore.getState().clearAll()}
                className="text-14 text-muted-foreground/70 hover:text-destructive"
                aria-label={t("clearAll")}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        <Separator className="h-[1px]" />
        <div
          className="py-4 px-6 flex flex-col gap-3"
          role="list"
          aria-live="polite"
          aria-label={t("notificationList")}
        >
          {notifications.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground/70">{t("noNotifications")}</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const Icon = NOTIFICATION_ICONS[notif.type] ?? Notepad;
              const colorClass = NOTIFICATION_COLORS[notif.type] ?? "text-muted-foreground";
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
                  className={`flex items-start gap-4 p-3 rounded-xl cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring animate-slide-in-right ${
                    notif.read ? "bg-transparent" : "bg-primary/5 hover:bg-primary/10"
                  }`}
                >
                  <div className={`shrink-0 ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-14 text-foreground font-medium">{notif.title}</p>
                    <p className="text-13 text-muted-foreground mt-0.5">{notif.message}</p>
                    <p className="text-11 text-muted-foreground/70 mt-1">
                      {formatTimeAgo(notif.timestamp, t)}
                    </p>
                  </div>
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
