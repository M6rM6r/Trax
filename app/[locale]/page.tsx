"use client";

import { memo, useMemo, type ComponentType } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  MapPin,
  TrendingUp,
  Target,
  PieChart as PieChartIcon,
  BarChart4,
  ChartSpline,
  ArrowRight,
} from "lucide-react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@radix-ui/react-separator";
import FullPageHead from "@/components/shared/FullPageHead";
import MainLayout from "@/components/shared/MainLayout";
import { useDashboardStats, useAttendance } from "@/hooks/useApi";
import { LoadingSkeleton, ErrorState } from "@/components/shared/StateViews";
import { DataTable, type Column } from "@/components/shared/DataTable/DataTable";
import { mockEmployees } from "@/lib/mockData/trackingMockData";
import type { DashboardStats, AttendanceRecord } from "@/lib/types/trackingTypes";
import dynamic from "next/dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */
const PieChart: ComponentType<any> = dynamic(
  () => import("recharts").then((mod) => mod.PieChart as ComponentType<any>),
  { ssr: false }
);
const Pie: ComponentType<any> = dynamic(
  () => import("recharts").then((mod) => mod.Pie as ComponentType<any>),
  { ssr: false }
);
const Cell: ComponentType<any> = dynamic(
  () => import("recharts").then((mod) => mod.Cell as ComponentType<any>),
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

interface DashboardCardProps {
  stat: {
    title: string;
    value: number;
    detailsPageUrl: string;
    icon: React.ComponentType<any>;
    gradient: string;
    iconColor: string;
    trend?: number;
  };
  locale: string;
}

const DashboardCard = memo(({ stat, locale }: DashboardCardProps) => {
  const Icon = stat.icon;
  return (
    <Card
      className={`relative overflow-hidden rounded-2xl shadow-lg border-0 bg-gradient-to-br ${stat.gradient} text-white transition-all duration-300 hover:shadow-xl hover:scale-[1.02]`}
    >
      <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />
      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/20 shadow-inner">
              <Icon className={`w-6 h-6 ${stat.iconColor}`} />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">{stat.title}</CardTitle>
              {stat.trend !== undefined && (
                <div
                  className={`flex items-center gap-1 text-xs mt-1 ${
                    stat.trend >= 0 ? "text-green-200" : "text-red-200"
                  }`}
                >
                  <TrendingUp className={`w-3 h-3 ${stat.trend >= 0 ? "" : "rotate-180"}`} />
                  <span>{Math.abs(stat.trend)}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <p className="text-4xl font-black mb-4">{stat.value.toLocaleString()}</p>
        <div className="w-full h-px bg-white/30 mb-4" />
        <Link href={stat.detailsPageUrl} className="block w-full">
          <Button
            size="lg"
            variant="secondary"
            className="w-full flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white border-0 rounded-xl transition-all duration-300 hover:scale-105"
          >
            <span className="font-medium">عرض التفاصيل</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
});
DashboardCard.displayName = "DashboardCard";

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
        <div className="bg-white backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-2xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
            <p className="font-bold text-gray-900">{data.name}</p>
          </div>
          <p className="text-sm text-gray-600">
            العدد: <span className="font-semibold">{data.value.toLocaleString()}</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {((data.value / total) * 100).toFixed(1)}% من الإجمالي
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
          <PieChartIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">توزيع الحضور</h3>
          <p className="text-sm text-gray-600">نسبة كل حالة من الإجمالي</p>
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
              <div className="text-2xl font-black text-gray-900">{total.toLocaleString()}</div>
              <div className="text-xs font-medium text-gray-500">الإجمالي</div>
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
                className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300 bg-white"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: item.color }} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{item.name}</div>
                    <div className="text-xs text-gray-500">{percentage}%</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{item.value.toLocaleString()}</div>
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
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
          <BarChart4 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">مقارنة الحضور</h3>
          <p className="text-sm text-gray-600">مقارنة مرئية بين الحالات المختلفة</p>
        </div>
      </div>

      <div className="space-y-4">
        {data.map((item) => {
          const percentage = (item.value / maxValue) * 100;
          return (
            <div key={item.name} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700 text-sm">{item.name}</span>
                <span className="font-bold text-gray-900">{item.value.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
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

export default function DashboardPage() {
  const locale = useLocale();
  const { data: stats, isLoading, isError, refetch } = useDashboardStats();
  const { data: attendanceData } = useAttendance();

  const safeStats: DashboardStats = stats ?? {
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    checkedOutToday: 0,
    onTimeRate: 0,
    avgCheckInTime: "N/A",
    totalGeofences: 0,
  };

  const dashboardCards = useMemo(
    () => [
      {
        title: "إجمالي الموظفين",
        value: safeStats.totalEmployees,
        detailsPageUrl: `/${locale}/employees`,
        icon: Users,
        gradient: "from-indigo-500 via-purple-600 to-blue-700",
        iconColor: "text-indigo-100",
        trend: 12.5,
      },
      {
        title: "حاضرون اليوم",
        value: safeStats.presentToday,
        detailsPageUrl: `/${locale}/attendance`,
        icon: UserCheck,
        gradient: "from-emerald-500 via-green-600 to-teal-700",
        iconColor: "text-emerald-100",
        trend: 8.3,
      },
      {
        title: "متأخرون اليوم",
        value: safeStats.lateToday,
        detailsPageUrl: `/${locale}/attendance`,
        icon: Clock,
        gradient: "from-amber-500 via-orange-600 to-red-600",
        iconColor: "text-amber-100",
        trend: -3.2,
      },
      {
        title: "غائبون اليوم",
        value: safeStats.absentToday,
        detailsPageUrl: `/${locale}/attendance`,
        icon: UserX,
        gradient: "from-red-500 via-rose-600 to-pink-700",
        iconColor: "text-red-100",
        trend: -1.5,
      },
      {
        title: "النطاقات الجغرافية",
        value: safeStats.totalGeofences,
        detailsPageUrl: `/${locale}/geofences`,
        icon: MapPin,
        gradient: "from-cyan-500 via-blue-600 to-indigo-700",
        iconColor: "text-cyan-100",
      },
      {
        title: "نسبة الالتزام بالوقت",
        value: safeStats.onTimeRate,
        detailsPageUrl: `/${locale}/attendance/reports`,
        icon: Target,
        gradient: "from-violet-500 via-purple-600 to-fuchsia-700",
        iconColor: "text-violet-100",
        trend: 5.0,
      },
    ],
    [safeStats, locale]
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

  const recentAttendance = useMemo(() => (attendanceData ?? []).slice(0, 5), [attendanceData]);

  return (
    <MainLayout>
      <div className="p-6 space-y-8 min-h-screen">
        <FullPageHead
          head="لوحة تحكم الحضور والمتابعة"
          description="نظرة شاملة على حضور الموظفين وتتبعهم في الوقت الحقيقي"
          Icon={<ChartSpline className="w-7 h-7" />}
          LeftSection={
            <div className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
              <Clock className="w-5 h-5 text-sky-700 dark:text-sky-400" />
              <span className="font-semibold text-gray-700 dark:text-slate-300">
                متوسط وقت الحضور:{" "}
                <span className="text-sky-700 dark:text-sky-400 font-bold">
                  {safeStats.avgCheckInTime}
                </span>
              </span>
            </div>
          }
        />

        <Separator />
        {isLoading && <LoadingSkeleton variant="cards" />}
        {isError && <ErrorState onRetry={() => refetch()} />}
        {!isLoading && !isError && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {dashboardCards.map((stat, index) => (
                <div key={index} className={`animate-stagger-${index + 1}`}>
                  <DashboardCard stat={stat} locale={locale} />
                </div>
              ))}
            </div>

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

            <Card className="border-0 shadow-lg dark:bg-slate-800">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-gray-900 dark:text-slate-100">
                      أحدث سجلات الحضور
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-slate-400">
                      آخر عمليات تسجيل الحضور اليوم
                    </p>
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
                        const emp = mockEmployees.find((e) => e.id === r.employeeId);
                        return emp?.department || "-";
                      },
                      cell: (r) => {
                        const emp = mockEmployees.find((e) => e.id === r.employeeId);
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
