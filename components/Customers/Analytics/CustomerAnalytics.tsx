"use client";

import React, { FC, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Users,
  UserCheck,
  Truck,
  Percent,
  BarChart3,
  User,
  TrendingUp,
  Target,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import HeadAndDescription from "@/components/shared/HeadAndDescription";
import FullPageHead from "@/components/shared/FullPageHead";

interface IProps {
  analyticsData: {
    totalActiveCustomers: number;
    totalServices: number;
    totalActiveDrivers: number;
  };
}

// Enhanced color palette with modern gradients
const GRADIENTS = {
  customers: ["#8B5CF6", "#7C3AED"], // Purple gradient
  drivers: ["#10B981", "#059669"], // Emerald gradient
  accent: ["#F59E0B", "#D97706"], // Amber gradient
  neutral: ["#6B7280", "#4B5563"], // Gray gradient
};

const StatsCard: FC<{
  title: string;
  value: number | string;
  icon: React.ReactNode;
  gradient: string;
  description: string;
  trend?: number;
}> = ({ title, value, icon, gradient, description, trend }) => (
  <Card
    className={`rounded-2xl border-0 shadow-lg transition-all duration-300 hover:shadow-xl ${gradient} text-white relative overflow-hidden`}
  >
    {/* Background pattern */}
    <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
      <div className="w-full h-full bg-white rounded-full -translate-y-16 translate-x-16"></div>
    </div>

    <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
      <CardTitle className="text-lg font-bold tracking-tight">
        {title}
      </CardTitle>
      <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">{icon}</div>
    </CardHeader>
    <CardContent className="relative z-10">
      <div className="flex items-end justify-between">
        <p className="text-4xl font-black tracking-tight drop-shadow-sm">
          {value}
        </p>
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
              trend >= 0
                ? "bg-green-500/30 text-green-100"
                : "bg-red-500/30 text-red-100"
            }`}
          >
            <TrendingUp
              className={`w-3 h-3 ${trend < 0 ? "rotate-180" : ""}`}
            />
            {trend > 0 ? "+" : ""}
            {trend}%
          </div>
        )}
      </div>
      <p className="text-sm font-medium opacity-90 mt-3 tracking-wide">
        {description}
      </p>
    </CardContent>
  </Card>
);

const PieChartComponent: FC<{
  data: { name: string; value: number; color: string }[];
}> = ({ data }) => {
  const pieCells = useMemo(
    () =>
      data.map((entry, index) => (
        <Cell
          key={`cell-${index}`}
          fill={entry.color}
          stroke="white"
          strokeWidth={3}
          className="transition-all duration-500 hover:opacity-80 cursor-pointer"
        />
      )),
    [data]
  );

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <defs>
          <linearGradient id="customersGradient" x1="0" y1="0" x2="1" y2="1">
            <stop
              offset="0%"
              stopColor={GRADIENTS.customers[0]}
              stopOpacity={0.95}
            />
            <stop
              offset="100%"
              stopColor={GRADIENTS.customers[1]}
              stopOpacity={0.8}
            />
          </linearGradient>
          <linearGradient id="driversGradient" x1="0" y1="0" x2="1" y2="1">
            <stop
              offset="0%"
              stopColor={GRADIENTS.drivers[0]}
              stopOpacity={0.9}
            />
            <stop
              offset="100%"
              stopColor={GRADIENTS.drivers[1]}
              stopOpacity={0.7}
            />
          </linearGradient>
        </defs>

        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={75}
          outerRadius={130}
          paddingAngle={2}
          dataKey="value"
          animationDuration={1200}
          animationEasing="ease-out"
          label={({ name, percent, x, y }) => (
            <text
              x={x}
              y={y}
              fill="#1F2937"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="14"
              fontWeight="800"
              className="drop-shadow-sm"
            >
              {`${name} ${((percent as number) * 100).toFixed(1)}%`}
            </text>
          )}
          labelLine={false}
        >
          {pieCells}
        </Pie>

        <Tooltip
          formatter={(v: number) => [
            <span key="value" className="font-bold">
              {v.toLocaleString()}
            </span>,
            "العدد",
          ]}
          contentStyle={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            border: "1px solid #E5E7EB",
            borderRadius: "12px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            fontWeight: 600,
            fontSize: "14px",
            textAlign: "right",
          }}
          itemStyle={{
            color: "#1F2937",
            fontSize: "13px",
          }}
        />

        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          iconSize={10}
          formatter={(value, entry: any) => (
            <span
              style={{
                color: "#4B5563",
                fontWeight: 600,
                fontSize: "13px",
                marginRight: "8px",
              }}
            >
              {value}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

const CustomersOverview: FC<IProps> = ({ analyticsData }) => {
  const totalUsers = useMemo(
    () => analyticsData.totalActiveCustomers + analyticsData.totalActiveDrivers,
    [analyticsData.totalActiveCustomers, analyticsData.totalActiveDrivers]
  );

  const customersPercentage = useMemo(
    () => ((analyticsData.totalActiveCustomers / totalUsers) * 100).toFixed(1),
    [analyticsData.totalActiveCustomers, totalUsers]
  );

  const driversPercentage = useMemo(
    () => ((analyticsData.totalActiveDrivers / totalUsers) * 100).toFixed(1),
    [analyticsData.totalActiveDrivers, totalUsers]
  );

  const pieData = useMemo(
    () => [
      {
        name: "العملاء",
        value: analyticsData.totalActiveCustomers,
        color: "url(#customersGradient)",
      },
      {
        name: "السائقين",
        value: analyticsData.totalActiveDrivers,
        color: "url(#driversGradient)",
      },
    ],
    [analyticsData.totalActiveCustomers, analyticsData.totalActiveDrivers]
  );

  const averageCustomersPerService = useMemo(
    () =>
      analyticsData.totalServices
        ? (
            analyticsData.totalActiveCustomers / analyticsData.totalServices
          ).toFixed(1)
        : "0",
    [analyticsData.totalActiveCustomers, analyticsData.totalServices]
  );

  return (
    <div className="p-6 space-y-8 min-h-screen">
      {/* Enhanced Header */}
      <FullPageHead
        head=" نظرة عامة على العملاء"
        description=" تحليل شامل لتوزيع العملاء والسائقين ومقاييس الأداء الرئيسية"
        Icon={<Users className="w-8 h-8" />}
        LeftSection={
          <div className="flex items-center gap-3 text-sm bg-white/80 backdrop-blur-sm px-5 py-3 rounded-2xl border border-gray-200 shadow-lg">
            <Target className="w-5 h-5 text-purple-600" />
            <span className="font-bold text-gray-800">
              إجمالي العملاء النشطين:{" "}
              <span className="text-purple-700 font-black text-lg">
                {analyticsData.totalActiveCustomers.toLocaleString()}
              </span>
            </span>
          </div>
        }
      />

      <Separator />

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="العملاء النشطين"
          value={analyticsData.totalActiveCustomers.toLocaleString()}
          icon={<UserCheck className="w-6 h-6" />}
          gradient="bg-gradient-to-br from-purple-700 to-purple-500"
          description="عملاء نشطين في النظام"
          trend={12.5}
        />
        <StatsCard
          title="السائقين النشطين"
          value={analyticsData.totalActiveDrivers.toLocaleString()}
          icon={<Truck className="w-6 h-6" />}
          gradient="bg-gradient-to-br from-emerald-600 to-emerald-400"
          description="سائقين نشطين في النظام"
          trend={8.3}
        />
        <StatsCard
          title="إجمالي المستخدمين"
          value={totalUsers.toLocaleString()}
          icon={<Users className="w-6 h-6" />}
          gradient="bg-gradient-to-br from-gray-700 to-gray-500"
          description="مجموع العملاء والسائقين"
          trend={10.2}
        />
        <StatsCard
          title="نسبة العملاء"
          value={`${customersPercentage}%`}
          icon={<Percent className="w-6 h-6" />}
          gradient="bg-gradient-to-br from-amber-600 to-amber-400"
          description="من إجمالي المستخدمين"
          trend={2.1}
        />
      </div>

      {/* Enhanced Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* Enhanced Pie Chart */}
        <div className="lg:col-span-8">
          <Card className="rounded-3xl border border-gray-200/80 shadow-2xl hover:shadow-2xl transition-all duration-500 backdrop-blur-sm bg-white/95 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100/60 pb-6 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 shadow-md">
                  <BarChart3 className="w-8 h-8 text-purple-700" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black text-gray-900 tracking-tight">
                    توزيع المستخدمين
                  </CardTitle>
                  <p className="text-gray-600 text-sm font-medium mt-1">
                    مقارنة بين أعداد العملاء والسائقين النشطين
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-xl">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-600 to-purple-800"></div>
                  <span className="text-sm font-bold text-gray-700">
                    العملاء
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-700"></div>
                  <span className="text-sm font-bold text-gray-700">
                    السائقين
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8 flex flex-col gap-8">
              {/* Enhanced Stats Blocks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-5 bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl shadow-sm border border-purple-100">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-white shadow-md">
                      <User className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <span className="font-bold text-gray-700 block">
                        العملاء النشطين
                      </span>
                      <span className="text-purple-700 font-black text-lg block mt-1">
                        {customersPercentage}%
                      </span>
                    </div>
                  </div>
                  <span className="text-gray-900 font-black text-2xl">
                    {analyticsData.totalActiveCustomers.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-5 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-2xl shadow-sm border border-emerald-100">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-white shadow-md">
                      <Truck className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <span className="font-bold text-gray-700 block">
                        السائقين النشطين
                      </span>
                      <span className="text-emerald-700 font-black text-lg block mt-1">
                        {driversPercentage}%
                      </span>
                    </div>
                  </div>
                  <span className="text-gray-900 font-black text-2xl">
                    {analyticsData.totalActiveDrivers.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Enhanced Pie Chart Container */}
              <div className="w-full h-[400px] bg-gradient-to-br from-gray-50 to-white rounded-2xl p-4 border border-gray-100 shadow-inner">
                <PieChartComponent data={pieData} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Side Stats */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card className="rounded-2xl border border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">
                    متوسط العملاء لكل خدمة
                  </h3>
                  <p className="text-gray-600 text-sm font-medium">
                    عميل نشط لكل خدمة (بمتوسط)
                  </p>
                </div>
              </div>
              <div className="text-center py-6">
                <div className="text-5xl font-black bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
                  {averageCustomersPerService}
                </div>
                <div className="w-24 h-2 bg-gradient-to-r from-blue-500 to-blue-700 rounded-full mx-auto mt-4"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-amber-50 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-md">
                  <Percent className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">
                    توزيع المستخدمين
                  </h3>
                  <p className="text-gray-600 text-sm font-medium">
                    نسبة العملاء من الإجمالي
                  </p>
                </div>
              </div>
              <div className="text-center py-6">
                <div className="text-5xl font-black bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent mb-2">
                  {customersPercentage}%
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-amber-600 h-3 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${customersPercentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs font-bold text-gray-600 mt-2">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CustomersOverview;
