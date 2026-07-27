"use client";

import { useMemo, type ComponentType } from "react";
import MainLayout from "@/components/shared/MainLayout";
import FullPageHead from "@/components/shared/FullPageHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, FileText, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAttendanceReports, useEmployees, useRetentionInsights } from "@/hooks/useApi";
import { exportAttendanceToCSV, exportAttendanceToPDF } from "@/lib/utils/exportUtils";
import { useToast } from "@/hooks/use-toast";
import { LoadingSkeleton, ErrorState } from "@/components/shared/StateViews";
import dynamic from "next/dynamic";
import { useAuthStore } from "@/stores/useAuthStore";
import AccessDeniedCard from "@/components/shared/AccessDeniedCard";

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

interface ChartTooltipPayload {
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: ChartTooltipPayload[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl p-3 shadow-xl">
        <p className="font-bold text-foreground text-sm">{label}</p>
        <p className="text-sm text-muted-foreground text-muted-foreground">
          العدد: <span className="font-semibold">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function AttendanceReportsPage() {
  const { data: attendance = [], isLoading, isError, refetch } = useAttendanceReports();
  const { data: employees = [] } = useEmployees();
  const {
    data: retentionInsights,
    isLoading: isRetentionLoading,
    isError: isRetentionError,
  } = useRetentionInsights(attendance, employees);
  const { role } = useAuthStore();
  const { toast } = useToast();
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
      { name: "حاضر", value: presentCount, color: "hsl(var(--chart-1))" },
      { name: "متأخر", value: lateCount, color: "hsl(var(--chart-3))" },
      { name: "غائب", value: absentCount, color: "hsl(var(--chart-5))" },
    ],
    [presentCount, lateCount, absentCount]
  );

  const topLateEmployees = useMemo(() => {
    const lateMap = new Map<
      string,
      { name: string; lateCount: number; totalLateMinutes: number; avgLateMinutes: number }
    >();

    attendance.forEach((record) => {
      if (record.lateMinutes <= 0) return;
      const key = String(record.employeeId);
      const current = lateMap.get(key) ?? {
        name: record.employeeName,
        lateCount: 0,
        totalLateMinutes: 0,
        avgLateMinutes: 0,
      };
      current.lateCount += 1;
      current.totalLateMinutes += record.lateMinutes;
      current.avgLateMinutes = Math.round(current.totalLateMinutes / current.lateCount);
      lateMap.set(key, current);
    });

    return Array.from(lateMap.values())
      .sort((a, b) => b.totalLateMinutes - a.totalLateMinutes)
      .slice(0, 5);
  }, [attendance]);

