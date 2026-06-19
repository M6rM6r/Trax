"use client";

import React, { memo, useMemo } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import {
  Users,
  Car,
  Activity,
  Wrench,
  Briefcase,
  CarFront,
  ArrowRight,
  TrendingUp,
  Target,
  BarChart3,
  Crown,
  Award,
  PieChart as PieChartIcon,
  BarChart4,
  Sparkles,
  ChartSpline,
} from "lucide-react";
import {
  TotalActiveCustomersResponse,
  TotalActiveDriversResponse,
  TotalFaultsDrivers,
  TotalMainServicesResponse,
} from "@/lib/types/responseTypes";
import { getSum } from "@/lib/utils";
import { useLocale } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@radix-ui/react-separator";
import FullPageHead from "@/components/shared/FullPageHead";

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

export const ResponsiveContainer: ComponentType<any> = dynamic(
  () =>
    import("recharts").then(
      (mod) => mod.ResponsiveContainer as ComponentType<any>
    ),
  { ssr: false }
);

export const Tooltip: ComponentType<any> = dynamic(
  () => import("recharts").then((mod) => mod.Tooltip as ComponentType<any>),
  { ssr: false }
);

interface AnalyticsOverviewChartProps {
  totalActiveDrivers: TotalActiveDriversResponse["data"];
  totalMainServices: TotalMainServicesResponse["data"];
  totalActiveCustomers: TotalActiveCustomersResponse["data"];
  totalFaultsDrivers: TotalFaultsDrivers["data"];
}

const COLORS = {
  faults: "#DC2626",
  activeDrivers: "#2563EB",
  services: "#16A34A",
  activeCustomers: "#F59E0B",
  taxi: "#8B5CF6",
  fontas: "#14B8A6",
  lightTransport: "#F97316",
  wensh: "#EC4899",
};

const serviceNameMap: Record<string, string> = {
  total_active_taxi_drivers: "سائقين التاكسي",
  total_active_fontas_drivers: "سائقين الفونطاس",
  total_active_light_transportation_drivers: "سائقين النقل الخفيف",
  total_active_wensh_drivers: "سائقين الونش",
  total_with_out_cars_drivers: "السائقين بدون سيارات",
  total_active_important_dates_drivers: "سائقين المناسبات الخاصة",
};

// ============ MEMOIZED COMPONENTS ============

// Dashboard Card Component
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
                  <TrendingUp
                    className={`w-3 h-3 ${stat.trend >= 0 ? "" : "rotate-180"}`}
                  />
                  <span>{Math.abs(stat.trend)}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <p className="text-4xl font-black mb-4">
          {stat.value.toLocaleString()}
        </p>
        <div className="w-full h-px bg-white/30 mb-4" />
        <Link href={stat.detailsPageUrl} className="block w-full">
          <Button
            size="lg"
            variant="secondary"
            className="w-full flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white border-0 rounded-xl transition-all duration-300 hover:scale-105"
          >
            <span className="font-medium">عرض الإحصائيات</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
});
DashboardCard.displayName = "DashboardCard";

// Enhanced Pie Chart Component
interface EnhancedPieChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
    icon: React.ComponentType<any>;
  }>;
}

