"use client";

import { useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Warning, AlertTriangle, Notepad, Notification } from "@/public/SVG";
import { Trash2 } from "lucide-react";
import { useNotificationStore, type NotificationType } from "@/stores/useNotificationStore";
import { subscribeRealtimeEvents } from "@/lib/services/realtime";
import { useToast } from "@/hooks/use-toast";

const NOTIFICATION_ICONS: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  late_arrival: Warning,
  geofence_breach: AlertTriangle,
  anomaly_detected: AlertTriangle,
  attendance: CheckCircle,
  system: Notepad,
};

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  late_arrival: "text-amber-500",
  geofence_breach: "text-red-500",
  anomaly_detected: "text-purple-500",
  attendance: "text-green-500",
  system: "text-blue-500",
};

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now.getTime() - past.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "الآن";
  if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
  if (diffHour < 24) return `منذ ${diffHour} ساعة`;
  return `منذ ${diffDay} يوم`;
}

export default function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, addNotification } =
    useNotificationStore();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = subscribeRealtimeEvents({
      onAnomalyDetected: (data) => {
        addNotification({
          type: "anomaly_detected",
          title: "تنبيه: سلوك غير طبيعي",
          message: data.details,
          employeeId: data.employeeId,
        });
        toast({
          title: "تنبيه ذكاء اصطناعي",
          description: data.details,
          variant: "destructive",
        });
      },
      onGeofenceBreach: (data) => {
        addNotification({
          type: "geofence_breach",
          title: "تجاوز نطاق جغرافي",
          message: `${data.employeeName} غادر نطاق ${data.geofenceName}`,
          employeeId: data.employeeId,
          employeeName: data.employeeName,
        });
        toast({
          title: "تجاوز نطاق جغرافي",
          description: `${data.employeeName} غادر نطاق ${data.geofenceName}`,
          variant: "destructive",
        });
      },
      onAttendanceCheckIn: (data) => {
        addNotification({
          type: "attendance",
          title: "تسجيل حضور",
          message: `${data.employeeName} سجل الحضور في ${data.checkInTime}`,
          employeeId: data.employeeId,
          employeeName: data.employeeName,
        });
      },
    });

    return () => unsubscribe();
  }, [addNotification, toast]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative cursor-pointer"
          aria-label={`الإشعارات${unreadCount > 0 ? ` (${unreadCount} غير مقروء)` : ""}`}
        >
          {unreadCount > 0 && (
            <span className="w-[12px] h-[12px] bg-error dark:bg-red-500 rounded-full border border-white absolute top-0 right-0 flex items-center justify-center text-[8px] text-white font-bold">
              <span className="absolute inset-0 rounded-full bg-error dark:bg-red-500 animate-ping opacity-75" />
              <span className="relative">{unreadCount > 9 ? "9+" : unreadCount}</span>
            </span>
          )}
          <Notification />
        </button>
      </PopoverTrigger>
      <PopoverContent className="max-w-[372px] max-h-[500px] rounded-12 p-0 overflow-auto hideScrollbar dark:bg-slate-800 dark:border-slate-700">
        <div className="flex items-center justify-between gap-5 py-4 px-6">
          <p className="text-16 text-textMain dark:text-slate-100 font-[600]">
            الإشعارات {unreadCount > 0 && `(${unreadCount})`}
          </p>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-14 text-primaryColor dark:text-blue-400 hover:underline"
              >
                تحديد الكل كمقروء
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={() => useNotificationStore.getState().clearAll()}
                className="text-14 text-gray-400 hover:text-red-500"
                aria-label="مسح الكل"
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
          aria-label="قائمة الإشعارات"
        >
          {notifications.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-400 dark:text-slate-500">لا توجد إشعارات</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const Icon = NOTIFICATION_ICONS[notif.type] ?? Notepad;
              const colorClass = NOTIFICATION_COLORS[notif.type] ?? "text-gray-500";
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
                  className={`flex items-start gap-4 p-3 rounded-xl cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaryColor animate-slide-in-right ${
                    notif.read
                      ? "bg-transparent"
                      : "bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                  }`}
                >
                  <div className={`shrink-0 ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-14 text-textMain dark:text-slate-100 font-medium">
                      {notif.title}
                    </p>
                    <p className="text-13 text-gray500 dark:text-slate-400 mt-0.5">
                      {notif.message}
                    </p>
                    <p className="text-11 text-gray-400 dark:text-slate-500 mt-1">
                      {formatTimeAgo(notif.timestamp)}
                    </p>
                  </div>
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
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
