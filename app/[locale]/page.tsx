"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, Clock, MapPin, Target, RotateCw, RotateCcw } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import MainLayout from "@/components/shared/MainLayout";
import {
  useDashboardStats,
  useAttendance,
  useEmployees,
  useDashboardTrends,
  useGeofences,
  queryKeys,
} from "@/hooks/useApi";
import { useQueryClient } from "@tanstack/react-query";
import { ErrorState } from "@/components/shared/StateViews";
import DashboardSkeleton from "@/components/shared/Skeletons/DashboardSkeleton";
import { DataTable } from "@/components/shared/DataTable/DataTable";
import type { DashboardStats, AttendanceRecord } from "@/lib/types/trackingTypes";
import { useAuthStore } from "@/stores/useAuthStore";
import AttendancePieChart from "@/components/dashboard/AttendancePieChart";
import InsightsBarChart from "@/components/dashboard/InsightsBarChart";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import {
  SortableDashboardCard,
  type DashboardCardData,
} from "@/components/shared/SortableDashboardCard";
import {
  DateRangePicker,
  getDefaultDateRange,
  type DateRange,
} from "@/components/shared/DateRangePicker";
import { toastSuccess } from "@/hooks/use-toast";
import { hapticTap } from "@/lib/utils/haptics";

const COLORS = {
  present: "#2BA88C",
  late: "#D4952A",
  absent: "#CC3D3D",
  checkedOut: "#6B7280",
};

const statusLabels: Record<string, string> = {
  present: "حاضر",
  late: "متأخر",
  absent: "غائب",
  checked_out: "منصرف",
};

const LAYOUT_STORAGE_KEY = "trax_dashboard_layout";
const DEFAULT_CARD_IDS = [
  "totalEmployees",
  "presentToday",
  "lateToday",
  "absentToday",
  "totalGeofences",
  "onTimeRate",
];

