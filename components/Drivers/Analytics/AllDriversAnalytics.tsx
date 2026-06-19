"use client";

import React, { FC, useMemo } from "react";
import {
  Car,
  Truck,
  Droplet,
  Calendar,
  Wrench,
  UserX,
  Users,
  ChartPie,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import HeadAndDescription from "@/components/shared/HeadAndDescription";
import FullPageHead from "@/components/shared/FullPageHead";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

// Individual dynamic imports with proper typing
const BarChart = dynamic(
  () => import("recharts").then((mod) => mod.BarChart as ComponentType<any>),
  { ssr: false }
);

const Bar = dynamic(
  () => import("recharts").then((mod) => mod.Bar as ComponentType<any>),
  { ssr: false }
);

const XAxis = dynamic(
  () => import("recharts").then((mod) => mod.XAxis as ComponentType<any>),
  { ssr: false }
);

const YAxis = dynamic(
  () => import("recharts").then((mod) => mod.YAxis as ComponentType<any>),
  { ssr: false }
);

const Tooltip = dynamic(
  () => import("recharts").then((mod) => mod.Tooltip as ComponentType<any>),
  { ssr: false }
);

const ResponsiveContainer = dynamic(
  () =>
    import("recharts").then(
      (mod) => mod.ResponsiveContainer as ComponentType<any>
    ),
  { ssr: false }
);

const CartesianGrid = dynamic(
  () =>
    import("recharts").then((mod) => mod.CartesianGrid as ComponentType<any>),
  { ssr: false }
);

// const Cell = dynamic(
//   () => import("recharts").then((mod) => mod.Cell as ComponentType<any>),
//   { ssr: false }
// );

// const PieChart = dynamic(
//   () => import("recharts").then((mod) => mod.PieChart as ComponentType<any>),
//   { ssr: false }
// );

// const Pie = dynamic(
//   () => import("recharts").then((mod) => mod.Pie as ComponentType<any>),
//   { ssr: false }
// );

import { PieChart, Pie, Cell } from "recharts";

interface DriversAnalyticsData {
  total_active_taxi_drivers: number;
  total_active_fontas_drivers: number;
  total_active_light_transportation_drivers: number;
  total_active_wensh_drivers: number;
  total_with_out_cars_drivers: number;
  total_active_important_dates_drivers: number;
  totalActiveDriversNum: number;
}

// ----------------- Small Reusable Components -----------------
const StatsCard: FC<{
  name: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}> = ({ name, value, color, icon }) => {
  const gradient = useMemo(
    () => `linear-gradient(135deg, ${color}dd, ${color}99)`,
    [color]
  );
  return (
    <div
      className="p-4 sm:p-5 rounded-2xl text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg"
      style={{ background: gradient }}
    >
      <div className="flex items-center justify-between">
        <div className="p-2 bg-white/20 rounded-xl">{icon}</div>
        <span className="text-xl sm:text-2xl font-extrabold">
          {value.toLocaleString()}
        </span>
      </div>
      <p className="mt-2 text-xs sm:text-sm font-medium opacity-90 text-nowrap">
        {name}
      </p>
    </div>
  );
};
StatsCard.displayName = "StatsCard";

const LegendItem: FC<{ name: string; value: number; color: string }> = ({
  name,
  value,
  color,
}) => {
  const bgColor = `${color}10`;
  const borderColor = `${color}40`;
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl shadow-sm border"
      style={{ borderColor, backgroundColor: bgColor }}
    >
      <div
        className="w-3.5 h-3.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="font-semibold tracking-tight" style={{ color }}>
        {name}
      </span>
    </div>
  );
};
LegendItem.displayName = "LegendItem";

