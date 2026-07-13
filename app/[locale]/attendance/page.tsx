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
import { toastSuccess } from "@/hooks/use-toast";
import { hapticTap } from "@/lib/utils/haptics";
import { EmptyState, ErrorState } from "@/components/shared/StateViews";
import AttendanceSkeleton from "@/components/shared/Skeletons/AttendanceSkeleton";
import { DataTable } from "@/components/shared/DataTable/DataTable";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { motion, AnimatePresence } from "framer-motion";
import type { AttendanceRecord } from "@/lib/types/trackingTypes";
import { CountUp } from "@/components/shared/CountUp";

const statusLabels: Record<string, string> = {
  present: "حاضر",
  late: "متأخر",
  absent: "غائب",
  checked_out: "منصرف",
};

const dayHeaders = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

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
  if (!day.isCurrentMonth || day.records.length === 0) return "bg-gray-100 dark:bg-slate-700";
  if (day.attendanceRate >= 90) return "bg-green-500 text-white";
  if (day.attendanceRate >= 60) return "bg-amber-500 text-white";
  return "bg-red-500 text-white";
}

const CalendarHeatmap = memo(function CalendarHeatmap({
  records,
  onDayClick,
}: {
  records: AttendanceRecord[];
  onDayClick: (day: CalendarDay) => void;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleDateString("ar-SA", { month: "long", year: "numeric" });
  const days = useMemo(() => getMonthDays(year, month, records), [year, month, records]);

  return (
    <Card className="border-0 shadow-lg dark:bg-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-gray-900 dark:text-slate-100">
                تقويم الحضور
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-slate-400">عرض حراري لسجلات الحضور</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="الشهر السابق"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-slate-300" />
            </button>
            <span className="text-sm font-medium text-gray-700 dark:text-slate-200 min-w-[120px] text-center">
              {monthName}
            </span>
            <button
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="الشهر التالي"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-slate-300" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayHeaders.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-gray-500 dark:text-slate-400 py-2"
            >
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
                  ? `${day.records.length} سجل — ${Math.round(day.attendanceRate)}% حضور`
                  : ""
              }
            >
              <span>{day.day}</span>
              {day.records.length > 0 && (
                <>
                  <div className="flex gap-0.5 justify-center">
                    {day.records.some((r) => r.status === "present") && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                    )}
                    {day.records.some((r) => r.status === "late") && (
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-200" />
                    )}
                    {day.records.some((r) => r.status === "absent") && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-200" />
                    )}
                  </div>
                  <span className="text-[9px] opacity-75">{Math.round(day.attendanceRate)}%</span>
                </>
              )}
            </button>
          ))}
        </div>
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-green-500" /> حضور ممتاز
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500" /> حضور جزئي
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-500" /> غياب مرتفع
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-gray-300 dark:bg-slate-600" /> لا بيانات
          </span>
        </div>
      </CardContent>
    </Card>
  );
});

