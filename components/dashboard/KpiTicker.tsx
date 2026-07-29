"use client";

import { UserCheck, UserX, Clock, TrendingUp, MapPin, WifiOff } from "lucide-react";
import type { DashboardStats, LiveTrackingEmployee } from "@/lib/types/trackingTypes";
import { useTranslations } from "next-intl";

interface KpiTickerProps {
  stats?: DashboardStats;
  liveTracking?: LiveTrackingEmployee[];
}

export default function KpiTicker({ stats, liveTracking = [] }: KpiTickerProps) {
  const t = useTranslations("Dashboard");
  const outside = liveTracking.filter((e) => e.status === "outside_geofence").length;
  const offline = liveTracking.filter((e) => e.status === "offline").length;

  const items = [
    {
      label: t("statusPresent"),
      value: stats?.presentToday ?? 0,
      icon: UserCheck,
      color: "text-emerald-500",
    },
    {
      label: t("statusLate"),
      value: stats?.lateToday ?? 0,
      icon: Clock,
      color: "text-amber-500",
    },
    {
      label: t("statusAbsent"),
      value: stats?.absentToday ?? 0,
      icon: UserX,
      color: "text-red-500",
    },
    {
      label: t("onTimeRate"),
      value: `${Math.round(stats?.onTimeRate ?? 0)}%`,
      icon: TrendingUp,
      color: "text-primary",
    },
    {
      label: t("outsideGeofence"),
      value: outside,
      icon: MapPin,
      color: "text-amber-500",
    },
    {
      label: t("offline"),
      value: offline,
      icon: WifiOff,
      color: "text-muted-foreground",
    },
  ];

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <div
            key={i}
            className="flex-shrink-0 min-w-[140px] rounded-xl bg-card border border-border/50 p-3 flex items-center gap-3"
          >
            <div className={`p-2 rounded-lg bg-muted/50 ${item.color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-lg font-black text-foreground">{item.value}</p>
              <p className="text-xs text-muted-foreground whitespace-nowrap">{item.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
