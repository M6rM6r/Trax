"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { UserCheck, UserX, Clock, Calendar } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import MainLayout from "@/components/shared/MainLayout";
import {
  useDashboardData,
  useAttendance,
  useEmployees,
  useGeofences,
  useLiveTracking,
  queryKeys,
  toApiDate,
} from "@/hooks/useApi";
import { useLiveTrackingSocket } from "@/hooks/useLiveTrackingSocket";
import dynamic from "next/dynamic";
import { useQueryClient } from "@tanstack/react-query";
import { ErrorState } from "@/components/shared/StateViews";
import DashboardSkeleton from "@/components/shared/Skeletons/DashboardSkeleton";
import { DataTable } from "@/components/shared/DataTable/DataTable";
import type { AttendanceRecord, DashboardStats } from "@/lib/types/trackingTypes";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCompanySettingsStore } from "@/stores/useCompanySettingsStore";
import AttendancePieChart from "@/components/dashboard/AttendancePieChart";
const LiveMapWidget = dynamic(() => import("@/components/dashboard/LiveMapWidget"), { ssr: false });
import { resolveAttendanceLocation } from "@/lib/utils/geo";
import { displayOutcome, isLateArrival } from "@/lib/utils/attendancePipeline";
import { getDefaultDateRange, type DateRange } from "@/components/shared/DateRangePicker";
import { toastSuccess } from "@/hooks/use-toast";
import { useTranslations, useLocale } from "next-intl";
import { homePathForRole, isCompanyRole } from "@/lib/utils/roleAccess";

const COLORS = {
  present: "#22c55e",
  late: "#f59e0b",
  absent: "#ef4444",
  checkedOut: "#6b7280",
};

