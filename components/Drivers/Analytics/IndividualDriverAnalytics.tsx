"use client";

import React, { FC } from "react";
import {
  Car,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ChartPie,
  BarChart3,
  Calendar,
  MapPin,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DriverAnalyticsData } from "@/app/[locale]/drivers/[id]/analytics/page";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

export const PieChart: ComponentType<any> = dynamic(
  () => import("recharts").then((mod) => mod.PieChart as ComponentType<any>),
  { ssr: false }
);

export const Pie: ComponentType<any> = dynamic(
  () => import("recharts").then((mod) => mod.Pie as ComponentType<any>),
  { ssr: false }
);

export const Cell: ComponentType<any> = dynamic(
  () => import("recharts").then((mod) => mod.Cell as ComponentType<any>),
  { ssr: false }
);

export const Tooltip: ComponentType<any> = dynamic(
  () => import("recharts").then((mod) => mod.Tooltip as ComponentType<any>),
  { ssr: false }
);

export const ResponsiveContainer: ComponentType<any> = dynamic(
  () =>
    import("recharts").then(
      (mod) => mod.ResponsiveContainer as ComponentType<any>
    ),
  { ssr: false }
);

export const CartesianGrid: ComponentType<any> = dynamic(
  () =>
    import("recharts").then((mod) => mod.CartesianGrid as ComponentType<any>),
  { ssr: false }
);

export const BarChart: ComponentType<any> = dynamic(
  () => import("recharts").then((mod) => mod.BarChart as ComponentType<any>),
  { ssr: false }
);

export const Bar: ComponentType<any> = dynamic(
  () => import("recharts").then((mod) => mod.Bar as ComponentType<any>),
  { ssr: false }
);

export const XAxis: ComponentType<any> = dynamic(
  () => import("recharts").then((mod) => mod.XAxis as ComponentType<any>),
  { ssr: false }
);

export const YAxis: ComponentType<any> = dynamic(
  () => import("recharts").then((mod) => mod.YAxis as ComponentType<any>),
  { ssr: false }
);

interface IndividualDriverAnalyticsProps {
  data: DriverAnalyticsData;
  driverName: string;
  driverInfo?: {
    city?: string;
    joinDate?: string;
    totalTrips?: number;
  };
}

