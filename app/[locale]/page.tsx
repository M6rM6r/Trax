"use client";

import { memo, useMemo, useState, useEffect, useRef, type ComponentType } from "react";
import { Cell } from "recharts";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  MapPin,
  Target,
  PieChart as PieChartIcon,
  BarChart4,
  ChartSpline,
  RotateCw,
  RotateCcw,
} from "lucide-react";
import { useLocale } from "next-intl";
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
import { LoadingSkeleton, ErrorState } from "@/components/shared/StateViews";
import { DataTable } from "@/components/shared/DataTable/DataTable";
import type { DashboardStats, AttendanceRecord } from "@/lib/types/trackingTypes";
import dynamic from "next/dynamic";
import { useAuthStore } from "@/stores/useAuthStore";
import OnboardingBanner from "@/components/shared/OnboardingBanner";
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

/* eslint-disable @typescript-eslint/no-explicit-any */
const PieChart: ComponentType<any> = dynamic(
  () => import("recharts").then((mod) => mod.PieChart as ComponentType<any>),
  { ssr: false }
);
const Pie: ComponentType<any> = dynamic(
  () => import("recharts").then((mod) => mod.Pie as ComponentType<any>),
  { ssr: false }
);
const ResponsiveContainer: ComponentType<any> = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer as ComponentType<any>),
  { ssr: false }
);
const Tooltip: ComponentType<any> = dynamic(
  () => import("recharts").then((mod) => mod.Tooltip as ComponentType<any>),
  { ssr: false }
);
const LineChart: ComponentType<any> = dynamic(
  () => import("recharts").then((mod) => mod.LineChart as ComponentType<any>),
  { ssr: false }
);
const Line: ComponentType<any> = dynamic(
  () => import("recharts").then((mod) => mod.Line as ComponentType<any>),
  { ssr: false }
);
const XAxis: ComponentType<any> = dynamic(
  () => import("recharts").then((mod) => mod.XAxis as ComponentType<any>),
  { ssr: false }
);
const YAxis: ComponentType<any> = dynamic(
  () => import("recharts").then((mod) => mod.YAxis as ComponentType<any>),
  { ssr: false }
);
const CartesianGrid: ComponentType<any> = dynamic(
  () => import("recharts").then((mod) => mod.CartesianGrid as ComponentType<any>),
  { ssr: false }
);
const Legend: ComponentType<any> = dynamic(
  () => import("recharts").then((mod) => mod.Legend as ComponentType<any>),
  { ssr: false }
);
/* eslint-enable @typescript-eslint/no-explicit-any */

const COLORS = {
  present: "#16A34A",
  late: "#F59E0B",
  absent: "#DC2626",
  checkedOut: "#6B7280",
};

const statusLabels: Record<string, string> = {
  present: "حاضر",
  late: "متأخر",
  absent: "غائب",
  checked_out: "منصرف",
};

interface EnhancedPieChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
    icon: React.ComponentType<any>;
  }>;
}

