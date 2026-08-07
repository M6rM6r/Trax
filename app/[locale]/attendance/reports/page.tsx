"use client";

import { useMemo, type ComponentType } from "react";
import MainLayout from "@/components/shared/MainLayout";
import FullPageHead from "@/components/shared/FullPageHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAttendanceReports, useEmployees, useRetentionInsights } from "@/hooks/useApi";
import { exportAttendanceToCSV } from "@/lib/utils/exportUtils";
import { useToast } from "@/hooks/use-toast";
import { LoadingSkeleton, ErrorState } from "@/components/shared/StateViews";
import dynamic from "next/dynamic";
import { useAuthStore } from "@/stores/useAuthStore";
import AccessDeniedCard from "@/components/shared/AccessDeniedCard";
import { useTranslations } from "next-intl";
import { useCompanySettingsStore } from "@/stores/useCompanySettingsStore";
import { computeAttendanceCoverage } from "@/lib/utils/attendanceAbsent";
import { DEFAULT_COMPANY_TIMEZONE } from "@/lib/utils/companyDate";

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
  const t = useTranslations("AttendanceReports");
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl p-3 shadow-xl">
        <p className="font-bold text-foreground text-sm">{label}</p>
        <p className="text-sm text-muted-foreground">
          {t("count")}: <span className="font-semibold">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function AttendanceReportsPage() {
  const {
    data: attendance = [],
    isLoading,
    isError,
    refetch,
    dateRange: reportsWindow,
  } = useAttendanceReports();
  const { data: employees = [] } = useEmployees();
  const workStartTime = useCompanySettingsStore((s) => s.workStartTime);
  const gracePeriodMinutes = useCompanySettingsStore((s) => s.gracePeriodMinutes);
  const timezone = useCompanySettingsStore((s) => s.timezone) || DEFAULT_COMPANY_TIMEZONE;
  const weekendDays = useCompanySettingsStore((s) => s.weekendDays);
  const companySettings = useMemo(
    () => ({ workStartTime, gracePeriodMinutes, timezone, weekendDays }),
    [workStartTime, gracePeriodMinutes, timezone, weekendDays]
  );
  const {
    data: retentionInsights,
    isLoading: isRetentionLoading,
    isError: isRetentionError,
  } = useRetentionInsights(attendance, employees, reportsWindow);
  const role = useAuthStore((s) => s.role);
  const { toast } = useToast();
  const t = useTranslations("AttendanceReports");

  // Same bounded window as fetch (last 30d) — do not shrink KPIs to min/max punch dates.
  const coverageWindow = reportsWindow;

  const { presentCount, lateCount, absentCount, onTimeRate, avgLateMinutes } = useMemo(() => {
    const cov = computeAttendanceCoverage({
      employees,
      attendance,
      fromYmd: coverageWindow.from,
      toYmd: coverageWindow.to,
      settings: companySettings,
    });
    const lateRecords = attendance.filter((r) => (r.lateMinutes ?? 0) > 0 && r.checkInTime);
    const lateSum = lateRecords.reduce((s, r) => s + (r.lateMinutes ?? 0), 0);
    const avg = Math.round(lateSum / Math.max(lateRecords.length, 1));
    return {
      presentCount: cov.present,
      lateCount: cov.late,
      absentCount: cov.absent,
      onTimeRate: String(cov.attendanceRate),
      avgLateMinutes: avg,
    };
  }, [attendance, employees, coverageWindow, companySettings]);

  const chartData = useMemo(
    () => [
      { name: t("present"), value: presentCount, color: "hsl(var(--chart-1))" },
      { name: t("late"), value: lateCount, color: "hsl(var(--chart-3))" },
      { name: t("absent"), value: absentCount, color: "hsl(var(--chart-5))" },
    ],
    [presentCount, lateCount, absentCount, t]
  );

  const topLateEmployees = useMemo(() => {
    const lateMap = new Map<
      string,
      { name: string; lateCount: number; totalLateMinutes: number; avgLateMinutes: number }
    >();

    attendance.forEach((record) => {
      if ((record.lateMinutes ?? 0) <= 0 || !record.checkInTime) return;
      const key = String(record.employeeId);
      const current = lateMap.get(key) ?? {
        name: record.employeeName,
        lateCount: 0,
        totalLateMinutes: 0,
        avgLateMinutes: 0,
      };
      current.lateCount += 1;
      current.totalLateMinutes += record.lateMinutes ?? 0;
      current.avgLateMinutes = Math.round(current.totalLateMinutes / current.lateCount);
      lateMap.set(key, current);
    });

    return Array.from(lateMap.values())
      .sort((a, b) => b.totalLateMinutes - a.totalLateMinutes)
      .slice(0, 5);
  }, [attendance]);

  const departmentPerformance = useMemo(() => {
    const departments = new Map<string, typeof employees>();
    for (const e of employees.filter((x) => x.status === "active")) {
      const dep = e.department || t("undefinedDepartment");
      const list = departments.get(dep) ?? [];
      list.push(e);
      departments.set(dep, list);
    }
    return Array.from(departments.entries())
      .map(([department, roster]) => {
        const cov = computeAttendanceCoverage({
          employees: roster,
          attendance,
          fromYmd: coverageWindow.from,
          toYmd: coverageWindow.to,
          settings: companySettings,
        });
        return {
          department,
          total: cov.expected,
          presentOrLate: cov.present + cov.late,
          absent: cov.absent,
          rate: Math.round(cov.attendanceRate),
        };
      })
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 6);
  }, [attendance, employees, t, coverageWindow, companySettings]);

  if (role === "employee") {
    return (
      <MainLayout>
        <div className="p-6 min-h-screen">
          <AccessDeniedCard icon={BarChart3} message={t("adminOnly")} ctaHref="/check-in" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6 min-h-screen">
        <FullPageHead
          head={t("title")}
          description={t("description")}
          Icon={<BarChart3 className="w-7 h-7" />}
          LeftSection={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => {
                  exportAttendanceToCSV(attendance);
                  toast({ description: t("csvExported") });
                }}
              >
                <FileSpreadsheet className="w-4 h-4" />
                CSV
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
                      <p className="text-sm text-muted-foreground">{t("onTimeRate")}</p>
                      <p className="text-3xl font-black text-primary mt-1">{onTimeRate}%</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md bg-card animate-stagger-2">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{t("avgLateMinutes")}</p>
                      <p className="text-3xl font-black text-[hsl(48_96%_53%)] mt-1">
                        {avgLateMinutes} {t("minutes")}
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
                      <p className="text-sm text-muted-foreground">{t("totalRecords")}</p>
                      <p className="text-3xl font-black text-primary mt-1">{attendance.length}</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md bg-card animate-stagger-4">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{t("lateDays")}</p>
                      <p className="text-3xl font-black text-destructive mt-1">{lateCount}</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-destructive" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {isRetentionLoading && (
              <Card className="border-0 shadow-lg bg-card">
                <CardContent className="p-5 text-sm text-muted-foreground">
                  {t("retentionAnalyzing")}
                </CardContent>
              </Card>
            )}

            {isRetentionError && (
              <Card className="border-0 shadow-lg bg-card">
                <CardContent className="p-5 text-sm text-[hsl(48_96%_53%)] bg-[hsl(48_96%_53%/0.1)] rounded-xl">
                  {t("retentionUnavailable")}
                </CardContent>
              </Card>
            )}

            {retentionInsights && (
              <Card className="border-0 shadow-lg bg-card">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-foreground">
                    {t("retentionTitle")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{t("retentionScore")}</p>
                    <span className="text-2xl font-black text-primary">
                      {retentionInsights.retentionScore}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{t("riskLevel")}</p>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        retentionInsights.riskLevel === "low"
                          ? "bg-primary/10 text-primary"
                          : retentionInsights.riskLevel === "medium"
                            ? "bg-[hsl(48_96%_53%/0.15)] text-[hsl(48_96%_53%)]"
                            : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {retentionInsights.riskLevel === "low"
                        ? t("riskLow")
                        : retentionInsights.riskLevel === "medium"
                          ? t("riskMedium")
                          : t("riskHigh")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{retentionInsights.summary}</p>
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
                  {t("chartTitle")}
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
                    {t("topLateEmployees")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {topLateEmployees.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("noLateEmployees")}</p>
                  ) : (
                    <div className="space-y-2">
                      {topLateEmployees.map((emp, idx) => (
                        <div
                          key={`${emp.name}-${idx}`}
                          className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2"
                        >
                          <div>
                            <p className="text-sm font-semibold text-foreground">{emp.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {emp.lateCount} {t("lateTimes")}
                            </p>
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold text-[hsl(48_96%_53%)]">
                              {t("totalLateMinutes", { minutes: emp.totalLateMinutes })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t("avgLateMinutesLabel", { minutes: emp.avgLateMinutes })}
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
                    {t("departmentPerformance")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {departmentPerformance.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("noDepartmentData")}</p>
                  ) : (
                    <div className="space-y-3">
                      {departmentPerformance.map((dept) => (
                        <div key={dept.department}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="font-medium text-foreground">{dept.department}</span>
                            <span className="font-bold text-primary">{dept.rate}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                dept.rate >= 90
                                  ? "bg-primary"
                                  : dept.rate >= 70
                                    ? "bg-[hsl(48_96%_53%/0.7)]"
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
