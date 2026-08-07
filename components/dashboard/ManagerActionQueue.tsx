"use client";

import { useMemo } from "react";
import { AlertCircle, Clock, MapPin, UserX, ShieldAlert } from "lucide-react";
import type { AttendanceRecord, Employee, LiveTrackingEmployee } from "@/lib/types/trackingTypes";
import { useTranslations } from "next-intl";
import { DEFAULT_COMPANY_TIMEZONE, formatCompanyDate } from "@/lib/utils/companyDate";
import { useCompanySettingsStore } from "@/stores/useCompanySettingsStore";
import {
  buildSyntheticAbsentRecords,
  isPastCheckInDeadlineForDay,
} from "@/lib/utils/attendanceAbsent";

interface ManagerActionQueueProps {
  attendanceData?: AttendanceRecord[];
  employees?: Employee[];
  liveTracking?: LiveTrackingEmployee[];
}

type ActionSeverity = "high" | "medium" | "low";

interface ActionItem {
  id: string;
  title: string;
  description: string;
  severity: ActionSeverity;
  icon: React.ElementType;
}

export default function ManagerActionQueue({
  attendanceData = [],
  employees = [],
  liveTracking = [],
}: ManagerActionQueueProps) {
  const t = useTranslations("Dashboard");
  const workStartTime = useCompanySettingsStore((s) => s.workStartTime);
  const gracePeriodMinutes = useCompanySettingsStore((s) => s.gracePeriodMinutes);
  const timezone = useCompanySettingsStore((s) => s.timezone) || DEFAULT_COMPANY_TIMEZONE;
  const weekendDays = useCompanySettingsStore((s) => s.weekendDays);
  const settings = useMemo(
    () => ({ workStartTime, gracePeriodMinutes, timezone, weekendDays }),
    [workStartTime, gracePeriodMinutes, timezone, weekendDays]
  );
  const today = formatCompanyDate(new Date(), timezone);

  const actions = useMemo<ActionItem[]>(() => {
    const list: ActionItem[] = [];

    liveTracking
      .filter((e) => e.status === "outside_geofence")
      .forEach((e) => {
        list.push({
          id: `geo-${e.id}`,
          title: e.name,
          description: e.geofenceName
            ? t("outsideGeofenceDetail", { name: e.geofenceName })
            : t("outsideGeofenceShort"),
          severity: "high",
          icon: MapPin,
        });
      });

    const todayRows = attendanceData.filter((r) => r.date === today);

    todayRows
      .filter((r) => r.checkInTime && ((r.lateMinutes ?? 0) > 0 || r.status === "late"))
      .forEach((r) => {
        list.push({
          id: `late-${r.id}`,
          title: r.employeeName,
          description: t("lateMinutes", { minutes: r.lateMinutes ?? 0 }),
          severity: "medium",
          icon: Clock,
        });
      });

    // After deadline: one action per missing employee (synthetic covers explicit absent docs too).
    if (isPastCheckInDeadlineForDay(today, settings)) {
      const missing = buildSyntheticAbsentRecords({
        employees,
        attendance: todayRows,
        fromYmd: today,
        toYmd: today,
        settings,
      });
      const absentByEmployee = new Map<string, { title: string }>();
      for (const r of missing) {
        absentByEmployee.set(String(r.employeeId), {
          title: r.employeeName || String(r.employeeId),
        });
      }
      for (const r of todayRows) {
        if (r.status === "absent" && !r.checkInTime) {
          absentByEmployee.set(String(r.employeeId), {
            title: r.employeeName || String(r.employeeId),
          });
        }
      }
      absentByEmployee.forEach((v, employeeId) => {
        list.push({
          id: `absent-${employeeId}`,
          title: v.title,
          description: t("absentToday"),
          severity: "high",
          icon: UserX,
        });
      });
    }

    employees
      .filter((e) => e.shiftOverride)
      .forEach((e) => {
        list.push({
          id: `shift-${e.id}`,
          title: e.name,
          description: t("shiftOverride"),
          severity: "low",
          icon: ShieldAlert,
        });
      });

    // Dedupe by id (synthetic + explicit absent).
    const seen = new Set<string>();
    return list.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [attendanceData, employees, liveTracking, today, t, settings]);

  if (actions.length === 0) {
    return (
      <div className="rounded-xl bg-card border border-border/50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-foreground">{t("actionQueue")}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{t("noActions")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card border border-border/50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-foreground">{t("actionQueue")}</h3>
        <span className="mr-auto text-xs text-muted-foreground">
          {t("requiresAttention", { count: actions.length })}
        </span>
      </div>
      <div className="space-y-2">
        {actions.map((action) => {
          const Icon = action.icon;
          const severityClass =
            action.severity === "high"
              ? "border-red-500/30 bg-red-500/5"
              : action.severity === "medium"
                ? "border-amber-500/30 bg-amber-500/5"
                : "border-primary/30 bg-primary/5";
          const indicatorClass =
            action.severity === "high"
              ? "bg-red-500"
              : action.severity === "medium"
                ? "bg-amber-500"
                : "bg-primary";
          return (
            <div
              key={action.id}
              className={`flex items-center gap-3 p-3 rounded-lg border ${severityClass}`}
            >
              <div className="p-2 rounded-lg bg-background">
                <Icon className="w-4 h-4 text-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{action.title}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
              <div className={`w-2 h-2 rounded-full shrink-0 ${indicatorClass}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
