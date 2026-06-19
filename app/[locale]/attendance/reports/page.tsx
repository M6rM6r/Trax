"use client";

import { useMemo, type ComponentType } from "react";
import MainLayout from "@/components/shared/MainLayout";
import FullPageHead from "@/components/shared/FullPageHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Download, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAttendanceReports } from "@/hooks/useApi";
import dynamic from "next/dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */
const BarChart: ComponentType<any> = dynamic(
  () => import("recharts").then((mod) => mod.BarChart as ComponentType<any>),
  { ssr: false }
);
const Bar: ComponentType<any> = dynamic(
  () => import("recharts").then((mod) => mod.Bar as ComponentType<any>),
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
const ResponsiveContainer: ComponentType<any> = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer as ComponentType<any>),
  { ssr: false }
);
const Tooltip: ComponentType<any> = dynamic(
  () => import("recharts").then((mod) => mod.Tooltip as ComponentType<any>),
  { ssr: false }
);
const Cell: ComponentType<any> = dynamic(
  () => import("recharts").then((mod) => mod.Cell as ComponentType<any>),
  { ssr: false }
);
/* eslint-enable @typescript-eslint/no-explicit-any */

export default function AttendanceReportsPage() {
  const { data: attendance = [] } = useAttendanceReports();
  const presentCount = attendance.filter((r) => r.status === "present").length;
  const lateCount = attendance.filter((r) => r.status === "late").length;
  const absentCount = attendance.filter((r) => r.status === "absent").length;
  const onTimeRate =
    attendance.length > 0 ? ((presentCount / attendance.length) * 100).toFixed(1) : "0";
  const avgLateMinutes = Math.round(
    attendance.filter((r) => r.lateMinutes > 0).reduce((sum, r) => sum + r.lateMinutes, 0) /
      Math.max(attendance.filter((r) => r.lateMinutes > 0).length, 1)
  );

  const chartData = useMemo(
    () => [
      { name: "حاضر", value: presentCount, color: "#16A34A" },
      { name: "متأخر", value: lateCount, color: "#F59E0B" },
      { name: "غائب", value: absentCount, color: "#DC2626" },
    ],
    [presentCount, lateCount, absentCount]
  );

  return (
    <MainLayout>
      <div className="p-6 space-y-6 min-h-screen">
        <FullPageHead
          head="تقارير الحضور"
          description="تحليلات وإحصائيات الحضور والانصراف"
          Icon={<BarChart3 className="w-7 h-7" />}
          LeftSection={
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              تصدير التقرير
            </Button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">نسبة الحضور في الوقت</p>
                  <p className="text-3xl font-black text-green-600 mt-1">{onTimeRate}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">متوسط التأخير</p>
                  <p className="text-3xl font-black text-amber-600 mt-1">{avgLateMinutes} د</p>
                </div>
                <BarChart3 className="w-8 h-8 text-amber-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">إجمالي السجلات</p>
                  <p className="text-3xl font-black text-blue-600 mt-1">{attendance.length}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">أيام التأخير</p>
                  <p className="text-3xl font-black text-red-600 mt-1">{lateCount}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-bold">رسم بياني للحضور</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