const IndividualDriverAnalytics: FC<IndividualDriverAnalyticsProps> = ({
  data,
  driverName,
  driverInfo,
}) => {
  const totalTrips = data.completed_ride + data.canceled_ride;
  const completionRate = totalTrips
    ? ((data.completed_ride / totalTrips) * 100).toFixed(1)
    : "0";

  // 🎨 Prepare chart data for trip distribution
  const tripDistributionData = [
    {
      name: "مكتملة",
      value: data.completed_ride,
      color: "#10B981",
      icon: <CheckCircle className="w-4 h-4" />,
    },
    {
      name: "ملغاة",
      value: data.canceled_ride,
      color: "#EF4444",
      icon: <XCircle className="w-4 h-4" />,
    },
  ];

  // 🎨 Prepare chart data for service types (mock data based on completed rides)
  const serviceTypeData = [
    {
      name: "خدمات أساسية",
      value: Math.floor(data.completed_ride * 0.6),
      color: "#3B82F6",
    },
    {
      name: "خدمات متقدمة",
      value: Math.floor(data.completed_ride * 0.3),
      color: "#8B5CF6",
    },
    {
      name: "خدمات خاصة",
      value: Math.floor(data.completed_ride * 0.1),
      color: "#F59E0B",
    },
  ];

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "غير متوفر";
    return new Date(dateString).toLocaleDateString("ar-SA");
  };

  // Performance metrics
  const performanceMetrics = [
    {
      label: "متوسط الأرباح للرحلة",
      value:
        data.completed_ride > 0
          ? `${Math.floor(data.total_profit / data.completed_ride)} ر.س`
          : "0 ر.س",
      description: "متوسط الأرباح لكل رحلة مكتملة",
    },
    {
      label: "معدل الإلغاء",
      value: `${
        !totalTrips ? 0 : ((data.canceled_ride / totalTrips) * 100).toFixed(1)
      }%`,
      description: "نسبة الرحلات الملغاة من الإجمالي",
    },
    {
      label: "كفاءة الأداء",
      value: `${completionRate}%`,
      description: "نسبة إنجاز الرحلات",
    },
  ];

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* HEADER */}
      <Card className="border border-blue-100 bg-white shadow-sm rounded-2xl">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Driver Info */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-blue-100 rounded-full opacity-60"></div>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center relative z-10 border-2 border-white">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">
                    نظرة عامة على السائق
                  </h1>
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200"
                  >
                    إحصائيات
                  </Badge>
                </div>
                <p className="text-gray-600 text-sm">
                  عرض تفصيلي للأداء والإنجازات
                </p>
              </div>
            </div>

            {/* Center - Driver Name */}
            <div className="flex flex-col items-center text-center flex-1">
              <span className="text-gray-500 text-sm font-medium mb-1">
                اسم السائق
              </span>
              <span className="text-2xl font-bold text-gray-900">
                {driverName}
              </span>
            </div>

            {/* Right Side - Additional Info */}
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
              <Car className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-700 text-sm">
                إجمالي الرحلات:{" "}
                <span className="font-bold text-blue-600">{totalTrips}</span>
              </span>
            </div>
          </div>

          {/* Additional Driver Info */}
          {driverInfo && (
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600">
              {driverInfo.joinDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>مسجل منذ {formatDate(driverInfo.joinDate)}</span>
                </div>
              )}
              {driverInfo.city && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{driverInfo.city}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-400" />
                <span>نسبة الإكمال: {completionRate}%</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* STAT CARDS */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="الرحلات المكتملة"
          value={data.completed_ride}
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="الرحلات الملغاة"
          value={data.canceled_ride}
          icon={<XCircle className="w-5 h-5" />}
          color="red"
        />
        <StatCard
          title="نسبة الإكمال"
          value={`${completionRate}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="إجمالي الأرباح"
          value={`${data.total_profit.toLocaleString()} ر.س`}
          icon={<DollarSign className="w-5 h-5" />}
          color="amber"
        />
      </div>

      {/* PERFORMANCE METRICS */}
      <Card className="border border-gray-200 bg-white rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl text-gray-900">
            <div className="p-2 bg-green-100 rounded-xl">
              <BarChart3 className="w-5 h-5 text-green-600" />
            </div>
            مؤشرات الأداء
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {performanceMetrics.map((metric, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-xl border border-gray-200"
              >
                <span className="text-2xl font-bold text-gray-900 mb-2">
                  {metric.value}
                </span>
                <span className="text-sm font-semibold text-gray-700 mb-1">
                  {metric.label}
                </span>
                <span className="text-xs text-gray-500">
                  {metric.description}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CHARTS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* BAR CHART - Service Types */}
        <Card className="border border-gray-200 bg-white rounded-2xl shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-xl text-gray-900">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                توزيع الرحلات حسب النوع
              </CardTitle>
              <Badge
                variant="outline"
                className="text-blue-700 border-blue-200 bg-blue-50"
              >
                إجمالي المكتملة: {data.completed_ride.toLocaleString()}
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={serviceTypeData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <defs>
                    {serviceTypeData.map((entry, i) => (
                      <linearGradient
                        key={i}
                        id={`grad${i}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={entry.color}
                          stopOpacity={0.9}
                        />
                        <stop
                          offset="95%"
                          stopColor={entry.color}
                          stopOpacity={0.5}
                        />
                      </linearGradient>
                    ))}
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="name"
                    tickMargin={10}
                    axisLine={false}
                    tick={{ fill: "#374151", fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fill: "#374151", fontSize: 12 }}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.03)" }}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                      fontSize: 12,
                      direction: "rtl",
                    }}
                    formatter={(v: number) => v.toLocaleString()}
                    labelFormatter={(name: string) => `نوع الخدمة: ${name}`}
                  />
                  <Bar dataKey="value" barSize={40} radius={[6, 6, 0, 0]}>
                    {serviceTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`url(#grad${index})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 justify-center mt-4 pt-4 border-t border-gray-100">
              {serviceTypeData.map((entry, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span>{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* PIE CHART - Trip Distribution */}
        <Card className="border border-gray-200 bg-white rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl text-gray-900">
              <div className="p-2 bg-green-100 rounded-xl">
                <ChartPie className="w-5 h-5 text-green-600" />
              </div>
              توزيع حالات الرحلات
            </CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col items-center gap-6">
            <div className="w-full max-w-sm h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tripDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {tripDistributionData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="white"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-xl font-bold fill-gray-700"
                  >
                    {`${completionRate}%`}
                  </text>
                  <Tooltip
                    formatter={(v: number) => v.toLocaleString()}
                    labelFormatter={(name: string) => `الحالة: ${name}`}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                      direction: "rtl",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              {tripDistributionData.map((item, i) => {
                const percent =
                  totalTrips > 0
                    ? ((item.value / totalTrips) * 100).toFixed(1)
                    : "0";
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-white transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="p-1 rounded text-white"
                        style={{ backgroundColor: item.color }}
                      >
                        {item.icon}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {item.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900">
                        {item.value}
                      </span>
                      <span className="text-xs text-gray-500 mr-1">
                        ({percent}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* EARNINGS SUMMARY */}
      <Card className="border border-amber-200 bg-amber-50 rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl text-amber-900">
            <div className="p-2 bg-amber-100 rounded-xl">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
            ملخص الأرباح
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-900 mb-2">
                {data.total_profit.toLocaleString()} ر.س
              </div>
              <div className="text-sm text-amber-700 font-semibold">
                إجمالي الأرباح
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-800 mb-2">
                {data.completed_ride > 0
                  ? Math.floor(
                      data.total_profit / data.completed_ride
                    ).toLocaleString()
                  : "0"}{" "}
                ر.س
              </div>
              <div className="text-sm text-amber-700">متوسط الربح للرحلة</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-800 mb-2">
                {completionRate}%
              </div>
              <div className="text-sm text-amber-700">كفاءة تحقيق الأرباح</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const StatCard = ({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: "blue" | "green" | "red" | "amber";
}) => {
  const colorClasses = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green: "border-green-200 bg-green-50 text-green-700",
    red: "border-red-200 bg-red-50 text-red-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
  };

  const iconClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
    amber: "bg-amber-100 text-amber-600",
  };

  return (
    <Card className={`border rounded-2xl shadow-sm ${colorClasses[color]}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className={`p-3 rounded-xl ${iconClasses[color]}`}>{icon}</div>
          <span className="text-3xl font-bold">{value}</span>
        </div>
        <p className="text-lg font-semibold mt-4">{title}</p>
      </CardContent>
    </Card>
  );
};

export default IndividualDriverAnalytics;
