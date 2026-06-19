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
} from "recharts";
import {
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Car,
  ChartPie,
  Zap,
  Target,
  Star,
  AlertTriangle,
  UserCheck,
  CalendarCheck,
  Loader,
  Users,
  UserX,
  Bot,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TripsAnalyticsData } from "@/app/[locale]/trips/analytics/page";
import FullPageHead from "../shared/FullPageHead";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function TripsAnalytics({ data }: { data: TripsAnalyticsData }) {
  const params = useParams();
  const locale = params?.locale || "ar";

  /**
   * ────────────────────────────────────────────
   *      MEMOIZED CALCULATIONS (NO RE-RUNS)
   * ────────────────────────────────────────────
   */
  const {
    successfulTrips,
    cancelledTrips,
    activeTrips,
    successRate,
    cancellationRate,
    completionRate,
  } = useMemo(() => {
    const successfulTrips = data.done;
    const cancelledTrips =
      data.canceled_by_customer +
      data.canceled_by_driver +
      data.canceled_automatically;
    const activeTrips =
      data.pending +
      data.scheduled +
      data.accepted +
      data.driver_arrived +
      data.on_the_way +
      data.processing;

    return {
      successfulTrips,
      cancelledTrips,
      activeTrips,
      successRate: data.total ? (successfulTrips / data.total) * 100 : 0,
      cancellationRate: data.total ? (cancelledTrips / data.total) * 100 : 0,
      completionRate: data.total
        ? ((successfulTrips + cancelledTrips) / data.total) * 100
        : 0,
    };
  }, [data]);

  /**
   * ────────────────────────────────────────────
   *   STATIC-LIKE ARRAYS MEMOIZED FOR SPEED
   * ────────────────────────────────────────────
   */
  const chartData = useMemo(
    () => [
      {
        name: "إجمالي الرحلات",
        value: data.total,
        color: "#3B82F6",
        Icon: MapPin,
      },
      {
        name: "الرحلات الناجحة",
        value: successfulTrips,
        color: "#10B981",
        Icon: CheckCircle,
      },
      {
        name: "الرحلات الملغاة",
        value: cancelledTrips,
        color: "#EF4444",
        Icon: XCircle,
      },
      {
        name: "الرحلات النشطة",
        value: activeTrips,
        color: "#F59E0B",
        Icon: Clock,
      },
    ],
    [data.total, successfulTrips, cancelledTrips, activeTrips]
  );

  const categories = useMemo(
    () => [
      {
        name: "الرحلات الجارية والناجحة",
        total: successfulTrips,
        color: "#10B981",
        Icon: CheckCircle,
        subTypes: [
          { name: "مكتملة", value: data.done, color: "#10B981", Icon: Star },
          {
            name: "مقبولة",
            value: data.accepted,
            color: "#3B82F6",
            Icon: UserCheck,
          },
          {
            name: "في الطريق",
            value: data.on_the_way,
            color: "#F59E0B",
            Icon: Car,
          },
          {
            name: "السائق وصل",
            value: data.driver_arrived,
            color: "#06B6D4",
            Icon: MapPin,
          },
        ],
      },
      {
        name: "ملغاة",
        total: cancelledTrips,
        color: "#EF4444",
        Icon: XCircle,
        subTypes: [
          {
            name: "ملغاة من العميل",
            value: data.canceled_by_customer,
            color: "#EF4444",
            Icon: UserX,
          },
          {
            name: "ملغاة من السائق",
            value: data.canceled_by_driver,
            color: "#DC2626",
            Icon: Users,
          },
          {
            name: "ملغاة تلقائياً",
            value: data.canceled_automatically,
            color: "#B91C1C",
            Icon: Bot,
          },
        ],
      },
      {
        name: "الرحلات قيد التنفيذ",
        total: activeTrips,
        color: "#F59E0B",
        Icon: Clock,
        subTypes: [
          {
            name: "قيد الانتظار",
            value: data.pending,
            color: "#6B7280",
            Icon: Clock,
          },
          {
            name: "مجدولة",
            value: data.scheduled,
            color: "#8B5CF6",
            Icon: CalendarCheck,
          },
          {
            name: "قيد المعالجة",
            value: data.processing,
            color: "#F97316",
            Icon: Loader,
          },
        ],
      },
    ],
    [
      data.done,
      data.accepted,
      data.on_the_way,
      data.driver_arrived,
      data.canceled_by_customer,
      data.canceled_by_driver,
      data.canceled_automatically,
      data.pending,
      data.scheduled,
      data.processing,
      successfulTrips,
      cancelledTrips,
      activeTrips,
    ]
  );

  const statusDistribution = useMemo(
    () => [
      { name: "مكتملة", value: successfulTrips, color: "#10B981" },
      { name: "ملغاة", value: cancelledTrips, color: "#EF4444" },
      { name: "نشطة", value: activeTrips, color: "#F59E0B" },
    ],
    [successfulTrips, cancelledTrips, activeTrips]
  );

  const performanceInsights = useMemo(
    () => [
      {
        metric: "معدل النجاح",
        value: `${successRate.toFixed(1)}%`,
        change: "+5.2%",
        trend: "up",
        color: "text-green-600",
        Icon: TrendingUp,
        description: "تحسن في معدل إنجاز الرحلات",
      },
      {
        metric: "معدل الإلغاء",
        value: `${cancellationRate.toFixed(1)}%`,
        change: "-2.1%",
        trend: "down",
        color: "text-red-600",
        Icon: XCircle,
        description: "انخفاض في نسبة الإلغاء",
      },
      {
        metric: "الرحلات النشطة",
        value: activeTrips.toLocaleString(),
        change: "+8%",
        trend: "up",
        color: "text-amber-600",
        Icon: Clock,
        description: "زيادة في الرحلات الجارية",
      },
    ],
    [successRate, cancellationRate, activeTrips]
  );

  /**
   * ────────────────────────────────────────────
   *      THE UI (UNCHANGED — JUST FASTER)
   * ────────────────────────────────────────────
   */
  return (
    <div className="p-6 space-y-8 min-h-screen">
      {/* HEADER */}
      <FullPageHead
        Icon={<Car className="w-7 h-7" />}
        head=" نظرة عامة على الرحلات"
        description=" نظرة شاملة على إحصائيات وأداء الرحلات"
        LeftSection={
          <div className="flex items-center gap-2 text-sm bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
            <TrendingUp className="w-5 h-5 text-blue-700" />
            <span className="font-semibold text-gray-700">
              معدل النجاح:{" "}
              <span className="text-blue-700 font-bold">
                {successRate.toFixed(1)}%
              </span>
            </span>
          </div>
        }
      />

      <Separator />

      {/* STATS CARDS GRID */}
      <div className="grid gap-3 grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
        {chartData.map((item, i) => {
          const Icon = item.Icon;

          // Determine the navigation URL based on card name
          let cardHref = `/${locale}/trips?page=1`;
          if (item.name === "الرحلات النشطة") {
            cardHref = `/${locale}/trips?page=1&filters%5Bstatus%5D=processing`;
          } else if (item.name === "الرحلات الناجحة") {
            cardHref = `/${locale}/trips?page=1&filters%5Bstatus%5D=done`;
          } else if (item.name === "الرحلات الملغاة") {
            // For cancelled trips, we might want to show all cancelled statuses
            cardHref = `/${locale}/trips?page=1&filters%5Bstatus%5D=canceled_by_customer&filters%5Bstatus%5D=canceled_by_driver&filters%5Bstatus%5D=canceled_automatically`;
          }
          // For "إجمالي الرحلات" (Total Trips), just go to trips page without filter

          return (
            <Link
              key={i}
              href={cardHref}
              className="p-4 sm:p-5 rounded-2xl text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${item.color}dd, ${item.color}99)`,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xl sm:text-2xl font-extrabold">
                  {item.value.toLocaleString()}
                </span>
              </div>
              <p className="mt-2 text-xs sm:text-sm font-medium opacity-90 text-nowrap">
                {item.name}
              </p>
            </Link>
          );
        })}
      </div>

      {/* CATEGORY CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {categories.map((category, i) => {
          const Icon = category.Icon;
          return (
            <Card
              key={i}
              className="rounded-2xl shadow-sm border border-border/60 hover:shadow-md transition-all"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-xl text-white"
                      style={{ backgroundColor: category.color }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-800">
                      {category.name}
                    </CardTitle>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-gray-700 border-gray-300 px-3 py-1 rounded-full text-sm font-bold"
                  >
                    {category.total.toLocaleString()}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                {/* BAR CHART */}
                <div className="h-[200px] mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={category.subTypes}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#E5E7EB"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="name"
                        interval={0}
                        tickMargin={10}
                        axisLine={false}
                        tick={({ x, y, payload }) => (
                          <g transform={`translate(${x},${y})`}>
                            <text
                              dy={14}
                              textAnchor="middle"
                              fill="#374151"
                              fontSize={10}
                              fontWeight="600"
                            >
                              {payload.value}
                            </text>
                          </g>
                        )}
                      />

                      <YAxis
                        tick={{ fill: "#4B5563", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />

                      <Tooltip
                        cursor={{ fill: "rgba(0,0,0,0.03)" }}
                        formatter={(v: number) => v.toLocaleString()}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #E5E7EB",
                          borderRadius: "10px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                          fontWeight: 600,
                          fontSize: 12,
                        }}
                      />

                      <Bar
                        dataKey="value"
                        barSize={30}
                        radius={[8, 8, 0, 0]}
                        animationDuration={300}
                      >
                        {category.subTypes.map((s, j) => (
                          <Cell key={j} fill={s.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* NUMERIC DETAILS */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700 text-sm border-b pb-2">
                    التفاصيل الرقمية:
                  </h4>
                  {category.subTypes.map((sub, j) => {
                    const SubIcon = sub.Icon;
                    return (
                      <div
                        key={j}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className="p-1.5 rounded-lg text-white"
                            style={{ backgroundColor: sub.color }}
                          >
                            <SubIcon className="w-4 h-4" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-800 text-sm">
                              {sub.name}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-gray-900 text-lg">
                            {sub.value.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500 font-medium">
                            {category.total
                              ? ((sub.value / category.total) * 100).toFixed(1)
                              : 0}
                            %
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* STATUS DISTRIBUTION (PIE) + INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PIE CHART */}
        <Card className="rounded-2xl shadow-sm border border-border/60">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-gray-800">
              <ChartPie className="w-6 h-6 text-primary" />
              التوزيع النسبي للرحلات
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={120}
                    paddingAngle={4}
                    labelLine={false}
                    label={({ percent, x, y }) => (
                      <text
                        x={x}
                        y={y}
                        fill="#111827"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="14"
                        fontWeight="700"
                      >
                        {`${((percent as number) * 100).toFixed(1)}%`}
                      </text>
                    )}
                  >
                    {statusDistribution.map((s, j) => (
                      <Cell
                        key={j}
                        fill={s.color}
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

            {/* LEGEND */}
            <div className="mt-6 grid grid-cols-1 gap-3">
              {statusDistribution.map((s, j) => (
                <div
                  key={j}
                  className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="font-semibold text-gray-700">
                      {s.name}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-gray-900 text-lg block">
                      {s.value.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500 font-medium">
                      {data.total
                        ? ((s.value / data.total) * 100).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* PERFORMANCE INSIGHTS */}
        <Card className="rounded-2xl shadow-sm border border-border/60">
          <CardHeader className="pb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Target className="w-7 h-7 text-primary" />
              <CardTitle className="text-xl font-bold text-gray-800">
                مؤشرات الأداء
              </CardTitle>
            </div>

            <Badge
              variant="outline"
              className="text-primary border-primary/40 px-3 py-1 rounded-full text-xs font-semibold"
            >
              تحليل الأداء
            </Badge>
          </CardHeader>

          <CardContent>
            <div className="space-y-6">
              {/* TWO METRICS */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="text-2xl font-bold text-green-700">
                    {successRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-green-600">معدل النجاح</div>
                </div>

                <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
                  <div className="text-2xl font-bold text-red-700">
                    {cancellationRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-red-600">معدل الإلغاء</div>
                </div>
              </div>

              {/* PROGRESS BARS */}
              <div className="space-y-4">
                <Progress
                  label="معدل النجاح"
                  value={successRate}
                  color="bg-green-500"
                />
                <Progress
                  label="معدل الإكمال"
                  value={completionRate}
                  color="bg-blue-500"
                />
              </div>

              {/* INSIGHTS */}
              <div className="space-y-3">
                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  رؤى الأداء
                </h4>

                {performanceInsights.map((i, idx) => {
                  const Icon = i.Icon;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${i.color} bg-white`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">
                            {i.metric}
                          </div>
                          <div className="text-sm text-gray-600">
                            {i.description}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-gray-900 text-lg">
                          {i.value}
                        </div>
                        <div
                          className={`text-sm font-medium ${
                            i.trend === "up"
                              ? "text-green-600"
                              : "text-blue-600"
                          }`}
                        >
                          {i.change}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* Small Memoized Component */
const Progress = React.memo(function Progress({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm text-gray-600 mb-2">
        <span>{label}</span>
        <span>{value.toFixed(1)}%</span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`${color} h-3 rounded-full transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
});

Progress.displayName = "Progress";