// ----------------- Main Component -----------------
export default function DriversAnalytics({
  data,
}: {
  data: DriversAnalyticsData;
}) {
  const cardIcons = useMemo(
    () => [
      <Car key="car-icon" className="w-6 h-6" />,
      <Droplet key="droplet-icon" className="w-6 h-6" />,
      <Truck key="truck-icon" className="w-6 h-6" />,
      <Wrench key="wrench-icon" className="w-6 h-6" />,
      <UserX key="userx-icon" className="w-6 h-6" />,
      <Calendar key="calendar-icon" className="w-6 h-6" />,
    ],
    []
  );

  const chartData = useMemo(
    () => [
      {
        name: "تاكسي",
        value: data.total_active_taxi_drivers,
        color: "#3B82F6",
      },
      {
        name: "وايت ماء",
        value: data.total_active_fontas_drivers,
        color: "#10B981",
      },
      {
        name: "النقل الخفيف",
        value: data.total_active_light_transportation_drivers,
        color: "#F59E0B",
      },
      {
        name: "سطحات ودينات",
        value: data.total_active_wensh_drivers,
        color: "#EF4444",
      },
      {
        name: "بدون سيارة",
        value: data.total_with_out_cars_drivers,
        color: "#8B5CF6",
      },
      {
        name: "تواريخ مهمة",
        value: data.total_active_important_dates_drivers,
        color: "#14B8A6",
      },
    ],
    [
      data.total_active_taxi_drivers,
      data.total_active_fontas_drivers,
      data.total_active_light_transportation_drivers,
      data.total_active_wensh_drivers,
      data.total_with_out_cars_drivers,
      data.total_active_important_dates_drivers,
    ]
  );

  const totalDrivers = useMemo(
    () => chartData.reduce((acc, cur) => acc + cur.value, 0),
    [chartData]
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* HEADER */}
      <FullPageHead
        head=" نظرة عامة على السائقين"
        description=" تحليل تفصيلي للسائقين النشطين حسب نوع الخدمة"
        Icon={<Truck className="w-7 h-7" />}
        LeftSection={
          <div className="flex items-center gap-2 text-sm bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
            <Truck className="w-5 h-5 text-green-700" />
            <span className="font-semibold text-gray-700">
              إجمالي السائقين النشطين:{" "}
              <span className="text-green-700 font-bold">
                {data.totalActiveDriversNum}
              </span>
            </span>
          </div>
        }
      />

      <Separator />

      {/* STATS CARDS GRID */}
      <div className="grid gap-3 grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {chartData.map((item, i) => (
          <StatsCard
            key={i}
            name={item.name}
            value={item.value}
            color={item.color}
            icon={cardIcons[i]}
          />
        ))}
      </div>

      {/* CHARTS SECTION */}
      <div className="flex flex-col gap-6">
        {/* BAR CHART */}
        <Card className="rounded-2xl shadow-sm border border-border/60 hover:shadow-md transition-all">
          <CardHeader className="pb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-7 h-7 text-primary" />
              <CardTitle className="text-xl sm:text-2xl font-extrabold text-gray-800">
                إحصائيات السائقين النشطين
              </CardTitle>
            </div>
            <Badge
              variant="outline"
              className="text-primary border-primary/40 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold"
            >
              المجموع الكلي: {totalDrivers.toLocaleString()}
            </Badge>
          </CardHeader>

          <CardContent>
            {/* BAR CHART */}
            <div className="h-[280px] sm:h-[420px] mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: 10, bottom: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />

                  {/* X AXIS */}
                  <XAxis
                    dataKey="name"
                    interval={0}
                    tickMargin={14}
                    axisLine={false}
                    tick={({ x, y, payload }: any) => {
                      const name = payload.value;
                      return (
                        <g transform={`translate(${x},${y})`}>
                          <text
                            dy={14}
                            textAnchor="middle"
                            fill="#374151"
                            fontSize={12}
                            fontStyle="italic"
                            transform="rotate(-10)"
                            fontWeight="bold"
                          >
                            {name}
                          </text>
                        </g>
                      );
                    }}
                  />

                  {/* Y AXIS */}
                  <YAxis
                    tick={{ fill: "#4B5563", fontSize: 13 }}
                    axisLine={false}
                  />

                  {/* TOOLTIP */}
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.03)" }}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #E5E7EB",
                      borderRadius: "10px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                    formatter={(v: number) => v.toLocaleString()}
                  />

                  {/* BAR - Forced Colors */}
                  <Bar
                    dataKey="value"
                    barSize={45}
                    radius={[12, 12, 0, 0]}
                    animationDuration={900}
                    fill="#3B82F6"
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        style={{ fill: entry.color }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* LEGEND */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-sm font-medium">
              {chartData.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl shadow-sm border"
                  style={{
                    borderColor: entry.color + "40",
                    backgroundColor: entry.color + "10",
                  }}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span
                    className="font-semibold tracking-tight"
                    style={{ color: entry.color }}
                  >
                    {entry.name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* PIE CHART */}
        <Card className="rounded-2xl shadow-sm border border-border/60 hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-gray-800">
              <ChartPie className="w-6 h-6 text-primary" />
              توزيع السائقين حسب نوع الخدمة
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="w-full h-[520px]">
              <div className="flex flex-col xl:flex-row items-center justify-center gap-10 mt-8">
                {/* LEFT: List of Service Types */}
                <div className="flex flex-col gap-4 w-full xl:w-1/2">
                  <h3 className="text-xl font-bold text-gray-800 mb-2 text-center xl:text-right">
                    توزيع السائقين حسب نوع الخدمة
                  </h3>

                  <div className="grid grid-cols-1 gap-4 w-full">
                    {chartData.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-all rounded-xl px-4 py-3 shadow-sm border border-gray-100"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{
                              backgroundColor: chartData[index].color,
                            }}
                          ></div>
                          <span className="font-semibold text-gray-700 text-base truncate">
                            {item.name}
                          </span>
                        </div>

                        <span className="font-bold text-gray-900 text-lg">
                          {item.value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RIGHT: Donut Chart - Forced Colors */}
                <div className="w-full xl:w-1/2 h-[400px] sm:h-[480px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={90}
                        outerRadius={140}
                        paddingAngle={4}
                        animationDuration={900}
                        fill="#3B82F6"
                        label={({ percent, x, y }: any) => (
                          <text
                            x={x}
                            y={y}
                            fill="#111827"
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize="14"
                            fontWeight="700"
                            style={{
                              textShadow: "0 1px 2px rgba(0,0,0,0.25)",
                            }}
                          >
                            {`${((percent as number) * 100).toFixed(1)}%`}
                          </text>
                        )}
                        labelLine={false}
                      >
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            style={{ fill: entry.color }}
                            stroke="white"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>

                      <Tooltip
                        formatter={(v: number) => v.toLocaleString()}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e2e8f0",
                          borderRadius: "10px",
                          boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                          fontWeight: 600,
                          fontSize: 15,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PIE CHART CARD */}
      {/* Keep PieChart rendering memoized similarly */}
    </div>
  );
}
