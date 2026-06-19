"use client";

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  RadialBarChart,
  RadialBar,
  Legend,
} from "recharts";

import {
  Fuel,
  Settings,
  Car,
  TrendingUp,
  Wrench,
  ChartPie,
  Target,
} from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

import { OutagesAnalyticsData } from "@/app/[locale]/services/outages/analytics/page";
import FullPageHead from "@/components/shared/FullPageHead";

// ------------------------------------------------------------------
// Memoized Render Helpers
// ------------------------------------------------------------------
const StatusRow = React.memo(({ item }: any) => (
  <div className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition rounded-xl px-4 py-3 shadow-sm border">
    <div className="flex items-center gap-3">
      <span
        className="w-4 h-4 rounded-full"
        style={{ backgroundColor: item.color }}
      />
      <span className="font-semibold text-gray-700 text-base">{item.name}</span>
    </div>
    <span className="font-bold text-gray-900 text-lg">
      {item.value.toLocaleString()}
    </span>
  </div>
));
StatusRow.displayName = "StatusRow";

// ------------------------------------------------------------------
// Main Component
// ------------------------------------------------------------------
export default function FaultsAnalytics({
  data,
}: {
  data: OutagesAnalyticsData;
}) {
  /**
   * STATIC CONFIG
   * (not recreated per-render)
   */
  const serviceTypes = useMemo(
    () => [
      { key: "fuel", name: "خدمات الوقود", color: "#3B82F6", Icon: Fuel },
      {
        key: "tires",
        name: "خدمات الإطارات",
        color: "#10B981",
        Icon: Settings,
      },
      { key: "towing", name: "خدمات السحب", color: "#F59E0B", Icon: Car },
    ],
    []
  );

  /**
   * MAIN CALCULATIONS
   * Memoized so they only re-run when `data` changes.
   */
  const overviewData = useMemo(() => {
    return serviceTypes.map((service) => {
      const group = data[service.key as keyof OutagesAnalyticsData];

      const successful = group.done;
      const cancelled =
        group.canceled_by_customer +
        group.canceled_by_driver +
        group.canceled_automatically;

      const active =
        group.pending +
        group.scheduled +
        group.accepted +
        group.driver_arrived +
        group.on_the_way +
        group.processing;

      const successRate = group.total ? (successful / group.total) * 100 : 0;

      return {
        ...service,
        ...group,
        successful,
        cancelled,
        active,
        successRate,
      };
    });
  }, [data, serviceTypes]);

  /**
   * AGGREGATE TOTALS
   */
  const { totals, statusData, performanceData, comparisonData } =
    useMemo(() => {
      const total = overviewData.reduce((acc, s) => acc + s.total, 0);
      const successful = overviewData.reduce((acc, s) => acc + s.successful, 0);
      const cancelled = overviewData.reduce((acc, s) => acc + s.cancelled, 0);
      const active = overviewData.reduce((acc, s) => acc + s.active, 0);

      return {
        totals: { total, successful, cancelled, active },

        statusData: [
          { name: "ناجحة", value: successful, color: "#10B981" },
          { name: "ملغاة", value: cancelled, color: "#EF4444" },
          { name: "نشطة", value: active, color: "#F59E0B" },
        ],

        performanceData: overviewData.map((s) => ({
          name: s.name,
          efficiency: s.successRate,
          fill: s.color,
        })),

        comparisonData: overviewData.map((s) => ({
          service: s.name,
          نجاح: s.successful,
          إلغاء: s.cancelled,
          نشطة: s.active,
        })),
      };
    }, [overviewData]);

  const overallSuccessRate = useMemo(() => {
    return totals.total ? (totals.successful / totals.total) * 100 : 0;
  }, [totals]);

  // ------------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------------
  return (
    <div className="p-6 space-y-8 min-h-screen">
      {/* HEADER */}
      <FullPageHead
        head=" نظرة عامة على خدمات العطالات"
        description=" نظرة شاملة على خدمات العطالات حسب النوع"
        Icon={<Wrench className="w-7 h-7" />}
        LeftSection={
          <div className="flex items-center gap-2 text-sm bg-gray-50 px-4 py-2 rounded-xl border">
            <TrendingUp className="w-5 h-5 text-orange-700" />
            <span className="font-semibold">
              معدل النجاح العام:{" "}
              <span className="text-orange-700 font-bold">
                {overallSuccessRate.toFixed(1)}%
              </span>
            </span>
          </div>
        }
      />

      <Separator />

      {/* OVERVIEW */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
        {overviewData.map((s, i) => {
          const Icon = s.Icon;
          return (
            <div
              key={i}
              className="p-4 rounded-2xl text-white shadow-md transition hover:scale-[1.02]"
              style={{ background: `${s.color}cc` }}
            >
              <div className="flex items-center justify-between">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-extrabold">
                  {s.total.toLocaleString()}
                </span>
              </div>

              <p className="mt-2 text-sm opacity-90">{s.name}</p>
              <div className="mt-3 flex justify-between text-sm">
                <span className="opacity-90">معدل النجاح</span>
                <span className="font-bold">{s.successRate.toFixed(1)}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PIE */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartPie className="w-6 h-6 text-primary" />
              توزيع حالات الخدمات
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={120}
                    labelLine={false}
                    animationDuration={300}
                  >
                    {statusData.map((item, i) => (
                      <Cell key={i} fill={item.color} stroke="#fff" />
                    ))}
                  </Pie>

                  <Tooltip formatter={(v) => v.toLocaleString()} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 space-y-3">
              {statusData.map((item, i) => (
                <StatusRow key={i} item={item} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* RADIAL */}
        <Card>
          <CardHeader className="flex items-center gap-3">
            <Target className="w-7 h-7 text-primary" />
            <CardTitle>كفاءة الخدمات</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="20%"
                  outerRadius="90%"
                  data={performanceData}
                  startAngle={180}
                  endAngle={-180}
                >
                  <RadialBar
                    dataKey="efficiency"
                    background
                    cornerRadius={10}
                  />
                  <Legend />
                  <Tooltip />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* COMPARISON */}
      <Card>
        <CardHeader className="flex items-center gap-3">
          <TrendingUp className="w-7 h-7 text-primary" />
          <CardTitle>مقارنة أداء الخدمات</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="service" />
                <YAxis />
                <Tooltip formatter={(v) => v.toLocaleString()} />
                <Legend />
                <Bar dataKey="نجاح" fill="#10B981" />
                <Bar dataKey="إلغاء" fill="#EF4444" />
                <Bar dataKey="نشطة" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