export default function DashboardPage() {
  const t = useTranslations("Dashboard");
  const locale = useLocale();
  const dateLocale = locale === "ar" ? "ar-SA-u-nu-latn" : "en-US";
  const timeLocale = locale === "ar" ? "ar-SA-u-nu-latn" : "en-US";
  const user = useAuthStore((s) => s.user);
  const companyName = useAuthStore((s) => s.companyName);
  const role = useAuthStore((s) => s.role);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Company dashboard only — employee → check-in, mastermind → companies.
  useEffect(() => {
    if (role && !isCompanyRole(role)) {
      router.replace(homePathForRole(role));
    }
  }, [role, router]);
  const [dateRange] = useState<DateRange>(getDefaultDateRange());
  const companyTz = useCompanySettingsStore((s) => s.timezone);
  const attendanceDateRange = useMemo(
    () => ({
      from: toApiDate(dateRange.from, companyTz),
      to: toApiDate(dateRange.to, companyTz),
    }),
    [dateRange.from, dateRange.to, companyTz]
  );
  // Company-only dashboard pipeline (hooks also gate on role).
  const companyDashEnabled = isCompanyRole(role);
  const { data: dashboardData, isLoading, isError, refetch } = useDashboardData(dateRange);
  const { data: attendanceData } = useAttendance({
    dateRange: attendanceDateRange,
    enabled: companyDashEnabled,
  });
  const { data: employees = [] } = useEmployees({ enabled: companyDashEnabled });
  const { data: geofences = [] } = useGeofences({ enabled: companyDashEnabled });
  const stats: DashboardStats = useMemo(
    () =>
      dashboardData?.stats ?? {
        totalEmployees: employees.length,
        activeEmployees: 0,
        inactiveEmployees: 0,
        presentToday: 0,
        absentToday: 0,
        lateToday: 0,
        checkedOutToday: 0,
        earlyCheckoutsToday: 0,
        onTimeRate: 0,
        avgCheckInTime: "N/A",
        avgWorkedHours: 0,
        totalGeofences: geofences.length,
        fieldToday: 0,
        officeToday: 0,
        hourlyToday: 0,
      },
    [dashboardData?.stats, employees.length, geofences.length]
  );

  const resolveLocationName = useCallback(
    (record: AttendanceRecord) => resolveAttendanceLocation(record, geofences, employees),
    [geofences, employees]
  );

  const handleExportCSV = useCallback(() => {
    if (!attendanceData?.length) return;
    const h = ["Employee", "Date", "Check In", "Check Out", "Status", "Late", "Location"];
    const formatLate = (minutes: number) => {
      if (minutes <= 0) return "";
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };
    const e = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = attendanceData.map((r) => {
      const outcome = displayOutcome(r);
      const late = isLateArrival(r);
      const status =
        outcome === "checked_out" ? (late ? "checked_out · late" : "checked_out") : outcome;
      return [
        e(r.employeeName),
        e(r.date),
        e(r.checkInTime ?? "-"),
        e(r.checkOutTime ?? "-"),
        e(status),
        e(formatLate(r.lateMinutes ?? 0)),
        e(resolveLocationName(r) || "-"),
      ];
    });
    const sum = attendanceData.reduce((s, r) => s + (r.lateMinutes ?? 0), 0);
    const formatSum = (minutes: number) => {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };
    const csv = [
      h.join(","),
      ...rows.map((r) => r.join(",")),
      `"Total","","","","","${formatSum(sum)}",""`,
    ].join("\n");
    const b = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const u = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href = u;
    a.download = `attendance_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(u);
    toastSuccess(t("exported"));
  }, [attendanceData, resolveLocationName, t]);

  const formatDate = useCallback(
    (dateStr: string | null | undefined) => {
      if (!dateStr) return "-";
      const d = new Date(`${dateStr}T00:00:00`);
      if (Number.isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    },
    [locale]
  );
  const { data: initialTracking = [] } = useLiveTracking();
  const { employees: liveTracking } = useLiveTrackingSocket(initialTracking);

  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [realtimePulse, setRealtimePulse] = useState(false);
  const lastRealtimeToastAtRef = useRef(0);
  const realtimePulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageRouter = useRouter();

  useEffect(() => {
    if (role === "employee") {
      pageRouter.push("/check-in");
    }
  }, [role, pageRouter]);

  useEffect(() => {
    setLastUpdated(
      new Date().toLocaleTimeString(timeLocale, { hour: "2-digit", minute: "2-digit" })
    );
    const interval = setInterval(() => {
      setLastUpdated(
        new Date().toLocaleTimeString(timeLocale, { hour: "2-digit", minute: "2-digit" })
      );
    }, 30000);
    return () => clearInterval(interval);
  }, [timeLocale]);

  // Real-time WebSocket listener for attendance updates (optional; only when WS server configured)
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (!wsUrl) {
      // No WebSocket URL configured — realtime disabled (no connection attempts)
      return;
    }

    let socket: import("socket.io-client").Socket | null = null;

    async function initSocket() {
      try {
        const { io } = await import("socket.io-client");
        socket = io(wsUrl, { transports: ["websocket"], reconnection: true });

        socket.on("attendance:update", () => {
          setRealtimePulse(true);
          if (realtimePulseTimeoutRef.current) {
            clearTimeout(realtimePulseTimeoutRef.current);
          }
          realtimePulseTimeoutRef.current = setTimeout(() => setRealtimePulse(false), 2000);

          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
          queryClient.invalidateQueries({ queryKey: queryKeys.attendance });

          const now = Date.now();
          if (now - lastRealtimeToastAtRef.current > 10000) {
            toastSuccess(t("updated"));
            lastRealtimeToastAtRef.current = now;
          }
        });
      } catch {}
    }

    initSocket();
    return () => {
      socket?.disconnect();
      if (realtimePulseTimeoutRef.current) {
        clearTimeout(realtimePulseTimeoutRef.current);
      }
    };
  }, [queryClient, t]);

  const attendanceDistribution = useMemo(
    () => [
      {
        name: t("statusPresent"),
        value: stats.presentToday,
        icon: UserCheck,
        color: COLORS.present,
      },
      {
        name: t("statusLate"),
        value: stats.lateToday,
        icon: Clock,
        color: COLORS.late,
      },
      {
        name: t("statusAbsent"),
        value: stats.absentToday,
        icon: UserX,
        color: COLORS.absent,
      },
    ],
    [stats, t]
  );

  const recentAttendance = useMemo(() => {
    const rows = attendanceData ?? [];
    const from = dateRange.from;
    const to = dateRange.to;

    if (!from && !to) {
      return rows.slice(0, 5);
    }

    const fromMs = from
      ? new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime()
      : -Infinity;
    const toMs = to ? new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime() : Infinity;

    return rows
      .filter((r) => {
        const date = new Date(`${r.date}T00:00:00`);
        if (Number.isNaN(date.getTime())) return false;
        const value = date.getTime();
        return value >= fromMs && value <= toMs;
      })
      .map((r) => ({ ...r, geofenceName: resolveLocationName(r) || "-" }))
      .sort(
        (a, b) =>
          b.date.localeCompare(a.date) || (b.checkInTime ?? "").localeCompare(a.checkInTime ?? "")
      )
      .slice(0, 5);
  }, [attendanceData, dateRange, resolveLocationName]);

  // Don't render dashboard chrome while auth is not confirmed
  if (!user) {
    return (
      <div className="w-screen min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 min-h-screen">
        {isLoading && <DashboardSkeleton />}
        {isError && <ErrorState onRetry={() => refetch()} />}
        {!isLoading && !isError && (
          <>
            {/* Hero greeting banner */}
            <div className="rounded-2xl bg-background p-4 sm:p-6 shadow-lg">
              <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    {new Date().toLocaleDateString(dateLocale, {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <h1 className="text-2xl sm:text-3xl font-black text-foreground mt-1">
                    {t("greeting", { name: user?.name?.split(" ")[0] ?? t("manager") })}
                    {companyName && (
                      <span className="text-primary text-xl font-semibold">
                        {" — "}
                        <bdi>{companyName}</bdi>
                      </span>
                    )}
                  </h1>
                  <p className="text-muted-foreground/80 text-sm mt-1">{t("overview")}</p>
                </div>
              </div>

              {/* Last updated + realtime LIVE badge */}
              {lastUpdated && (
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <AnimatePresence>
                    {realtimePulse && (
                      <motion.span
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/15 text-primary/70"
                      >
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                        </span>
                        <span className="font-bold">{t("live")}</span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {t("lastUpdated")}: {lastUpdated}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4">
              <LiveMapWidget liveTracking={liveTracking} geofences={geofences} />
            </div>

            <div className="space-y-8 animate-fade-in">
              <AttendancePieChart data={attendanceDistribution} exportToCSV={handleExportCSV} />

              <Card className="border border-border/50 bg-card">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <UserCheck className="w-5 h-5 text-primary" />
                      <div>
                        <CardTitle className="text-base font-bold text-foreground">
                          {t("recentAttendance")}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {t("recentAttendanceSubtitle")}
                        </p>
                      </div>
                    </div>
                    <button onClick={handleExportCSV} className="text-sm text-primary">
                      {t("export")}
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  <DataTable<AttendanceRecord>
                    columns={[
                      {
                        key: "employeeName",
                        header: t("employee"),
                        sortable: true,
                        filterable: true,
                        sortValue: (r) => r.employeeName,
                        cell: (r) => (
                          <span className="text-sm font-medium text-foreground">
                            {r.employeeName}
                          </span>
                        ),
                      },
                      {
                        key: "date",
                        header: t("date"),
                        sortable: true,
                        filterable: true,
                        sortValue: (r) => r.date || "",
                        cell: (r) => (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                            <Calendar className="w-3 h-3 text-muted-foreground/70" />
                            {formatDate(r.date)}
                          </span>
                        ),
                      },
                      {
                        key: "checkInTime",
                        header: t("checkInTime"),
                        sortable: true,
                        sortValue: (r) => r.checkInTime || "",
                        cell: (r) => r.checkInTime || "-",
                      },
                      {
                        key: "status",
                        header: t("status"),
                        sortable: true,
                        sortValue: (r) => displayOutcome(r),
                        cell: (r) => {
                          const outcome = displayOutcome(r);
                          const late = isLateArrival(r);
                          const labels: Record<string, string> = {
                            present: t("statusPresent"),
                            late: t("statusLate"),
                            absent: t("statusAbsent"),
                            checked_out: t("statusCheckedOut"),
                          };
                          const label =
                            outcome === "checked_out"
                              ? late
                                ? `${labels.checked_out} · ${labels.late}`
                                : labels.checked_out
                              : labels[outcome] || r.status;
                          return (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${
                                outcome === "present"
                                  ? "bg-primary/10 text-primary ring-emerald-400/20"
                                  : outcome === "late"
                                    ? "bg-[hsl(48_96%_53%/0.1)] text-[hsl(48_96%_53%)] ring-amber-400/20"
                                    : outcome === "checked_out"
                                      ? "bg-slate-500/15 text-slate-700 dark:text-slate-200 ring-slate-400/20"
                                      : "bg-destructive/10 text-destructive ring-red-400/20"
                              }`}
                            >
                              {label}
                            </span>
                          );
                        },
                      },
                      {
                        key: "geofenceName",
                        header: t("location"),
                        filterable: true,
                        sortValue: (r) => r.geofenceName || "",
                        cell: (r) => r.geofenceName || "-",
                      },
                    ]}
                    data={recentAttendance}
                    searchPlaceholder={t("searchRecords")}
                    pageSize={5}
                  />
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
