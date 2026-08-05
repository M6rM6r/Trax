"use client";

import { useMemo, useCallback, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useNotificationStore, type AppNotification } from "@/stores/useNotificationStore";
import { useTranslations, useLocale } from "next-intl";
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Clock,
  AlertTriangle,
  LogIn,
  LogOut,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDistanceToNow, isToday, isYesterday, parseISO } from "date-fns";
import { ar, enUS } from "date-fns/locale";

type FilterTab = "all" | "unread" | "action";

const TYPE_META: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; tone: string }
> = {
  missing_check_in: {
    icon: UserX,
    tone: "bg-destructive/15 text-destructive border-destructive/25",
  },
  late_arrival: {
    icon: AlertTriangle,
    tone: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25",
  },
  check_in: {
    icon: LogIn,
    tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
  },
  check_out: {
    icon: LogOut,
    tone: "bg-muted text-muted-foreground border-border",
  },
  check_out_early: {
    icon: LogOut,
    tone: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/25",
  },
  reminder: {
    icon: Bell,
    tone: "bg-primary/10 text-primary border-primary/20",
  },
};

function isActionNeeded(n: AppNotification): boolean {
  return n.type === "missing_check_in" || n.type === "late_arrival" || n.type === "check_out_early";
}

function dayLabel(iso: string, locale: string, t: (k: string) => string): string {
  try {
    const d = parseISO(iso);
    if (isNaN(d.getTime())) return t("earlier");
    if (isToday(d)) return t("today");
    if (isYesterday(d)) return t("yesterday");
    return d.toLocaleDateString(locale === "ar" ? "ar-SA-u-nu-latn" : "en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  } catch {
    return t("earlier");
  }
}

export function NotificationBell() {
  const { unreadCount } = useNotificationStore();
  const t = useTranslations("Notifications");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={t("notificationsAria")}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        className="w-[min(24rem,95vw)] max-h-[85vh] p-0 overflow-hidden shadow-xl"
      >
        <NotificationCenter />
      </PopoverContent>
    </Popover>
  );
}

export function NotificationCenter() {
  const t = useTranslations("Notifications");
  const locale = useLocale();
  const router = useRouter();
  const [tab, setTab] = useState<FilterTab>("all");
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } =
    useNotificationStore();

  const actionCount = useMemo(
    () => notifications.filter((n) => isActionNeeded(n) && !n.read).length,
    [notifications]
  );

  const filtered = useMemo(() => {
    let list = [...notifications];
    if (tab === "unread") list = list.filter((n) => !n.read);
    if (tab === "action") list = list.filter((n) => isActionNeeded(n));
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [notifications, tab]);

  const grouped = useMemo(() => {
    const groups = new Map<string, AppNotification[]>();
    for (const n of filtered) {
      if (isNaN(new Date(n.timestamp).getTime())) continue;
      const label = dayLabel(n.timestamp, locale, t);
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label)!.push(n);
    }
    return Array.from(groups.entries());
  }, [filtered, locale, t]);

  const handleMarkAllRead = useCallback(async () => {
    await markAllAsRead();
  }, [markAllAsRead]);

  const handleClearAll = useCallback(async () => {
    await clearAll();
  }, [clearAll]);

  const openRelated = useCallback(
    async (n: AppNotification) => {
      if (!n.read) await markAsRead(n.id);
      if (
        n.type === "missing_check_in" ||
        n.type === "late_arrival" ||
        n.type.startsWith("check_")
      ) {
        router.push("/attendance");
      }
    },
    [markAsRead, router]
  );

  return (
    <div className="flex flex-col h-[min(640px,82vh)]">
      <div className="flex items-center justify-between gap-2 p-3 sm:p-4 border-b bg-card/80">
        <div className="flex items-center gap-2 min-w-0">
          <Bell className="w-5 h-5 text-primary shrink-0" />
          <h3 className="font-semibold text-foreground truncate">{t("center.title")}</h3>
          {unreadCount > 0 && (
            <Badge variant="default" className="bg-primary text-primary-foreground shrink-0">
              {unreadCount} {t("center.unread")}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="h-8 px-2 gap-1 text-xs"
              title={t("markAllRead")}
            >
              <CheckCheck className="w-4 h-4" />
              <span className="hidden sm:inline">{t("markAllRead")}</span>
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              title={t("clearAll")}
              aria-label={t("clearAll")}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-1 p-2 border-b bg-muted/30">
        {(
          [
            { id: "all" as const, label: t("all"), count: notifications.length },
            { id: "unread" as const, label: t("unreadTab"), count: unreadCount },
            { id: "action" as const, label: t("needsAttention"), count: actionCount },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
              tab === item.id
                ? "bg-background text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.label}
            {item.count > 0 ? <span className="ms-1 opacity-70">({item.count})</span> : null}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto" role="list" aria-label={t("notificationList")}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <Bell className="w-12 h-12 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">{t("center.empty")}</p>
            {tab !== "all" && (
              <Button variant="link" size="sm" className="mt-2" onClick={() => setTab("all")}>
                {t("showAll")}
              </Button>
            )}
          </div>
        ) : (
          <div className="p-3 space-y-4">
            {grouped.map(([date, items]) => (
              <div key={date} className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-1">
                  {date}
                </div>
                {items.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onOpen={openRelated}
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
  onOpen,
  onMarkRead,
  onRemove,
  locale,
}: {
  notification: AppNotification;
  onOpen: (n: AppNotification) => void;
  onMarkRead: (id: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  locale: string;
}) {
  const t = useTranslations("Notifications");
  const meta = TYPE_META[notification.type] || {
    icon: Clock,
    tone: "bg-muted text-muted-foreground border-border",
  };
  const Icon = meta.icon;
  const action = isActionNeeded(notification);

  return (
    <div
      role="listitem"
      className={`group flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
        notification.read
          ? "bg-card border-border/80 opacity-90"
          : action
            ? "bg-destructive/5 border-destructive/25"
            : "bg-primary/5 border-primary/20"
      }`}
      onClick={() => onOpen(notification)}
    >
      <div
        className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border ${meta.tone}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <p className="text-sm font-semibold text-foreground break-words leading-snug flex-1">
            {notification.title}
          </p>
          {!notification.read && (
            <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" aria-hidden />
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2 break-words">
          {notification.message}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          <span className="text-[11px] text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(notification.timestamp), {
              addSuffix: true,
              locale: locale === "ar" ? ar : enUS,
            })}
          </span>
          {action && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-destructive/10 text-destructive">
              {t("needsAttention")}
            </span>
          )}
        </div>
      </div>
      <div
        className="shrink-0 flex flex-col items-center gap-0.5"
        onClick={(e) => e.stopPropagation()}
      >
        {!notification.read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
            onClick={() => onMarkRead(notification.id)}
            title={t("markRead")}
            aria-label={t("markRead")}
          >
            <Check className="w-4 h-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
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
