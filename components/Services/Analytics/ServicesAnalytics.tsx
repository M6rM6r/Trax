"use client";

import { FC, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  Car,
  Truck,
  Droplets,
  Wrench,
  CalendarDays,
  BarChart3,
  PieChartIcon,
} from "lucide-react";
import { TotalActiveDriversResponse } from "@/lib/types/responseTypes";
import FullPageHead from "@/components/shared/FullPageHead";

// Responsive Hook (replaces window.innerWidth)
const useScreen = () => {
  if (typeof window === "undefined") return { width: 1200 };
  return { width: window.innerWidth };
};

interface IProps {
  totalActiveDrivers: TotalActiveDriversResponse["data"];
}

const ServicesAnalytics: FC<IProps> = ({ totalActiveDrivers }) => {
  const { width } = useScreen();

  // ============================
  // 1. MEMOIZED CONSTANT DATA
  // ============================

  const serviceLabels = useMemo(
    () => ({
      total_active_taxi_drivers: { name: "سائقي التاكسي", icon: Car },
      total_active_fontas_drivers: { name: "سائقي الوايت", icon: Droplets },
      total_active_light_transportation_drivers: {
        name: "سائقي النقل الخفيف",
        icon: Truck,
      },
      total_active_wensh_drivers: {
        name: "سائقي السطحات والدينات",
        icon: Wrench,
      },
      total_with_out_cars_drivers: {
        name: "سائقين بدون سيارة",
        icon: Users,
      },
      total_active_important_dates_drivers: {
        name: "سائقي المناسبات الخاصة",
        icon: CalendarDays,
      },
    }),
    []
  );

  const gradients = useMemo(
    () => [
      "from-[#3b82f6]/90 to-[#60a5fa]/90",
      "from-[#0ea5e9]/90 to-[#38bdf8]/90",
      "from-[#22c55e]/90 to-[#4ade80]/90",
      "from-[#eab308]/90 to-[#facc15]/90",
      "from-[#f97316]/90 to-[#fb923c]/90",
      "from-[#ef4444]/90 to-[#f87171]/90",
    ],
    []
  );

  const COLORS = useMemo(
    () => ["#3b82f6", "#0ea5e9", "#22c55e", "#eab308", "#f97316", "#ef4444"],
    []
  );

  // ============================
  // 2. MEMOIZED CHART DATA
  // ============================

  type ServiceKey = keyof typeof serviceLabels;

  const chartData = useMemo(() => {
    return Object.entries(totalActiveDrivers)
      .filter(([key]) => key !== "total_services")
      .map(([key, value]) => {
        const typedKey = key as ServiceKey;
        const label = serviceLabels[typedKey];

        return {
          key,
          name: label?.name ?? key,
          value,
        };
      });
  }, [totalActiveDrivers]);

  const shortenedChartData = useMemo(() => {
    return chartData.map((item) => {
      const name = item.name.includes(" ")
        ? item.name?.split(" ").slice(1).join(" ")
        : item.name;

      return { ...item, name };
    });
  }, [chartData]);

  // ============================
  // 3. RENDER
  // ============================

  return (
    <div className="p-6 space-y-8 min-h-screen">
      {/* Header */}
      <FullPageHead
        head=" نظرة عامة على الخدمات"
        description=" عرض تفصيلي لإحصائيات السائقين حسب نوع الخدمة"
        Icon={<BarChart3 className="w-7 h-7" />}
        LeftSection={
          <div className="flex items-center gap-2 text-sm bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-700">
              إجمالي الخدمات النشطة:{" "}
              <span className="text-blue-600 font-bold">6</span>
            </span>
          </div>
        }
      />

      <Separator />

      {/* Service Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(serviceLabels).map(
          ([key, { name, icon: Icon }], idx) => {
            const gradient = gradients[idx];

            return (
              <Card
                key={key}
                className={`relative overflow-hidden rounded-2xl border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-gradient-to-br ${gradient} text-white`}
              >
                <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />

                <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg tracking-wide font-bold">
                    {name}
                  </CardTitle>
                  <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
                    <Icon className="w-6 h-6 text-white drop-shadow-sm" />
                  </div>
                </CardHeader>

                <CardContent className="relative z-10">
                  <p className="text-4xl font-extrabold tracking-tight drop-shadow-sm">
                    {totalActiveDrivers[key as keyof typeof totalActiveDrivers]}
                  </p>
                  <p className="text-sm font-medium text-white/90 mt-1">
                    عدد السائقين النشطين
                  </p>
                </CardContent>
              </Card>
            );
          }
        )}
      </div>

      {/* Charts */}
      <div className="mt-12 grid lg:grid-cols-12 gap-10">
        {/* Bar Chart */}
        <div className="lg:col-span-7">
          <Card className="rounded-2xl border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-100">
                  <BarChart3 className="w-7 h-7 text-blue-600" />
                </div>
                <CardTitle className="text-2xl font-extrabold text-gray-800 tracking-tight">
                  مقارنة عدد السائقين حسب نوع الخدمة
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="pt-6 flex flex-col gap-6">
              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-6 mb-2">
                {chartData.map((item, i) => (
                  <div key={item.key} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-gray-700 font-semibold text-sm">
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>

              {/* BAR CHART */}
              <div className="w-full h-[320px] sm:h-[420px] md:h-[480px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={shortenedChartData}
                    margin={{ top: 20, right: 20, left: 0, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      interval={0}
                      angle={width < 1024 ? -35 : 0}
                      textAnchor={width < 1024 ? "end" : "middle"}
                      height={width < 1024 ? 80 : 50}
                    />
                    <YAxis />
                    <Tooltip formatter={(v: number) => v.toLocaleString()} />

                    <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                      {chartData.map((_, i) => (
                        <Cell
                          key={`cell-${i}`}
                          fill={COLORS[i % COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pie Chart */}
        <div className="lg:col-span-5">
          <Card className="rounded-2xl border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-3 rounded-xl bg-purple-100">
                <PieChartIcon className="w-7 h-7 text-purple-600" />
              </div>
              <CardTitle className="text-2xl font-extrabold text-gray-800 tracking-tight">
                النسبة المئوية لكل نوع خدمة
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-6">
              <div className="w-full h-[520px]">
                <div className="flex flex-col xl:flex-row items-center justify-center gap-10 mt-8">
                  {/* List */}
                  <div className="flex flex-col gap-4 w-full xl:w-1/2">
                    <h3 className="text-xl font-bold text-gray-800 mb-2 text-center xl:text-right">
                      توزيع السائقين حسب نوع الخدمة
                    </h3>

                    <div className="grid grid-cols-1 gap-4 w-full">
                      {chartData.map((item, index) => (
                        <div
                          key={item.key}
                          className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-all rounded-xl px-4 py-3 shadow-sm border border-gray-100"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{
                                backgroundColor: COLORS[index % COLORS.length],
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

                  {/* Donut */}
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
                          animationDuration={300}
                          label={({ percent }) =>
                            `${((percent as number) * 100).toFixed(1)}%`
                          }
                          labelLine={false}
                        >
                          {chartData.map((_, index) => (
                            <Cell
                              key={index}
                              fill={COLORS[index % COLORS.length]}
                              stroke="white"
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>

                        <Tooltip
                          formatter={(v: number) => v.toLocaleString()}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ServicesAnalytics;