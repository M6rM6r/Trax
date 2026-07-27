"use client";

import { useMemo } from "react";
import { AlertCircle, Clock, MapPin, UserX, ShieldAlert } from "lucide-react";
import type { AttendanceRecord, Employee, LiveTrackingEmployee } from "@/lib/types/trackingTypes";

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
  const today = new Date().toISOString().split("T")[0];

  const actions = useMemo<ActionItem[]>(() => {
    const list: ActionItem[] = [];

    liveTracking
      .filter((e) => e.status === "outside_geofence")
      .forEach((e) => {
        list.push({
          id: `geo-${e.id}`,
          title: e.name,
          description: e.geofenceName ? `خارج النطاق (${e.geofenceName})` : "خارج النطاق الجغرافي",
          severity: "high",
          icon: MapPin,
        });
      });

    attendanceData
      .filter((r) => r.date === today && r.status === "late")
      .forEach((r) => {
        list.push({
          id: `late-${r.id}`,
          title: r.employeeName,
          description: `متأخر ${r.lateMinutes} دقيقة`,
          severity: "medium",
          icon: Clock,
        });
      });

    attendanceData
      .filter((r) => r.date === today && r.status === "absent")
      .forEach((r) => {
        list.push({
          id: `absent-${r.id}`,
          title: r.employeeName,
          description: "لم يسجل الحضور اليوم",
          severity: "high",
          icon: UserX,
        });
      });

    employees
      .filter((e) => e.shiftOverride)
      .forEach((e) => {
        list.push({
          id: `shift-${e.id}`,
          title: e.name,
          description: "تجاوز فترة عمل نشط",
          severity: "low",
          icon: ShieldAlert,
        });
      });

    return list;
  }, [attendanceData, employees, liveTracking, today]);

  if (actions.length === 0) {
    return (
      <div className="rounded-xl bg-card border border-border/50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-foreground">قائمة الإجراءات</h3>
        </div>
        <p className="text-sm text-muted-foreground">لا توجد مهام تتطلب تدخلاً حالياً</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card border border-border/50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-foreground">قائمة الإجراءات</h3>
        <span className="mr-auto text-xs text-muted-foreground">
          {actions.length} يتطلب الاهتمام
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