const EnhancedPieChart = memo(({ data }: EnhancedPieChartProps) => {
  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-800 backdrop-blur-sm border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-2xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
            <p className="font-bold text-gray-900 dark:text-slate-100">{data.name}</p>
          </div>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            العدد: <span className="font-semibold">{data.value.toLocaleString()}</span>
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            {((data.value / total) * 100).toFixed(1)}% من الإجمالي
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
          <PieChartIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">توزيع الحضور</h3>
          <p className="text-sm text-gray-600 dark:text-slate-400">نسبة كل حالة من الإجمالي</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        <div className="relative">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="#fff"
                    strokeWidth={2}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <div className="text-center">
              <div className="text-2xl font-black text-gray-900 dark:text-slate-100">
                {total.toLocaleString()}
              </div>
              <div className="text-xs font-medium text-gray-500 dark:text-slate-400">الإجمالي</div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {data.map((item) => {
            const Icon = item.icon;
            const percentage = ((item.value / total) * 100).toFixed(1);
            return (
              <div
                key={item.name}
                className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-slate-700 hover:shadow-md transition-all duration-300 bg-white dark:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: item.color }} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-slate-100 text-sm">
                      {item.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-slate-400">{percentage}%</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900 dark:text-slate-100">
                    {item.value.toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
EnhancedPieChart.displayName = "EnhancedPieChart";

interface InsightsBarChartProps {
  data: Array<{ name: string; value: number; color: string }>;
}

const InsightsBarChart = memo(({ data }: InsightsBarChartProps) => {
  const maxValue = useMemo(() => Math.max(...data.map((d) => d.value)), [data]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
          <BarChart4 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">مقارنة الحضور</h3>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            مقارنة مرئية بين الحالات المختلفة
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {data.map((item) => {
          const percentage = (item.value / maxValue) * 100;
          return (
            <div key={item.name} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700 dark:text-slate-300 text-sm">
                  {item.name}
                </span>
                <span className="font-bold text-gray-900 dark:text-slate-100">
                  {item.value.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: item.color,
                    boxShadow: `0 2px 4px ${item.color}40`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
InsightsBarChart.displayName = "InsightsBarChart";

interface WeeklyTrendsChartProps {
  data: Array<{ day: string; present: number; late: number; absent: number }>;
}

const WEEK_ORDER = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

const WeeklyTrendsChart = memo(({ data: rawData }: WeeklyTrendsChartProps) => {
  const data = useMemo(() => {
    const sorted = [...rawData].sort(
      (a, b) => WEEK_ORDER.indexOf(a.day) - WEEK_ORDER.indexOf(b.day)
    );
    return sorted;
  }, [rawData]);
  const ChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 backdrop-blur-sm border border-gray-200 dark:border-slate-700 rounded-xl p-3 shadow-2xl">
          <p className="font-bold text-gray-900 dark:text-slate-100 mb-2">{label}</p>
          {payload.map((entry: any, i: number) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-600 dark:text-slate-400">{entry.name}:</span>
              <span className="font-semibold text-gray-900 dark:text-slate-100">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
          <ChartSpline className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">الاتجاه الأسبوعي</h3>
          <p className="text-sm text-gray-600 dark:text-slate-400">تطور الحضور على مدار الأسبوع</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />
          <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#64748b" }} />
          <YAxis tick={{ fontSize: 12, fill: "#64748b" }} allowDecimals={false} />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="present"
            name="حاضر"
            stroke="#16A34A"
            strokeWidth={2.5}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="late"
            name="متأخر"
            stroke="#F59E0B"
            strokeWidth={2.5}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="absent"
            name="غائب"
            stroke="#DC2626"
            strokeWidth={2.5}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});
WeeklyTrendsChart.displayName = "WeeklyTrendsChart";

interface PeakHoursHeatmapProps {
  data: Array<{ hour: string; count: number }>;
}

const PeakHoursHeatmap = memo(({ data }: PeakHoursHeatmapProps) => {
  const maxCount = useMemo(() => Math.max(...data.map((d) => d.count), 1), [data]);

  const getHeatColor = (count: number) => {
    const ratio = count / maxCount;
    if (ratio === 0) return "bg-gray-100 dark:bg-slate-700/50";
    if (ratio < 0.25) return "bg-blue-100 dark:bg-blue-900/30";
    if (ratio < 0.5) return "bg-blue-300 dark:bg-blue-700/50";
    if (ratio < 0.75) return "bg-blue-500 dark:bg-blue-600/70";
    return "bg-blue-700 dark:bg-blue-500";
  };

  const getTextColor = (count: number) => {
    const ratio = count / maxCount;
    return ratio >= 0.5 ? "text-white" : "text-gray-700 dark:text-slate-300";
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
          <Clock className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">ساعات الذروة</h3>
          <p className="text-sm text-gray-600 dark:text-slate-400">توزيع أوقات الحضور والانصراف</p>
        </div>
      </div>
      <div
        className="grid grid-cols-7 sm:grid-cols-14 gap-1.5"
        role="img"
        aria-label="خريطة حرارية لساعات الذروة"
      >
        {data.map((item) => (
          <div
            key={item.hour}
            className={`h-16 rounded-lg flex flex-col items-center justify-center transition-all duration-300 hover:scale-110 cursor-default ${getHeatColor(item.count)} ${getTextColor(item.count)}`}
            title={`${item.hour}: ${item.count} موظف`}
          >
            <span className="text-[10px] font-medium opacity-80">{item.hour}</span>
            <span className="text-sm font-bold">{item.count}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-500 dark:text-slate-400">
        <span>أقل</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 rounded bg-gray-100 dark:bg-slate-700/50" />
          <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900/30" />
          <div className="w-4 h-4 rounded bg-blue-300 dark:bg-blue-700/50" />
          <div className="w-4 h-4 rounded bg-blue-500 dark:bg-blue-600/70" />
          <div className="w-4 h-4 rounded bg-blue-700 dark:bg-blue-500" />
        </div>
        <span>أكثر</span>
      </div>
    </div>
  );
});
PeakHoursHeatmap.displayName = "PeakHoursHeatmap";

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
  const locale = useLocale();
  const { user, companyName } = useAuthStore();
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const { data: stats, isLoading, isError, refetch } = useDashboardStats(dateRange);
  const { data: attendanceData } = useAttendance();
  const { data: employees = [] } = useEmployees();

  const { data: trends } = useDashboardTrends(dateRange);
  const { data: geofences = [] } = useGeofences();
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cardOrder, setCardOrder] = useState<string[]>(DEFAULT_CARD_IDS);
  const [realtimePulse, setRealtimePulse] = useState(false);
  const lastRealtimeToastAtRef = useRef(0);
  const realtimePulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  }, [stats]);

  // Real-time WebSocket listener for attendance updates
  useEffect(() => {
    let socket: import("socket.io-client").Socket | null = null;

    async function initSocket() {
      try {
        const { io } = await import("socket.io-client");
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8080";
        socket = io(wsUrl, { transports: ["websocket"], reconnection: true });

        socket.on("attendance:update", () => {
          setRealtimePulse(true);
          if (realtimePulseTimeoutRef.current) {
            clearTimeout(realtimePulseTimeoutRef.current);
          }
          realtimePulseTimeoutRef.current = setTimeout(() => setRealtimePulse(false), 2000);

          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboardTrends });
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
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardTrends }),
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
      },
    [stats]
  );

  const allCards: Record<string, DashboardCardData> = useMemo(() => {
    const weekly = trends?.weeklyData ?? [];
    return {
      totalEmployees: {
        id: "totalEmployees",
        title: "إجمالي الموظفين",
        value: safeStats.totalEmployees,
        detailsPageUrl: `/${locale}/employees`,
        icon: Users,
        accentColor: "bg-blue-500",
        iconBg: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400",
        trend: trends?.employeeGrowth ?? 0,
        sparklineData: weekly.map((d) => d.present + d.late),
      },
      presentToday: {
        id: "presentToday",
        title: "حاضرون اليوم",
        value: safeStats.presentToday,
        detailsPageUrl: `/${locale}/attendance`,
        icon: UserCheck,
        accentColor: "bg-emerald-500",
        iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400",
        trend: trends?.presentChange ?? 0,
        sparklineData: weekly.map((d) => d.present),
      },
      lateToday: {
        id: "lateToday",
        title: "متأخرون اليوم",
        value: safeStats.lateToday,
        detailsPageUrl: `/${locale}/attendance`,
        icon: Clock,
        accentColor: "bg-amber-500",
        iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400",
        trend: trends?.lateChange ?? 0,
        sparklineData: weekly.map((d) => d.late),
      },
      absentToday: {
        id: "absentToday",
        title: "غائبون اليوم",
        value: safeStats.absentToday,
        detailsPageUrl: `/${locale}/attendance`,
        icon: UserX,
        accentColor: "bg-red-500",
        iconBg: "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400",
        trend: trends?.absentChange ?? 0,
        sparklineData: weekly.map((d) => d.absent),
      },
      totalGeofences: {
        id: "totalGeofences",
        title: "النطاقات الجغرافية",
        value: safeStats.totalGeofences,
        detailsPageUrl: `/${locale}/geofences`,
        icon: MapPin,
        accentColor: "bg-indigo-500",
        iconBg: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400",
      },
      onTimeRate: {
        id: "onTimeRate",
        title: "نسبة الالتزام بالوقت",
        value: safeStats.onTimeRate,
        detailsPageUrl: `/${locale}/attendance/reports`,
        icon: Target,
        accentColor: "bg-violet-500",
        iconBg: "bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400",
        trend: trends?.onTimeRateChange ?? 0,
        sparklineData: weekly.map((d) => d.avgWorkedHours ?? 0),
      },
    };
  }, [safeStats, locale, trends]);

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

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 min-h-screen">
        {/* Hero greeting banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-4 sm:p-6 shadow-xl">
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 right-24 w-24 h-24 rounded-full bg-white/5" />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-blue-200 text-sm font-medium">
                {new Date().toLocaleDateString("ar-SA", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
                مرحباً، {user?.name?.split(" ")[0] ?? "مدير"}
                {companyName && (
                  <span className="text-blue-300 text-xl font-semibold"> — {companyName}</span>
                )}
              </h1>
              <p className="text-blue-200/80 text-sm mt-1">
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
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="5"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="22"
                    fill="none"
                    stroke="white"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 22}`}
                    strokeDashoffset={`${2 * Math.PI * 22 * (1 - (safeStats.onTimeRate || 0) / 100)}`}
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {Math.round(safeStats.onTimeRate || 0)}%
                  </span>
                </div>
              </div>
              <div className="text-white">
                <p className="text-xs text-blue-200">نسبة الحضور</p>
                <p className="text-lg font-bold">
                  {safeStats.presentToday} / {safeStats.totalEmployees}
                </p>
                <p className="text-xs text-blue-200">حاضر اليوم</p>
              </div>
              <div className="flex flex-col gap-2 mr-2">
                <button
                  onClick={handleRefresh}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                  aria-label="تحديث"
                >
                  <RotateCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                </button>
                <button
                  onClick={handleResetLayout}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                  aria-label="إعادة ترتيب"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick stats strip */}
          <div className="relative mt-4 sm:mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {[
              { label: "متوسط الحضور", value: safeStats.avgCheckInTime },
              { label: "حاضرون", value: safeStats.presentToday },
              { label: "متأخرون", value: safeStats.lateToday },
              { label: "غائبون", value: safeStats.absentToday },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl bg-white/10 px-2 sm:px-3 py-2 text-center backdrop-blur-sm"
              >
                <p className="text-lg sm:text-xl font-black text-white">{item.value}</p>
                <p className="text-[10px] sm:text-xs text-blue-200">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Last updated + realtime pulse */}
          {lastUpdated && (
            <div className="relative mt-3 flex items-center gap-1.5 text-xs text-blue-300">
              {realtimePulse && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                </span>
              )}
              آخر تحديث: {lastUpdated}
            </div>
          )}
        </div>

        {/* Onboarding checklist — shown to new accounts */}
        <OnboardingBanner hasEmployees={employees.length > 0} hasGeofences={geofences.length > 0} />

        {/* Date range picker — standalone */}
        <div className="flex justify-end">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>

        {isLoading && <LoadingSkeleton variant="cards" />}
        {isError && <ErrorState onRetry={() => refetch()} />}
        {!isLoading && !isError && (
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
                      <SortableDashboardCard stat={stat} locale={locale} />
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50/50 dark:from-slate-800 dark:to-slate-900 animate-slide-up">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                      نظرة عامة على الحضور
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                      تحليل شامل لإحصائيات الحضور والانصراف
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-8">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <EnhancedPieChart data={attendanceDistribution} />
                  <InsightsBarChart data={attendanceDistribution} />
                </div>
              </CardContent>
            </Card>

            {trends?.weeklyData && <WeeklyTrendsChart data={trends.weeklyData} />}

            <Card className="border-0 shadow-lg dark:bg-slate-800">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-gray-900 dark:text-slate-100">
                        أحدث سجلات الحضور
                      </CardTitle>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
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
                        <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
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
                        const emp = employees.find((e) => e.id === r.employeeId);
                        return emp?.department || "-";
                      },
                      cell: (r) => {
                        const emp = employees.find((e) => e.id === r.employeeId);
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
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            r.status === "present"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : r.status === "late"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
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
        )}
      </div>
    </MainLayout>
  );
}