function loadCardOrder(): string[] {
  if (typeof window === "undefined") return DEFAULT_CARD_IDS;
  try {
    const stored = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as string[];
      if (
        parsed.length === DEFAULT_CARD_IDS.length &&
        parsed.every((id) => DEFAULT_CARD_IDS.includes(id))
      ) {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_CARD_IDS;
}

function saveCardOrder(order: string[]) {
  try {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(order));
  } catch {}
}

export default function DashboardPage() {
  const { user, companyName } = useAuthStore();
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const { data: stats, isLoading, isError, refetch } = useDashboardStats(dateRange);
  const { data: attendanceData } = useAttendance();
  const { data: employees = [] } = useEmployees();

  const { data: trends } = useDashboardTrends(dateRange);
  useGeofences();
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cardOrder, setCardOrder] = useState<string[]>(DEFAULT_CARD_IDS);
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
    setCardOrder(loadCardOrder());
  }, []);

  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }));
    const interval = setInterval(() => {
      setLastUpdated(
        new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })
      );
    }, 30000);
    return () => clearInterval(interval);
  }, []);

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
            toastSuccess("تم تحديث بيانات الحضور");
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
  }, [queryClient]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetch(),
        queryClient.invalidateQueries({ queryKey: queryKeys.attendance }),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleResetLayout = () => {
    hapticTap();
    setCardOrder(DEFAULT_CARD_IDS);
    saveCardOrder(DEFAULT_CARD_IDS);
    toastSuccess("تم إعادة ترتيب البطاقات");
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCardOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        saveCardOrder(newOrder);
        return newOrder;
      });
      hapticTap();
    }
  };

  const safeStats: DashboardStats = useMemo(
    () =>
      stats ?? {
        totalEmployees: 0,
        activeEmployees: 0,
        inactiveEmployees: 0,
        presentToday: 0,
        absentToday: 0,
        lateToday: 0,
        checkedOutToday: 0,
        onTimeRate: 0,
        avgCheckInTime: "N/A",
        avgWorkedHours: 0,
        totalGeofences: 0,
        fieldToday: 0,
        officeToday: 0,
        hourlyToday: 0,
      },
    [stats]
  );

  const allCards: Record<string, DashboardCardData> = useMemo(() => {
    return {
      totalEmployees: {
        id: "totalEmployees",
        title: "إجمالي الموظفين",
        value: safeStats.totalEmployees,
        detailsPageUrl: "/employees",
        icon: Users,
        iconBg: "bg-primary/10 text-primary",
        trend: trends?.employeeGrowth ?? 0,
      },
      presentToday: {
        id: "presentToday",
        title: "حاضرون اليوم",
        value: safeStats.presentToday,
        detailsPageUrl: "/attendance",
        icon: UserCheck,
        iconBg: "bg-primary/10 text-primary",
        trend: trends?.presentChange ?? 0,
      },
      lateToday: {
        id: "lateToday",
        title: "متأخرون اليوم",
        value: safeStats.lateToday,
        detailsPageUrl: "/attendance",
        icon: Clock,
        iconBg: "bg-accent/10 text-accent",
        trend: trends?.lateChange ?? 0,
      },
      absentToday: {
        id: "absentToday",
        title: "غائبون اليوم",
        value: safeStats.absentToday,
        detailsPageUrl: "/attendance",
        icon: UserX,
        iconBg: "bg-destructive/10 text-destructive",
        trend: trends?.absentChange ?? 0,
      },
      totalGeofences: {
        id: "totalGeofences",
        title: "النطاقات الجغرافية",
        value: safeStats.totalGeofences,
        detailsPageUrl: "/geofences",
        icon: MapPin,
        iconBg: "bg-chart-2/10 text-chart-2",
      },
      onTimeRate: {
        id: "onTimeRate",
        title: "نسبة الالتزام بالوقت",
        value: safeStats.onTimeRate,
        detailsPageUrl: "/attendance/reports",
        icon: Target,
        iconBg: "bg-primary/10 text-primary",
        trend: trends?.onTimeRateChange ?? 0,
      },
    };
  }, [safeStats, trends]);

  const modeSummary = useMemo(
    () => [
      { label: "ميداني", value: safeStats.fieldToday, color: "text-primary" },
      {
        label: "مكتبي",
        value: safeStats.officeToday,
        color: "text-primary text-primary",
      },
      {
        label: "بالساعة",
        value: safeStats.hourlyToday,
        color: "text-[hsl(48_96%_53%)]",
      },
    ],
    [safeStats]
  );

  const orderedCards = useMemo(
    () => cardOrder.map((id) => allCards[id]).filter(Boolean),
    [cardOrder, allCards]
  );

  const attendanceDistribution = useMemo(
    () => [
      {
        name: statusLabels.present,
        value: safeStats.presentToday,
        icon: UserCheck,
        color: COLORS.present,
      },
      {
        name: statusLabels.late,
        value: safeStats.lateToday,
        icon: Clock,
        color: COLORS.late,
      },
      {
        name: statusLabels.absent,
        value: safeStats.absentToday,
        icon: UserX,
        color: COLORS.absent,
      },
    ],
    [safeStats]
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
                    {new Date().toLocaleDateString("ar-SA", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <h1 className="text-2xl sm:text-3xl font-black text-primary-foreground mt-1">
                    مرحباً، {user?.name?.split(" ")[0] ?? "مدير"}
                    {companyName && (
                      <span className="text-primary text-xl font-semibold">
                        {" "}
                        — {companyName}
                      </span>
                    )}
                  </h1>
                  <p className="text-muted-foreground/80 text-sm mt-1">
                    نظرة شاملة على الحضور والمتابعة في الوقت الحقيقي
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Attendance rate ring */}
                  <div className="relative w-16 h-16 shrink-0">
                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 56 56">
                      <circle
                        cx="28"
                        cy="28"
                        r="22"
                        fill="none"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="5"
                      />
                      <circle
                        cx="28"
                        cy="28"
                        r="22"
                        fill="none"
                        stroke="url(#onTimeGradient)"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 22}`}
                        strokeDashoffset={`${2 * Math.PI * 22 * (1 - (safeStats.onTimeRate || 0) / 100)}`}
                        className="transition-all duration-700"
                      />
                      <defs>
                        <linearGradient id="onTimeGradient" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#34d399" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-primary-foreground text-xs font-bold">
                        {Math.round(safeStats.onTimeRate || 0)}%
                      </span>
                    </div>
                  </div>
                  <div className="text-primary-foreground">
                    <p className="text-xs text-muted-foreground">نسبة الحضور</p>
                    <p className="text-lg font-bold">
                      {safeStats.presentToday} / {safeStats.totalEmployees}
                    </p>
                    <p className="text-xs text-muted-foreground">حاضر اليوم</p>
                  </div>
                  <div className="flex flex-col gap-2 mr-2">
                    <button
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className={`p-2 rounded-xl bg-muted/50 hover:bg-muted text-foreground transition-colors ${isRefreshing ? "opacity-50 cursor-not-allowed" : ""}`}
                      aria-label="تحديث"
                    >
                      <RotateCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                    </button>
                    <button
                      onClick={handleResetLayout}
                      className="p-2 rounded-xl bg-muted/50 hover:bg-muted text-foreground transition-colors"
                      aria-label="إعادة ترتيب"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick stats strip */}
              <div className="mt-4 sm:mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {[
                  { label: "متوسط الحضور", value: safeStats.avgCheckInTime },
                  { label: "حاضرون", value: safeStats.presentToday },
                  { label: "متأخرون", value: safeStats.lateToday },
                  { label: "غائبون", value: safeStats.absentToday },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg bg-card px-2 sm:px-3 py-2 text-center"
                  >
                    <p className="text-lg sm:text-xl font-black text-foreground">{item.value}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>

              {/* Attendance mode breakdown */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {modeSummary.map(
                  (m) =>
                    m.value > 0 && (
                      <div
                        key={m.label}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card text-xs font-medium"
                      >
                        <span className={`${m.color}`}>{m.value}</span>
                        <span className="text-muted-foreground">{m.label}</span>
                      </div>
                    )
                )}
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
                        <span className="font-bold">مباشر</span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                  آخر تحديث: {lastUpdated}
                </div>
              )}
            </div>

            {/* Date range picker — standalone */}
            <div className="flex justify-end">
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>

            <div className="space-y-8 animate-fade-in">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={cardOrder} strategy={rectSortingStrategy}>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {orderedCards.map((stat, index) => (
                      <div
                        key={stat.id}
                        className={`animate-stagger-${Math.min(index + 1, 6)} hover:-translate-y-1 transition-transform duration-200`}
                      >
                        <SortableDashboardCard stat={stat} />
                      </div>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <Card className="border border-border/50 bg-card">
                <CardHeader className="pb-6">
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-primary" />
                    <div>
                      <CardTitle className="text-2xl font-bold text-foreground">
                        نظرة عامة على الحضور
                      </CardTitle>
                      <p className="text-sm text-muted-foreground text-muted-foreground mt-1">
                        تحليل شامل لإحصائيات الحضور والانصراف
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-8">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <AttendancePieChart data={attendanceDistribution} />
                    <InsightsBarChart data={attendanceDistribution} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border/50 bg-card">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <UserCheck className="w-5 h-5 text-primary" />
                      <div>
                        <CardTitle className="text-base font-bold text-foreground">
                          أحدث سجلات الحضور
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          آخر عمليات تسجيل الحضور اليوم
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
                        header: "الموظف",
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
                        header: "القسم",
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
                        header: "وقت الحضور",
                        sortable: true,
                        sortValue: (r) => r.checkInTime || "",
                        cell: (r) => r.checkInTime || "-",
                      },
                      {
                        key: "status",
                        header: "الحالة",
                        sortable: true,
                        sortValue: (r) => r.status,
                        cell: (r) => (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${
                              r.status === "present"
                                ? "bg-primary/10 text-primary ring-emerald-400/20"
                                : r.status === "late"
                                  ? "bg-[hsl(48_96%_53%/0.1)]0/10 text-[hsl(48_96%_53%)] ring-amber-400/20"
                                  : "bg-destructive/10 text-destructive ring-red-400/20"
                            }`}
                          >
                            {statusLabels[r.status] || r.status}
                          </span>
                        ),
                      },
                      {
                        key: "geofenceName",
                        header: "الموقع",
                        filterable: true,
                        sortValue: (r) => r.geofenceName || "",
                        cell: (r) => r.geofenceName || "-",
                      },
                    ]}
                    data={recentAttendance}
                    searchPlaceholder="بحث في السجلات..."
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
