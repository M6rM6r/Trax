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
import { mockDashboardStats, mockAttendance, mockEmployees } from "@/lib/mockData/trackingMockData";
import dynamic from "next/dynamic";

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
  const stats = mockDashboardStats;

  const dashboardCards = useMemo(
    () => [
      {
        title: "إجمالي الموظفين",
        value: stats.totalEmployees,
        detailsPageUrl: `/${locale}/employees`,
        icon: Users,
        gradient: "from-indigo-500 via-purple-600 to-blue-700",
        iconColor: "text-indigo-100",
        trend: 12.5,
      },
      {
        title: "حاضرون اليوم",
        value: stats.presentToday,
        detailsPageUrl: `/${locale}/attendance`,
        icon: UserCheck,
        gradient: "from-emerald-500 via-green-600 to-teal-700",
        iconColor: "text-emerald-100",
        trend: 8.3,
      },
      {
        title: "متأخرون اليوم",
        value: stats.lateToday,
        detailsPageUrl: `/${locale}/attendance`,
        icon: Clock,
        gradient: "from-amber-500 via-orange-600 to-red-600",
        iconColor: "text-amber-100",
        trend: -3.2,
      },
      {
        title: "غائبون اليوم",
        value: stats.absentToday,
        detailsPageUrl: `/${locale}/attendance`,
        icon: UserX,
        gradient: "from-red-500 via-rose-600 to-pink-700",
        iconColor: "text-red-100",
        trend: -1.5,
      },
      {
        title: "النطاقات الجغرافية",
        value: stats.totalGeofences,
        detailsPageUrl: `/${locale}/geofences`,
        icon: MapPin,
        gradient: "from-cyan-500 via-blue-600 to-indigo-700",
        iconColor: "text-cyan-100",
      },
      {
        title: "نسبة الالتزام بالوقت",
        value: stats.onTimeRate,
        detailsPageUrl: `/${locale}/attendance/reports`,
        icon: Target,
        gradient: "from-violet-500 via-purple-600 to-fuchsia-700",
        iconColor: "text-violet-100",
        trend: 5.0,
      },
    ],
    [stats, locale]
  );

  const attendanceDistribution = useMemo(
    () => [
      {
        name: statusLabels.present,
        value: stats.presentToday,
        icon: UserCheck,
        color: COLORS.present,
      },
      {
        name: statusLabels.late,
        value: stats.lateToday,
        icon: Clock,
        color: COLORS.late,
      },
      {
        name: statusLabels.absent,
        value: stats.absentToday,
        icon: UserX,
        color: COLORS.absent,
      },
    ],
    [stats]
  );

  const recentAttendance = useMemo(() => mockAttendance.slice(0, 5), []);

  return (
    <MainLayout>
      <div className="p-6 space-y-8 min-h-screen">
        <FullPageHead
          head="لوحة تحكم الحضور والمتابعة"
          description="نظرة شاملة على حضور الموظفين وتتبعهم في الوقت الحقيقي"
          Icon={<ChartSpline className="w-7 h-7" />}
          LeftSection={
            <div className="flex items-center gap-2 text-sm bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
              <Clock className="w-5 h-5 text-sky-700" />
              <span className="font-semibold text-gray-700">
                متوسط وقت الحضور:{" "}
                <span className="text-sky-700 font-bold">{stats.avgCheckInTime}</span>
              </span>
            </div>
          }
        />

        <Separator />
        <div className="space-y-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {dashboardCards.map((stat, index) => (
              <DashboardCard key={index} stat={stat} locale={locale} />
            ))}
          </div>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50/50">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    نظرة عامة على الحضور
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
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

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-gray-900">
                    أحدث سجلات الحضور
                  </CardTitle>
                  <p className="text-sm text-gray-600">آخر عمليات تسجيل الحضور اليوم</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">
                        الموظف
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">
                        القسم
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">
                        وقت الحضور
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">
                        الحالة
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">
                        الموقع
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAttendance.map((record) => {
                      const employee = mockEmployees.find((e) => e.id === record.employeeId);
                      return (
                        <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">
                            {record.employeeName}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {employee?.department || "-"}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {record.checkInTime || "-"}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                record.status === "present"
                                  ? "bg-green-100 text-green-800"
                                  : record.status === "late"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {statusLabels[record.status] || record.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {record.geofenceName || "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
