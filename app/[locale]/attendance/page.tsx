"use client";

import { useState, useMemo, memo } from "react";
import MainLayout from "@/components/shared/MainLayout";
import FullPageHead from "@/components/shared/FullPageHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  FileText,
  FileSpreadsheet,
  ChevronRight,
  ChevronLeft,
  Filter,
  X,
  UserCheck,
  Clock,
  UserX,
  Users,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAttendance, useEmployees } from "@/hooks/useApi";
import { exportAttendanceToCSV, exportAttendanceToPDF } from "@/lib/utils/exportUtils";
import { firebaseData } from "@/lib/services/firebase";
import { toastSuccess, toastError } from "@/hooks/use-toast";
import { hapticTap } from "@/lib/utils/haptics";
import { EmptyState, ErrorState } from "@/components/shared/StateViews";
import AttendanceSkeleton from "@/components/shared/Skeletons/AttendanceSkeleton";
import { DataTable } from "@/components/shared/DataTable/DataTable";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { motion, AnimatePresence } from "framer-motion";
import type { AttendanceRecord } from "@/lib/types/trackingTypes";
import { CountUp } from "@/components/shared/CountUp";
import { useTranslations } from "next-intl";

function useAttendanceStatusLabels() {
  const t = useTranslations("Attendance");
  return {
    present: t("present"),
    late: t("late"),
    absent: t("absent"),
    checked_out: t("statusCheckedOut"),
  };
}

function useDayHeaders() {
  const t = useTranslations("Attendance");
  const raw = t("dayHeaders") as unknown as string[] | Record<string, string>;
  return Array.isArray(raw) ? raw : Object.values(raw || {});
}

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  records: AttendanceRecord[];
  attendanceRate: number;
}

function getMonthDays(year: number, month: number, records: AttendanceRecord[]): CalendarDay[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const days: CalendarDay[] = [];

  // Previous month padding
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    days.push({ date, day: date.getDate(), isCurrentMonth: false, records: [], attendanceRate: 0 });
  }

  // Current month days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    const dateStr = date.toISOString().split("T")[0];
    const dayRecords = records.filter((r) => r.date === dateStr);
    const present = dayRecords.filter((r) => r.status === "present").length;
    const late = dayRecords.filter((r) => r.status === "late").length;
    const total = dayRecords.length;
    const rate = total > 0 ? ((present + late) / total) * 100 : 0;
    days.push({ date, day: d, isCurrentMonth: true, records: dayRecords, attendanceRate: rate });
  }

  // Next month padding to fill 6 rows
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    const date = new Date(year, month + 1, d);
    days.push({ date, day: d, isCurrentMonth: false, records: [], attendanceRate: 0 });
  }

  return days;
}

function getDayColor(day: CalendarDay): string {
  if (!day.isCurrentMonth || day.records.length === 0) return "bg-muted";
  if (day.attendanceRate >= 90) return "bg-primary text-primary-foreground";
  if (day.attendanceRate >= 60) return "bg-[hsl(48_96%_53%/0.1)]0 text-primary-foreground";
  return "bg-destructive text-primary-foreground";
}

const CalendarHeatmap = memo(function CalendarHeatmap({
  records,
  onDayClick,
}: {
  records: AttendanceRecord[];
  onDayClick: (day: CalendarDay) => void;
}) {
  const t = useTranslations("Attendance");
  const dayHeaders = useDayHeaders();
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  const days = useMemo(() => getMonthDays(year, month, records), [year, month, records]);

  return (
    <Card className="border-0 shadow-lg bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-foreground">
                {t("calendarTitle")}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{t("calendarSubtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label={t("previousMonth")}
            >
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            <span className="text-sm font-medium text-foreground min-w-[120px] text-center">
              {monthName}
            </span>
            <button
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label={t("nextMonth")}
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayHeaders.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, i) => (
            <button
              key={i}
              onClick={() => day.isCurrentMonth && day.records.length > 0 && onDayClick(day)}
              disabled={!day.isCurrentMonth || day.records.length === 0}
              className={`aspect-square rounded-lg text-sm font-medium transition-all flex flex-col items-center justify-center gap-0.5 ${getDayColor(day)} ${
                day.isCurrentMonth && day.records.length > 0
                  ? "cursor-pointer hover:scale-105 hover:shadow-md"
                  : "cursor-default"
              }`}
              title={
                day.records.length > 0
                  ? t("recordsCount", {
                      count: day.records.length,
                      rate: Math.round(day.attendanceRate),
                    })
                  : ""
              }
            >
              <span>{day.day}</span>
              {day.records.length > 0 && (
                <>
                  <div className="flex gap-0.5 justify-center">
                    {day.records.some((r) => r.status === "present") && (
                      <span className="w-1.5 h-1.5 rounded-full bg-background/70" />
                    )}
                    {day.records.some((r) => r.status === "late") && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[hsl(48_96%_53%/0.2)]" />
                    )}
                    {day.records.some((r) => r.status === "absent") && (
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive/20" />
                    )}
                  </div>
                  <span className="text-[9px] opacity-75">{Math.round(day.attendanceRate)}%</span>
                </>
              )}
            </button>
          ))}
        </div>
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-primary" /> {t("excellentAttendance")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[hsl(48_96%_53%/0.1)]0" /> {t("partialAttendance")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-destructive" /> {t("highAbsence")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-muted-foreground/30 bg-muted" /> {t("noData")}
          </span>
        </div>
      </CardContent>
    </Card>
  );
});

