"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { UserCheck, UserX, Clock, Calendar } from "lucide-react";
import { useRouter, Link } from "@/i18n/navigation";
import MainLayout from "@/components/shared/MainLayout";
import {
  useDashboardData,
  useAttendance,
  useEmployees,
  useGeofences,
  useLiveTracking,
  queryKeys,
} from "@/hooks/useApi";
import { useLiveTrackingSocket } from "@/hooks/useLiveTrackingSocket";
import dynamic from "next/dynamic";
import { useQueryClient } from "@tanstack/react-query";
import { ErrorState } from "@/components/shared/StateViews";
import DashboardSkeleton from "@/components/shared/Skeletons/DashboardSkeleton";
import { DataTable } from "@/components/shared/DataTable/DataTable";
import type { AttendanceRecord } from "@/lib/types/trackingTypes";
import { useAuthStore } from "@/stores/useAuthStore";
import AttendancePieChart from "@/components/dashboard/AttendancePieChart";
import KpiTicker from "@/components/dashboard/KpiTicker";
const LiveMapWidget = dynamic(() => import("@/components/dashboard/LiveMapWidget"), { ssr: false });
import { getDefaultDateRange, type DateRange } from "@/components/shared/DateRangePicker";
import { toastSuccess } from "@/hooks/use-toast";
import { useTranslations, useLocale } from "next-intl";

const COLORS = {
  present: "#22c55e",
  late: "#f59e0b",
  absent: "#ef4444",
  checkedOut: "#6b7280",
};

export default function DashboardPage() {
  const t = useTranslations("Dashboard");
  const tAttendance = useTranslations("Attendance");
  const locale = useLocale();
  const dateLocale = locale === "ar" ? "ar-SA-u-nu-latn" : "en-US";
  const timeLocale = locale === "ar" ? "ar-SA-u-nu-latn" : "en-US";
  const { user, companyName } = useAuthStore();
  const queryClient = useQueryClient();
  const [dateRange] = useState<DateRange>(getDefaultDateRange());
  const { data: dashboardData, isLoading, isError, refetch } = useDashboardData(dateRange);
  const stats = dashboardData?.stats;
  const { data: attendanceData } = useAttendance();
  const { data: employees = [] } = useEmployees();
  const { data: geofences = [] } = useGeofences();
  const { data: initialTracking = [] } = useLiveTracking();
  const { employees: liveTracking } = useLiveTrackingSocket(initialTracking);

  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [realtimePulse, setRealtimePulse] = useState(false);
  const lastRealtimeToastAtRef = useRef(0);
  const realtimePulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { role } = useAuthStore();
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
        value: stats?.presentToday ?? 0,
        icon: UserCheck,
        color: COLORS.present,
      },
      {
        name: t("statusLate"),
        value: stats?.lateToday ?? 0,
        icon: Clock,
        color: COLORS.late,
      },
      {
        name: t("statusAbsent"),
        value: stats?.absentToday ?? 0,
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
      .slice(0, 5);
  }, [attendanceData, dateRange]);

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

            {/* Attendance records shortcut */}
            <div className="flex justify-end">
              <Link
                href="/attendance"
                className="flex items-center gap-2 text-sm bg-card px-3 py-2 rounded-xl border border-border shadow-sm hover:bg-muted transition-colors text-muted-foreground"
              >
                <Calendar className="w-4 h-4 text-primary" />
                <span className="font-medium">{tAttendance("title")}</span>
              </Link>
            </div>

            <KpiTicker stats={stats} liveTracking={liveTracking} />

            <div className="grid grid-cols-1 gap-4">
              <LiveMapWidget liveTracking={liveTracking} geofences={geofences} />
            </div>

            <div className="space-y-8 animate-fade-in">
              <AttendancePieChart data={attendanceDistribution} />

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
                        key: "department",
                        header: t("department"),
                        sortable: true,
                        filterable: true,
                        sortValue: (r) => {
                          const emp = employees.find((e) => String(e.id) === String(r.employeeId));
                          return emp?.department || "-";
                        },
                        cell: (r) => {
                          const emp = employees.find((e) => String(e.id) === String(r.employeeId));
                          return emp?.department || "-";
                        },
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
                        sortValue: (r) => r.status,
                        cell: (r) => (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${
                              r.status === "present"
                                ? "bg-primary/10 text-primary ring-emerald-400/20"
                                : r.status === "late"
                                  ? "bg-[hsl(48_96%_53%/0.1)] text-[hsl(48_96%_53%)] ring-amber-400/20"
                                  : "bg-destructive/10 text-destructive ring-red-400/20"
                            }`}
                          >
                            {(() => {
                              const labels: Record<string, string> = {
                                present: t("statusPresent"),
                                late: t("statusLate"),
                                absent: t("statusAbsent"),
                                checked_out: t("statusCheckedOut"),
                              };
                              return labels[r.status] || r.status;
                            })()}
                          </span>
                        ),
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