  const departmentPerformance = useMemo(() => {
    const employeeMap = new Map(employees.map((e) => [String(e.id), e]));
    const departmentMap = new Map<
      string,
      { department: string; total: number; presentOrLate: number; absent: number; rate: number }
    >();

    attendance.forEach((record) => {
      const emp = employeeMap.get(String(record.employeeId));
      const department = emp?.department || "غير محدد";
      const current = departmentMap.get(department) ?? {
        department,
        total: 0,
        presentOrLate: 0,
        absent: 0,
        rate: 0,
      };

      current.total += 1;
      if (record.status === "present" || record.status === "late") {
        current.presentOrLate += 1;
      }
      if (record.status === "absent") {
        current.absent += 1;
      }
      current.rate = Math.round((current.presentOrLate / current.total) * 100);

      departmentMap.set(department, current);
    });

    return Array.from(departmentMap.values())
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 6);
  }, [attendance, employees]);

  if (role === "employee") {
    return (
      <MainLayout>
        <div className="p-6 min-h-screen">
          <AccessDeniedCard
            icon={BarChart3}
            message="تقارير الحضور متاحة لإدارة الشركة فقط."
            ctaHref="/check-in"
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6 min-h-screen">
        <FullPageHead
          head="تقارير الحضور"
          description="تحليلات وإحصائيات الحضور والانصراف"
          Icon={<BarChart3 className="w-7 h-7" />}
          LeftSection={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => {
                  exportAttendanceToCSV(attendance);
                  toast({ description: "تم تصدير CSV بنجاح" });
                }}
              >
                <FileSpreadsheet className="w-4 h-4" />
                CSV
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={async () => {
                  await exportAttendanceToPDF(attendance);
                  toast({ description: "تم تصدير PDF بنجاح" });
                }}
              >
                <FileText className="w-4 h-4" />
                PDF
              </Button>
            </div>
          }
        />

        {isLoading && <LoadingSkeleton variant="cards" />}
        {isError && <ErrorState onRetry={() => refetch()} />}
        {!isLoading && !isError && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-0 shadow-md bg-card animate-stagger-1">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground text-muted-foreground">
                        نسبة الحضور في الوقت
                      </p>
                      <p className="text-3xl font-black text-primary mt-1">
                        {onTimeRate}%
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md bg-card animate-stagger-2">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground text-muted-foreground">متوسط التأخير</p>
                      <p className="text-3xl font-black text-[hsl(48_96%_53%)] mt-1">
                        {avgLateMinutes} د
                      </p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-[hsl(48_96%_53%)]" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md bg-card animate-stagger-3">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground text-muted-foreground">إجمالي السجلات</p>
                      <p className="text-3xl font-black text-primary mt-1">
                        {attendance.length}
                      </p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md bg-card animate-stagger-4">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground text-muted-foreground">أيام التأخير</p>
                      <p className="text-3xl font-black text-destructive mt-1">
                        {lateCount}
                      </p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-destructive" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {isRetentionLoading && (
              <Card className="border-0 shadow-lg bg-card">
                <CardContent className="p-5 text-sm text-muted-foreground">
                  جاري تحليل مؤشرات الاحتفاظ بالموظفين...
                </CardContent>
              </Card>
            )}

            {isRetentionError && (
              <Card className="border-0 shadow-lg bg-card">
                <CardContent className="p-5 text-sm text-[hsl(48_96%_53%)] bg-[hsl(48_96%_53%/0.1)] rounded-xl">
                  خدمة الذكاء التحليلي غير متاحة حالياً. التقارير الأساسية ما زالت تعمل بشكل طبيعي.
                </CardContent>
              </Card>
            )}

            {retentionInsights && (
              <Card className="border-0 shadow-lg bg-card">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-foreground">
                    ذكاء الاحتفاظ بالموظفين
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground text-muted-foreground">
                      درجة الاحتفاظ المتوقعة
                    </p>
                    <span className="text-2xl font-black text-primary">
                      {retentionInsights.retentionScore}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground text-muted-foreground">مستوى المخاطر</p>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        retentionInsights.riskLevel === "low"
                          ? "bg-primary/10 text-primary bg-primary/10 text-primary"
                          : retentionInsights.riskLevel === "medium"
                            ? "bg-[hsl(48_96%_53%/0.15)] text-[hsl(48_96%_53%)] "
                            : "bg-destructive/10 text-destructive bg-destructive/10 text-destructive"
                      }`}
                    >
                      {retentionInsights.riskLevel === "low"
                        ? "منخفض"
                        : retentionInsights.riskLevel === "medium"
                          ? "متوسط"
                          : "مرتفع"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {retentionInsights.summary}
                  </p>
                  {retentionInsights.recommendedActions.length > 0 && (
                    <ul className="list-disc pr-5 text-sm text-muted-foreground space-y-1">
                      {retentionInsights.recommendedActions.map((action) => (
                        <li key={action}>{action}</li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="border-0 shadow-lg bg-card animate-slide-up">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-foreground">
                  رسم بياني للحضور
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      className="dark:[&_.recharts-cartesian-axis-tick_text]:fill-slate-400"
                    />
                    <YAxis
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      className="dark:[&_.recharts-cartesian-axis-tick_text]:fill-slate-400"
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.05)" }} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border-0 shadow-lg bg-card">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-foreground">
                    أعلى الموظفين تأخراً
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {topLateEmployees.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      لا توجد حالات تأخير حالياً — أداء ممتاز ✅
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {topLateEmployees.map((emp, idx) => (
                        <div
                          key={`${emp.name}-${idx}`}
                          className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2"
                        >
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {emp.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {emp.lateCount} مرات تأخير
                            </p>
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold text-[hsl(48_96%_53%)]">
                              {emp.totalLateMinutes} د
                            </p>
                            <p className="text-xs text-muted-foreground">
                              متوسط {emp.avgLateMinutes} د
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-card">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-foreground">
                    أداء الأقسام
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {departmentPerformance.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      لا توجد بيانات كافية للأقسام.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {departmentPerformance.map((dept) => (
                        <div key={dept.department}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="font-medium text-foreground">
                              {dept.department}
                            </span>
                            <span className="font-bold text-primary">
                              {dept.rate}%
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                dept.rate >= 90
                                  ? "bg-primary"
                                  : dept.rate >= 70
                                    ? "bg-[hsl(48_96%_53%/0.1)]0"
                                    : "bg-destructive"
                              }`}
                              style={{ width: `${dept.rate}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