export default function AttendancePage() {
  const t = useTranslations("Attendance");
  const statusLabels = useAttendanceStatusLabels();
  const { data: attendance = [], isLoading, isError, refetch } = useAttendance();
  const { data: employees = [] } = useEmployees();
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    employeeId: "",
    department: "",
    statuses: [] as string[],
  });

  const departments = useMemo(() => {
    const depts = new Set(employees.map((e) => e.department).filter(Boolean));
    return Array.from(depts);
  }, [employees]);

  const filteredAttendance = useMemo(() => {
    return attendance.filter((r) => {
      if (filters.employeeId && String(r.employeeId) !== String(filters.employeeId)) return false;
      if (filters.department) {
        const emp = employees.find((e) => String(e.id) === String(r.employeeId));
        if (emp?.department !== filters.department) return false;
      }
      if (filters.statuses.length > 0 && !filters.statuses.includes(r.status)) return false;
      return true;
    });
  }, [attendance, employees, filters]);

  const activeFilterCount =
    (filters.employeeId ? 1 : 0) + (filters.department ? 1 : 0) + filters.statuses.length;

  const clearFilters = () => {
    hapticTap();
    setFilters({ employeeId: "", department: "", statuses: [] });
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6 min-h-screen">
        <FullPageHead
          head={t("title")}
          description={t("description")}
          Icon={<Calendar className="w-7 h-7" />}
          LeftSection={
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex items-center bg-muted rounded-lg p-1">
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                    viewMode === "table" ? "bg-card shadow-sm font-medium" : "text-muted-foreground"
                  }`}
                >
                  {t("table")}
                </button>
                <button
                  onClick={() => setViewMode("calendar")}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                    viewMode === "calendar"
                      ? "bg-card shadow-sm font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {t("calendar")}
                </button>
              </div>

              {/* Filter Button */}
              <Popover open={showFilters} onOpenChange={setShowFilters}>
                <PopoverTrigger asChild>
                  <button
                    className="relative flex items-center gap-2 px-3 py-2 rounded-lg border border-input text-sm text-muted-foreground hover:bg-muted transition-colors"
                    aria-label={t("filter")}
                  >
                    <Filter className="w-4 h-4" />
                    {t("filter")}
                    {activeFilterCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary/50 text-primary-foreground text-xs flex items-center justify-center font-bold">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-4 bg-card border-border" align="start">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                        {t("employee")}
                      </label>
                      <select
                        value={filters.employeeId}
                        onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
                        className="w-full px-3 py-2 border border-input rounded-lg bg-transparent bg-background text-foreground text-sm"
                      >
                        <option value="">{t("all")}</option>
                        {employees.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                        {t("department")}
                      </label>
                      <select
                        value={filters.department}
                        onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                        className="w-full px-3 py-2 border border-input rounded-lg bg-transparent bg-background text-foreground text-sm"
                      >
                        <option value="">{t("all")}</option>
                        {departments.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                        {t("status")}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(statusLabels).map(([key, label]) => (
                          <button
                            key={key}
                            onClick={() => {
                              hapticTap();
                              setFilters({
                                ...filters,
                                statuses: filters.statuses.includes(key)
                                  ? filters.statuses.filter((s) => s !== key)
                                  : [...filters.statuses, key],
                              });
                            }}
                            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                              filters.statuses.includes(key)
                                ? "bg-primary/50 text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {filters.statuses.includes(key) && <Check className="w-3 h-3" />}
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {activeFilterCount > 0 && (
                      <button
                        onClick={clearFilters}
                        className="w-full py-2 text-sm text-destructive hover:bg-destructive/5 dark:hover:bg-destructive/10 rounded-lg transition-colors"
                      >
                        {t("clearFilters")}
                      </button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => {
                  if (filteredAttendance.length === 0) {
                    toastError(t("noRecords"));
                    return;
                  }
                  try {
                    exportAttendanceToCSV(filteredAttendance);
                    toastSuccess(t("exportCsvSuccess"));
                  } catch (err) {
                    console.error("[exportCsv] failed:", err);
                    toastError(err instanceof Error ? err.message : t("exportServerFailed"));
                  }
                }}
              >
                <FileSpreadsheet className="w-4 h-4" />
                {t("exportCsv")}
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={async () => {
                  if (filteredAttendance.length === 0) {
                    toastError(t("noRecords"));
                    return;
                  }
                  try {
                    await exportAttendanceToPDF(filteredAttendance);
                    toastSuccess(t("exportPdfSuccess"));
                  } catch (err) {
                    console.error("[exportPdf] failed:", err);
                    toastError(err instanceof Error ? err.message : t("exportServerFailed"));
                  }
                }}
              >
                <FileText className="w-4 h-4" />
                {t("exportPdf")}
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={async () => {
                  try {
                    const today = new Date().toLocaleDateString("sv-SE");
                    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toLocaleDateString(
                      "sv-SE"
                    );
                    const result = await firebaseData.cloudFunctions.exportAttendance(
                      thirtyDaysAgo,
                      today
                    );
                    const blob = new Blob(["\uFEFF" + result.csv], {
                      type: "text/csv;charset=utf-8;",
                    });
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(blob);
                    link.download = `attendance_server_${today}.csv`;
                    link.click();
                    URL.revokeObjectURL(link.href);
                    toastSuccess(t("exportServerSuccess", { count: result.count }));
                  } catch (err) {
                    console.error("[exportAttendance] failed:", err);
                    toastError(err instanceof Error ? err.message : t("exportServerFailed"));
                  }
                }}
              >
                <FileSpreadsheet className="w-4 h-4" />
                {t("exportServer")}
              </Button>
            </div>
          }
        />

        {/* Summary header with attendance rate bar */}
        {attendance.length > 0 &&
          (() => {
            const total = attendance.length;
            const presentCount = attendance.filter((r) => r.status === "present").length;
            const lateCount = attendance.filter((r) => r.status === "late").length;
            const absentCount = attendance.filter((r) => r.status === "absent").length;
            const attendanceRate = Math.round(((presentCount + lateCount) / total) * 100);
            return (
              <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-gray-100/50 dark:from-slate-800 dark:to-slate-900 border border-border/60 border-border p-5 shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
                      {t("overallAttendanceRate")}
                    </p>
                    <p className="text-3xl font-black text-foreground mt-0.5">
                      {attendanceRate}
                      <span className="text-lg font-semibold text-muted-foreground">%</span>
                    </p>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-xl font-bold text-primary">{presentCount}</p>
                      <p className="text-xs text-muted-foreground">{t("present")}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-[hsl(48_96%_53%)]">{lateCount}</p>
                      <p className="text-xs text-muted-foreground">{t("late")}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-destructive">{absentCount}</p>
                      <p className="text-xs text-muted-foreground">{t("absent")}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-primary">{total}</p>
                      <p className="text-xs text-muted-foreground">{t("total")}</p>
                    </div>
                  </div>
                </div>
                {/* Stacked progress bar */}
                <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
                  <div
                    className="bg-primary transition-all duration-700 rounded-r-full"
                    style={{ width: `${(presentCount / total) * 100}%` }}
                  />
                  <div
                    className="bg-[hsl(48_96%_53%)] transition-all duration-700"
                    style={{ width: `${(lateCount / total) * 100}%` }}
                  />
                  <div
                    className="bg-destructive transition-all duration-700 rounded-l-full"
                    style={{ width: `${(absentCount / total) * 100}%` }}
                  />
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground/70">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    {t("present")}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[hsl(48_96%_53%)]" />
                    {t("late")}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-destructive" />
                    {t("absent")}
                  </span>
                </div>
              </div>
            );
          })()}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              {
                label: t("present"),
                count: attendance.filter((r) => r.status === "present").length,
                Icon: UserCheck,
                color: "text-primary",
                bg: "bg-primary/10",
                border: "border-b-4 border-primary",
                stagger: "animate-stagger-1",
              },
              {
                label: t("late"),
                count: attendance.filter((r) => r.status === "late").length,
                Icon: Clock,
                color: "text-[hsl(48_96%_53%)]",
                bg: "bg-[hsl(48_96%_53%/0.15)] dark:bg-[hsl(48_96%_53%/0.15)]",
                border: "border-b-4 border-amber-500",
                stagger: "animate-stagger-2",
              },
              {
                label: t("absent"),
                count: attendance.filter((r) => r.status === "absent").length,
                Icon: UserX,
                color: "text-destructive",
                bg: "bg-destructive/10",
                border: "border-b-4 border-red-500",
                stagger: "animate-stagger-3",
              },
              {
                label: t("total"),
                count: attendance.length,
                Icon: Users,
                color: "text-primary",
                bg: "bg-primary/10 bg-primary/10",
                border: "border-b-4 border-primary",
                stagger: "animate-stagger-4",
              },
            ] as const
          ).map(({ label, count, Icon, color, bg, border, stagger }) => (
            <Card key={label} className={`border-0 shadow-md bg-card ${stagger} ${border}`}>
              <CardContent className="pt-6 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}
                  >
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div>
                    <p className={`text-3xl font-black ${color}`}>
                      <CountUp end={count} duration={900} />
                    </p>
                    <p className="text-sm text-muted-foreground">{label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {isLoading && <AttendanceSkeleton />}
        {isError && <ErrorState onRetry={() => refetch()} />}
        {!isLoading && !isError && filteredAttendance.length === 0 && (
          <EmptyState
            icon={Calendar}
            illustration="attendance"
            title={t("noRecords")}
            description={t("noRecordsDescription")}
            tip={t("tryChangingFilters")}
          />
        )}
        {!isLoading && !isError && (
          <AnimatePresence mode="wait">
            {viewMode === "calendar" ? (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <CalendarHeatmap records={filteredAttendance} onDayClick={setSelectedDay} />
                {selectedDay && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4"
                  >
                    <Card className="border-0 shadow-lg bg-card">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg font-bold text-foreground">
                            {t("dayRecords", { date: selectedDay.date.toLocaleDateString() })}
                          </CardTitle>
                          <button
                            onClick={() => setSelectedDay(null)}
                            className="p-1.5 rounded-lg hover:bg-muted"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {/* Distribution bar */}
                        {selectedDay.records.length > 0 &&
                          (() => {
                            const total = selectedDay.records.length;
                            const pct = (s: string) =>
                              (selectedDay.records.filter((r) => r.status === s).length / total) *
                              100;
                            const presentN = selectedDay.records.filter(
                              (r) => r.status === "present"
                            ).length;
                            const lateN = selectedDay.records.filter(
                              (r) => r.status === "late"
                            ).length;
                            const absentN = selectedDay.records.filter(
                              (r) => r.status === "absent"
                            ).length;
                            return (
                              <>
                                <div className="flex h-2.5 rounded-full overflow-hidden mb-3 gap-0.5">
                                  <div
                                    className="bg-primary transition-all duration-700"
                                    style={{ width: `${pct("present")}%` }}
                                  />
                                  <div
                                    className="bg-[hsl(48_96%_53%)] transition-all duration-700"
                                    style={{ width: `${pct("late")}%` }}
                                  />
                                  <div
                                    className="bg-destructive transition-all duration-700"
                                    style={{ width: `${pct("absent")}%` }}
                                  />
                                </div>
                                <div className="flex gap-3 mb-4 text-xs">
                                  <span className="flex items-center gap-1 text-primary">
                                    <span className="w-2 h-2 rounded-full bg-primary" />
                                    {presentN} {t("present")}
                                  </span>
                                  <span className="flex items-center gap-1 text-[hsl(48_96%_53%)]">
                                    <span className="w-2 h-2 rounded-full bg-[hsl(48_96%_53%)]" />
                                    {lateN} {t("late")}
                                  </span>
                                  <span className="flex items-center gap-1 text-destructive">
                                    <span className="w-2 h-2 rounded-full bg-destructive" />
                                    {absentN} {t("absent")}
                                  </span>
                                </div>
                              </>
                            );
                          })()}
                        <div className="space-y-2">
                          {selectedDay.records.map((r) => (
                            <div
                              key={r.id}
                              className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-2 h-8 rounded-full ${
                                    r.status === "present"
                                      ? "bg-primary"
                                      : r.status === "late"
                                        ? "bg-[hsl(48_96%_53%)]"
                                        : "bg-destructive"
                                  }`}
                                />
                                <div>
                                  <p className="text-sm font-semibold text-foreground">
                                    {r.employeeName}
                                  </p>
                                  {r.checkInTime && (
                                    <p className="text-xs text-muted-foreground/70">
                                      {t("checkIn")}: {r.checkInTime}
                                      {r.checkOutTime
                                        ? ` • ${t("checkOut")}: ${r.checkOutTime}`
                                        : ""}
                                      {r.earlyCheckout && (
                                        <span className="mr-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                                          {t("earlyCheckout")}
                                        </span>
                                      )}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  r.status === "present"
                                    ? "bg-primary/10 text-primary"
                                    : r.status === "late"
                                      ? "bg-[hsl(48_96%_53%/0.15)] text-[hsl(48_96%_53%)]"
                                      : "bg-destructive/10 text-destructive"
                                }`}
                              >
                                {statusLabels[r.status]}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="table"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {filteredAttendance.length > 0 && (
                  <DataTable<AttendanceRecord>
                    columns={[
                      {
                        key: "employeeName",
                        header: t("employeeTable"),
                        sortable: true,
                        filterable: true,
                        sortValue: (r) => r.employeeName,
                        cell: (r) => (
                          <span className="text-sm font-medium text-foreground">
                            {r.employeeName}
                          </span>
                        ),
                      },
                      {
                        key: "department",
                        header: t("departmentTable"),
                        sortable: true,
                        filterable: true,
                        sortValue: (r) => {
                          const emp = employees.find((e) => String(e.id) === String(r.employeeId));
                          return emp?.department || "-";
                        },
                        cell: (r) => {
                          const emp = employees.find((e) => String(e.id) === String(r.employeeId));
                          return emp?.department || "-";
                        },
                      },
                      {
                        key: "checkInTime",
                        header: t("checkInTime"),
                        sortable: true,
                        sortValue: (r) => r.checkInTime || "",
                        cell: (r) => r.checkInTime || "-",
                      },
                      {
                        key: "checkOutTime",
                        header: t("checkOutTime"),
                        sortable: true,
                        sortValue: (r) => r.checkOutTime || "",
                        cell: (r) =>
                          r.checkOutTime ? (
                            <span className="inline-flex items-center gap-1.5">
                              {r.checkOutTime}
                              {r.earlyCheckout && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                                  {t("earlyCheckoutShort")}
                                </span>
                              )}
                            </span>
                          ) : (
                            "-"
                          ),
                      },
                      {
                        key: "earlyCheckout",
                        header: t("checkoutStatus"),
                        sortable: true,
                        sortValue: (r) => (r.earlyCheckout ? "0" : "1"),
                        cell: (r) =>
                          r.earlyCheckout ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                              {t("earlyCheckout")}
                            </span>
                          ) : r.checkOutTime ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              {t("normalCheckout")}
                            </span>
                          ) : (
                            "-"
                          ),
                      },
                      {
                        key: "lateMinutes",
                        header: t("lateMinutes"),
                        sortable: true,
                        sortValue: (r) => r.lateMinutes,
                        cell: (r) =>
                          r.lateMinutes > 0 ? (
                            <span className="text-[hsl(48_96%_53%)] font-medium">
                              {r.lateMinutes}
                            </span>
                          ) : (
                            "-"
                          ),
                      },
                      {
                        key: "geofenceName",
                        header: t("location"),
                        filterable: true,
                        sortValue: (r) => r.geofenceName || "",
                        cell: (r) => r.geofenceName || "-",
                      },
                      {
                        key: "status",
                        header: t("status"),
                        sortable: true,
                        sortValue: (r) => r.status,
                        cell: (r) => (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              r.status === "present"
                                ? "bg-primary/10 text-primary"
                                : r.status === "late"
                                  ? "bg-[hsl(48_96%_53%/0.15)] text-[hsl(48_96%_53%)]"
                                  : "bg-destructive/10 text-destructive"
                            }`}
                          >
                            {statusLabels[r.status]}
                          </span>
                        ),
                      },
                    ]}
                    data={filteredAttendance}
                    searchPlaceholder={t("searchPlaceholder")}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </MainLayout>
  );
}