const EnhancedPieChart = memo(({ data }: EnhancedPieChartProps) => {
  const total = useMemo(
    () => data.reduce((sum, item) => sum + item.value, 0),
    [data]
  );

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-2xl">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <p className="font-bold text-gray-900">{data.name}</p>
          </div>
          <p className="text-sm text-gray-600">
            القيمة:{" "}
            <span className="font-semibold">{data.value.toLocaleString()}</span>
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
          <h3 className="text-lg font-bold text-gray-900">التوزيع النسبي</h3>
          <p className="text-sm text-gray-600">نسبة كل فئة من الإجمالي</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        {/* Pie Chart */}
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

          {/* Center Total */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <div className="text-center">
              <div className="text-2xl font-black text-gray-900">
                {total.toLocaleString()}
              </div>
              <div className="text-xs font-medium text-gray-500">الإجمالي</div>
            </div>
          </div>
        </div>

        {/* Legend with Stats */}
        <div className="space-y-3">
          {data.map((item, index) => {
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
                    <div className="font-semibold text-gray-900 text-sm">
                      {item.name}
                    </div>
                    <div className="text-xs text-gray-500">{percentage}%</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">
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

// Bar Chart Component for Insights
interface InsightsBarChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
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
          <h3 className="text-lg font-bold text-gray-900">مقارنة الأداء</h3>
          <p className="text-sm text-gray-600">
            مقارنة مرئية بين الفئات المختلفة
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100;
          return (
            <div key={item.name} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700 text-sm">
                  {item.name}
                </span>
                <span className="font-bold text-gray-900">
                  {item.value.toLocaleString()}
                </span>
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

// Enhanced Service Distribution Component
interface EnhancedServiceDistributionProps {
  services: Array<{
    name: string;
    value: number;
    color: string;
    icon: React.ComponentType<any>;
  }>;
}

const EnhancedServiceDistribution = memo(
  ({ services }: EnhancedServiceDistributionProps) => {
    const totalServices = useMemo(
      () => services.reduce((sum, s) => sum + s.value, 0),
      [services]
    );
    const topService = useMemo(
      () => services.reduce((max, s) => (s.value > max.value ? s : max)),
      [services]
    );

    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
            <ChartSpline className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">توزيع الخدمات</h3>
            <p className="text-sm text-gray-600">تفاصيل جميع الخدمات النشطة</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Service Cards */}
          <div className="grid grid-cols-1 gap-3">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.name}
                  className="flex items-center justify-between p-4 rounded-xl border-2 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-gray-50"
                  style={{ borderColor: `${service.color}30` }}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: `${service.color}20` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: service.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 mb-1">
                        {service.name}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${(service.value / totalServices) * 100}%`,
                            backgroundColor: service.color,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 text-lg">
                      {service.value.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {((service.value / totalServices) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Service Insights */}
          <div className="space-y-4">
            {/* Top Service Highlight */}
            <div
              className="bg-white border-2 rounded-xl p-4 shadow-sm"
              style={{ borderColor: topService.color }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Crown
                  className="w-4 h-4"
                  style={{ color: topService.color }}
                />
                <span className="font-bold text-gray-900">
                  الخدمة الأكثر نشاطاً
                </span>
              </div>
              <div className="text-center">
                <div
                  className="text-xl font-black mb-1"
                  style={{ color: topService.color }}
                >
                  {topService.name}
                </div>
                <div className="text-2xl font-black text-gray-900">
                  {topService.value.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">
                  {((topService.value / totalServices) * 100).toFixed(1)}% من
                  إجمالي الخدمات
                </div>
              </div>
            </div>

            {/* Distribution Stats */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 mb-3">
                إحصائيات التوزيع
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">عدد الخدمات المختلفة</span>
                  <span className="font-bold text-gray-900">
                    {services.length}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">متوسط الخدمات</span>
                  <span className="font-bold text-gray-900">
                    {Math.round(
                      services.reduce((sum, s) => sum + s.value, 0) /
                        services.length
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">أقل خدمة</span>
                  <span className="font-bold text-gray-900">
                    {Math.min(...services.map((s) => s.value)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
EnhancedServiceDistribution.displayName = "EnhancedServiceDistribution";

// ============ MAIN COMPONENT ============
export default function OverviewAnalytics({
  totalActiveDrivers,
  totalMainServices,
  totalActiveCustomers,
  totalFaultsDrivers,
}: AnalyticsOverviewChartProps) {
  const locale = useLocale();

  // Memoized dashboard stats
  const dashboardStats = useMemo(
    () => [
      {
        title: "جميع الخدمات",
        value: totalActiveCustomers.total_services,
        detailsPageUrl: `/${locale}/services/analytics`,
        icon: Briefcase,
        gradient: "from-indigo-500 via-purple-600 to-blue-700",
        iconColor: "text-indigo-100",
        trend: 12.5,
      },
      {
        title: "مقدمو الخدمات",
        value: getSum(totalActiveDrivers),
        detailsPageUrl: `/${locale}/drivers/analytics`,
        icon: CarFront,
        gradient: "from-emerald-500 via-green-600 to-teal-700",
        iconColor: "text-emerald-100",
        trend: 8.3,
      },
      {
        title: "جميع العملاء",
        value: getSum(totalActiveCustomers),
        detailsPageUrl: `/${locale}/customers/analytics`,
        icon: Users,
        gradient: "from-amber-500 via-orange-600 to-red-600",
        iconColor: "text-amber-100",
        trend: 15.2,
      },
    ],
    [totalActiveDrivers, totalActiveCustomers, locale]
  );

  // Memoized overview data with consistent colors
  const overviewData = useMemo(
    () => [
      {
        name: "سائقين العطالات",
        value: getSum(totalFaultsDrivers),
        icon: Wrench,
        color: COLORS.faults,
      },
      {
        name: "السائقين النشطين",
        value: totalActiveDrivers.total_active_drivers,
        icon: Car,
        color: COLORS.activeDrivers,
      },
      {
        name: "الخدمات",
        value: totalActiveCustomers.total_services,
        icon: Activity,
        color: COLORS.services,
      },
      {
        name: "العملاء النشطين",
        value: totalActiveCustomers.total_active_customers,
        icon: Users,
        color: COLORS.activeCustomers,
      },
    ],
    [totalActiveDrivers, totalActiveCustomers, totalFaultsDrivers]
  );

  // Memoized service data with consistent colors
  const serviceData = useMemo(
    () => [
      {
        name: serviceNameMap.total_active_taxi_drivers,
        value: totalMainServices.total_active_taxi_drivers || 0,
        color: COLORS.taxi,
        icon: Car,
      },
      {
        name: serviceNameMap.total_active_fontas_drivers,
        value: totalMainServices.total_active_fontas_drivers || 0,
        color: COLORS.fontas,
        icon: CarFront,
      },
      {
        name: serviceNameMap.total_active_light_transportation_drivers,
        value: totalMainServices.total_active_light_transportation_drivers || 0,
        color: COLORS.lightTransport,
        icon: Briefcase,
      },
      {
        name: serviceNameMap.total_active_wensh_drivers,
        value: totalMainServices.total_active_wensh_drivers || 0,
        color: COLORS.wensh,
        icon: Wrench,
      },
    ],
    [totalMainServices]
  );

  return (
    <div className="p-6 space-y-8 min-h-screen">
      <FullPageHead
        head=" نظرة عامة على الإحصائيات"
        description=" لوحة تحكم شاملة لعرض ملخص الأداء العام للتطبيق"
        Icon={<ChartSpline className="w-7 h-7" />}
        LeftSection={
          <div className="flex items-center gap-2 text-sm bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
            <ChartSpline className="w-5 h-5 text-sky-700" />
            <span className="font-semibold text-gray-700">
              عدد الخدمات المعروضة:{" "}
              <span className="text-sky-700 font-bold">
                {totalActiveCustomers.total_services}
              </span>
            </span>
          </div>
        }
      />

      <Separator />
      <div className="space-y-8">
        {/* Dashboard Cards Section */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {dashboardStats.map((stat, index) => (
            <DashboardCard key={index} stat={stat} locale={locale} />
          ))}
        </div>

        {/* نظرة عامة على النظرة عامة على Section */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50/50">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  نظرة عامة على النظرة عامة على
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  تحليل شامل وإحصائيات تفصيلية للنظام
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Charts Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <EnhancedPieChart data={overviewData} />
              <InsightsBarChart data={overviewData} />
            </div>

            {/* توزيع الخدمات Section */}
            <EnhancedServiceDistribution services={serviceData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