export default function AttendancePage() {
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
      if (filters.employeeId && r.employeeId !== Number(filters.employeeId)) return false;
      if (filters.department) {
        const emp = employees.find((e) => e.id === r.employeeId);
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
          head="سجلات الحضور والانصراف"
          description="سجلات حضور الموظفين لهذا اليوم"
          Icon={<Calendar className="w-7 h-7" />}
          LeftSection={
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                    viewMode === "table"
                      ? "bg-white dark:bg-slate-800 shadow-sm font-medium"
                      : "text-gray-500 dark:text-slate-400"
                  }`}
                >
                  جدول
                </button>
                <button
                  onClick={() => setViewMode("calendar")}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                    viewMode === "calendar"
                      ? "bg-white dark:bg-slate-800 shadow-sm font-medium"
                      : "text-gray-500 dark:text-slate-400"
                  }`}
                >
                  تقويم
                </button>
              </div>

              {/* Filter Button */}
              <Popover open={showFilters} onOpenChange={setShowFilters}>
                <PopoverTrigger asChild>
                  <button
                    className="relative flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    aria-label="تصفية"
                  >
                    <Filter className="w-4 h-4" />
                    تصفية
                    {activeFilterCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-72 p-4 dark:bg-slate-800 dark:border-slate-700"
                  align="start"
                >
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5 block">
                        الموظف
                      </label>
                      <select
                        value={filters.employeeId}
                        onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-transparent dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm"
                      >
                        <option value="">الكل</option>
                        {employees.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5 block">
                        القسم
                      </label>
                      <select
                        value={filters.department}
                        onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-transparent dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm"
                      >
                        <option value="">الكل</option>
                        {departments.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5 block">
                        الحالة
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
                                ? "bg-blue-500 text-white"
                                : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300"
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
                        className="w-full py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        مسح الفلاتر
                      </button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => {
                  exportAttendanceToCSV(filteredAttendance);
                  toastSuccess("تم تصدير CSV بنجاح");
                }}
              >
                <FileSpreadsheet className="w-4 h-4" />
                CSV
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={async () => {
                  await exportAttendanceToPDF(filteredAttendance);
                  toastSuccess("تم تصدير PDF بنجاح");
                }}
              >
                <FileText className="w-4 h-4" />
                PDF
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
              <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-gray-100/50 dark:from-slate-800 dark:to-slate-900 border border-gray-200/60 dark:border-slate-700 p-5 shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                      معدل الحضور الإجمالي
                    </p>
                    <p className="text-3xl font-black text-gray-900 dark:text-slate-100 mt-0.5">
                      {attendanceRate}
                      <span className="text-lg font-semibold text-gray-500">%</span>
                    </p>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">
                        {presentCount}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">حاضر</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                        {lateCount}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">متأخر</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-red-600 dark:text-red-400">
                        {absentCount}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">غائب</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{total}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">الإجمالي</p>
                    </div>
                  </div>
                </div>
                {/* Stacked progress bar */}
                <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
                  <div
                    className="bg-green-500 transition-all duration-700 rounded-r-full"
                    style={{ width: `${(presentCount / total) * 100}%` }}
                  />
                  <div
                    className="bg-amber-400 transition-all duration-700"
                    style={{ width: `${(lateCount / total) * 100}%` }}
                  />
                  <div
                    className="bg-red-500 transition-all duration-700 rounded-l-full"
                    style={{ width: `${(absentCount / total) * 100}%` }}
                  />
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 dark:text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    حاضر
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    متأخر
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    غائب
                  </span>
                </div>
              </div>
            );
          })()}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              {
                label: "حاضر",
                count: attendance.filter((r) => r.status === "present").length,
                Icon: UserCheck,
                color: "text-green-600 dark:text-green-400",
                bg: "bg-green-100 dark:bg-green-900/30",
                border: "border-b-4 border-green-500",
                stagger: "animate-stagger-1",
              },
              {
                label: "متأخر",
                count: attendance.filter((r) => r.status === "late").length,
                Icon: Clock,
                color: "text-amber-600 dark:text-amber-400",
                bg: "bg-amber-100 dark:bg-amber-900/30",
                border: "border-b-4 border-amber-500",
                stagger: "animate-stagger-2",
              },
              {
                label: "غائب",
                count: attendance.filter((r) => r.status === "absent").length,
                Icon: UserX,
                color: "text-red-600 dark:text-red-400",
                bg: "bg-red-100 dark:bg-red-900/30",
                border: "border-b-4 border-red-500",
                stagger: "animate-stagger-3",
              },
              {
                label: "الإجمالي",
                count: attendance.length,
                Icon: Users,
                color: "text-blue-600 dark:text-blue-400",
                bg: "bg-blue-100 dark:bg-blue-900/30",
                border: "border-b-4 border-blue-500",
                stagger: "animate-stagger-4",
              },
            ] as const
          ).map(({ label, count, Icon, color, bg, border, stagger }) => (
            <Card
              key={label}
              className={`border-0 shadow-md dark:bg-slate-800 ${stagger} ${border}`}
            >
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
                    <p className="text-sm text-gray-600 dark:text-slate-400">{label}</p>
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
            title="لا توجد سجلات حضور"
            description="لم يتم العثور على أي سجلات حضور مطابقة للفلاتر الحالية"
            tip="جرب تغيير الفلاتر أو تحقق من تاريخ الحضور"
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
                    <Card className="border-0 shadow-lg dark:bg-slate-800">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg font-bold text-gray-900 dark:text-slate-100">
                            سجلات يوم {selectedDay.date.toLocaleDateString("ar-SA")}
                          </CardTitle>
                          <button
                            onClick={() => setSelectedDay(null)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
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
                                    className="bg-green-500 transition-all duration-700"
                                    style={{ width: `${pct("present")}%` }}
                                  />
                                  <div
                                    className="bg-amber-400 transition-all duration-700"
                                    style={{ width: `${pct("late")}%` }}
                                  />
                                  <div
                                    className="bg-red-500 transition-all duration-700"
                                    style={{ width: `${pct("absent")}%` }}
                                  />
                                </div>
                                <div className="flex gap-3 mb-4 text-xs">
                                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                    <span className="w-2 h-2 rounded-full bg-green-500" />
                                    {presentN} حاضر
                                  </span>
                                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                                    {lateN} متأخر
                                  </span>
                                  <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                                    <span className="w-2 h-2 rounded-full bg-red-500" />
                                    {absentN} غائب
                                  </span>
                                </div>
                              </>
                            );
                          })()}
                        <div className="space-y-2">
                          {selectedDay.records.map((r) => (
                            <div
                              key={r.id}
                              className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-700/50"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-2 h-8 rounded-full ${
                                    r.status === "present"
                                      ? "bg-green-500"
                                      : r.status === "late"
                                        ? "bg-amber-400"
                                        : "bg-red-500"
                                  }`}
                                />
                                <div>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                                    {r.employeeName}
                                  </p>
                                  {r.checkInTime && (
                                    <p className="text-xs text-gray-400 dark:text-slate-500">
                                      حضور: {r.checkInTime}
                                      {r.checkOutTime ? ` • انصراف: ${r.checkOutTime}` : ""}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  r.status === "present"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                    : r.status === "late"
                                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                                      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
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
                        header: "الموظف",
                        sortable: true,
                        filterable: true,
                        sortValue: (r) => r.employeeName,
                        cell: (r) => (
                          <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
                            {r.employeeName}
                          </span>
                        ),
                      },
                      {
                        key: "department",
                        header: "القسم",
                        sortable: true,
                        filterable: true,
                        sortValue: (r) => {
                          const emp = employees.find((e) => e.id === r.employeeId);
                          return emp?.department || "-";
                        },
                        cell: (r) => {
                          const emp = employees.find((e) => e.id === r.employeeId);
                          return emp?.department || "-";
                        },
                      },
                      {
                        key: "checkInTime",
                        header: "وقت الحضور",
                        sortable: true,
                        sortValue: (r) => r.checkInTime || "",
                        cell: (r) => r.checkInTime || "-",
                      },
                      {
                        key: "checkOutTime",
                        header: "وقت الانصراف",
                        sortable: true,
                        sortValue: (r) => r.checkOutTime || "",
                        cell: (r) => r.checkOutTime || "-",
                      },
                      {
                        key: "lateMinutes",
                        header: "التأخير (دقيقة)",
                        sortable: true,
                        sortValue: (r) => r.lateMinutes,
                        cell: (r) =>
                          r.lateMinutes > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                              {r.lateMinutes}
                            </span>
                          ) : (
                            "-"
                          ),
                      },
                      {
                        key: "geofenceName",
                        header: "الموقع",
                        filterable: true,
                        sortValue: (r) => r.geofenceName || "",
                        cell: (r) => r.geofenceName || "-",
                      },
                      {
                        key: "status",
                        header: "الحالة",
                        sortable: true,
                        sortValue: (r) => r.status,
                        cell: (r) => (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              r.status === "present"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : r.status === "late"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            }`}
                          >
                            {statusLabels[r.status]}
                          </span>
                        ),
                      },
                    ]}
                    data={filteredAttendance}
                    searchPlaceholder="بحث بالاسم أو القسم أو الموقع..."
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
