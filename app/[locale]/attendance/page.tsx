"use client";

import { useState, useMemo, useCallback } from "react";
import MainLayout from "@/components/shared/MainLayout";
import FullPageHead from "@/components/shared/FullPageHead";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  FileSpreadsheet,
  Filter,
  UserCheck,
  Clock,
  UserX,
  Users,
  Check,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAttendance, useEmployees, useGeofences } from "@/hooks/useApi";
import { resolveAttendanceLocation } from "@/lib/utils/geo";
import { exportToCSV } from "@/lib/utils/exportUtils";
import { toastSuccess, toastError } from "@/hooks/use-toast";
import { hapticTap } from "@/lib/utils/haptics";
import { EmptyState, ErrorState } from "@/components/shared/StateViews";
import AttendanceSkeleton from "@/components/shared/Skeletons/AttendanceSkeleton";
import { DataTable } from "@/components/shared/DataTable/DataTable";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { AttendanceRecord } from "@/lib/types/trackingTypes";
import { CountUp } from "@/components/shared/CountUp";
import { useLocale, useTranslations } from "next-intl";

function useAttendanceStatusLabels() {
  const t = useTranslations("Attendance");
  return useMemo(
    () => ({
      present: t("present"),
      late: t("late"),
      absent: t("absent"),
      checked_out: t("statusCheckedOut"),
    }),
    [t]
  );
}

type DateRange = "all" | "today" | "yesterday" | "week" | "month" | "thisMonth" | "lastMonth";

function getDateRange(range: DateRange, today: string) {
  if (range === "all") return null;
  if (range === "today") return { start: today, end: today };

  const now = new Date(`${today}T12:00:00+03:00`);
  const formatRiyadh = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" });

  if (range === "yesterday") {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    const yesterday = formatRiyadh(d);
    return { start: yesterday, end: yesterday };
  }

  if (range === "week") {
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    return { start: formatRiyadh(start), end: today };
  }

  if (range === "month") {
    const start = new Date(now);
    start.setDate(start.getDate() - 29);
    return { start: formatRiyadh(start), end: today };
  }

  if (range === "thisMonth") {
    const dtf = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Riyadh",
      year: "numeric",
      month: "2-digit",
    });
    const parts = dtf.formatToParts(now);
    const year = parts.find((p) => p.type === "year")?.value;
    const month = parts.find((p) => p.type === "month")?.value;
    return { start: `${year}-${month}-01`, end: today };
  }

  if (range === "lastMonth") {
    const dtf = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Riyadh",
      year: "numeric",
      month: "2-digit",
    });
    const parts = dtf.formatToParts(now);
    let year = Number(parts.find((p) => p.type === "year")?.value);
    let month = Number(parts.find((p) => p.type === "month")?.value);
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const end = new Date(Date.UTC(year, month, 0)).toLocaleDateString("en-CA", {
      timeZone: "Asia/Riyadh",
    });
    return { start, end };
  }

  return null;
}

export default function AttendancePage() {
  const t = useTranslations("Attendance");
  const locale = useLocale();
  const statusLabels = useAttendanceStatusLabels();
  const { data: employees = [] } = useEmployees();
  const { data: geofences = [] } = useGeofences();

  const resolveLocationName = useCallback(
    (record: AttendanceRecord) => resolveAttendanceLocation(record, geofences, employees),
    [geofences, employees]
  );

  const formatDate = useCallback(
    (dateStr: string | null | undefined) => {
      if (!dateStr) return "-";
      const d = new Date(dateStr + "T00:00:00");
      if (Number.isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    },
    [locale]
  );

  const today = useMemo(
    () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" }),
    []
  );

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    employeeId: "",
    statuses: [] as string[],
    dateRange: "month" as DateRange,
  });

  const attendanceDateRange = useMemo(() => {
    const range = getDateRange(filters.dateRange, today);
    return range ? { from: range.start, to: range.end } : undefined;
  }, [filters.dateRange, today]);

  const {
    data: attendance = [],
    isLoading,
    isError,
    refetch,
  } = useAttendance({
    dateRange: attendanceDateRange,
  });

  const filteredAttendance = useMemo(() => {
    return attendance
      .filter((r) => {
        if (filters.employeeId && String(r.employeeId) !== String(filters.employeeId)) return false;
        if (filters.statuses.length > 0 && !filters.statuses.includes(r.status)) return false;
        return true;
      })
      .map((r) => ({ ...r, geofenceName: resolveLocationName(r) || "-" }))
      .sort(
        (a, b) =>
          b.date.localeCompare(a.date) || (b.checkInTime ?? "").localeCompare(a.checkInTime ?? "")
      );
  }, [attendance, filters, resolveLocationName]);

  const stats = useMemo(() => {
    let present = 0,
      late = 0,
      absent = 0,
      checkedOut = 0;
    for (const r of filteredAttendance) {
      if (r.status === "absent" && !r.checkInTime) {
        absent++;
        continue;
      }
      if (!r.checkInTime) continue;
      if ((r.lateMinutes ?? 0) > 0 || r.status === "late") late++;
      else present++;
      if (r.status === "checked_out" || r.checkOutTime) checkedOut++;
    }
    return { present, late, absent, checkedOut, total: filteredAttendance.length };
  }, [filteredAttendance]);

  const activeFilterCount =
    (filters.employeeId ? 1 : 0) +
    filters.statuses.length +
    (filters.dateRange !== "month" ? 1 : 0);

  const clearFilters = () => {
    hapticTap();
    setFilters({ employeeId: "", statuses: [], dateRange: "month" });
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6 min-h-screen">
        <FullPageHead
          head={t("title")}
          description={t("description")}
          Icon={<Calendar className="w-7 h-7" />}
          LeftSection={
            <div className="flex flex-wrap items-center gap-2">
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
                        {t("dateRange")}
                      </label>
                      <select
                        value={filters.dateRange}
                        onChange={(e) =>
                          setFilters({ ...filters, dateRange: e.target.value as DateRange })
                        }
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                      >
                        <option value="all">{t("dateRangeAll")}</option>
                        <option value="today">{t("dateRangeToday")}</option>
                        <option value="yesterday">{t("dateRangeYesterday")}</option>
                        <option value="week">{t("dateRangeWeek")}</option>
                        <option value="month">{t("dateRangeMonth")}</option>
                        <option value="thisMonth">{t("dateRangeThisMonth")}</option>
                        <option value="lastMonth">{t("dateRangeLastMonth")}</option>
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
                    const rows = filteredAttendance.map((record) => ({
                      employeeName: record.employeeName || "-",
                      date: "'" + record.date,
                      checkInTime: record.checkInTime ?? "-",
                      checkOutTime: record.checkOutTime ?? "-",
                      status:
                        statusLabels[record.status as keyof typeof statusLabels] || record.status,
                      lateMinutes: record.lateMinutes ?? 0,
                      workedHours:
                        typeof record.workedHours === "number"
                          ? record.workedHours.toFixed(2)
                          : "-",
                      geofenceName: record.geofenceName || "-",
                    }));
                    exportToCSV(rows, "attendance_report", [
                      { key: "employeeName", label: "Employee" },
                      { key: "date", label: "Date" },
                      { key: "checkInTime", label: "Check In" },
                      { key: "checkOutTime", label: "Check Out" },
                      { key: "status", label: "Status" },
                      { key: "lateMinutes", label: "Late (min)" },
                      { key: "workedHours", label: "Worked (h)" },
                      { key: "geofenceName", label: "Geofence" },
                    ]);
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
            </div>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              {
                label: t("present"),
                count: stats.present,
                Icon: UserCheck,
                color: "text-primary",
                bg: "bg-primary/10",
                border: "border-b-4 border-primary",
                stagger: "animate-stagger-1",
              },
              {
                label: t("late"),
                count: stats.late,
                Icon: Clock,
                color: "text-[hsl(48_96%_53%)]",
                bg: "bg-[hsl(48_96%_53%/0.15)] dark:bg-[hsl(48_96%_53%/0.15)]",
                border: "border-b-4 border-amber-500",
                stagger: "animate-stagger-2",
              },
              {
                label: t("absent"),
                count: stats.absent,
                Icon: UserX,
                color: "text-destructive",
                bg: "bg-destructive/10",
                border: "border-b-4 border-red-500",
                stagger: "animate-stagger-3",
              },
              {
                label: t("total"),
                count: stats.total,
                Icon: Users,
                color: "text-slate-400",
                bg: "bg-slate-400/10",
                border: "border-b-4 border-slate-400",
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
        {!isLoading && !isError && filteredAttendance.length > 0 && (
          <DataTable<AttendanceRecord>
            columns={[
              {
                key: "employeeName",
                header: t("employeeTable"),
                sortable: true,
                filterable: true,
                sortValue: (r) => r.employeeName,
                cell: (r) => (
                  <span className="text-sm font-medium text-foreground">{r.employeeName}</span>
                ),
              },
              {
                key: "date",
                header: t("date"),
                sortable: true,
                filterable: true,
                sortValue: (r) => r.date || "",
                cell: (r) => (
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                    <Calendar className="w-3 h-3 text-muted-foreground/70" />
                    {formatDate(r.date)}
                  </span>
                ),
              },
              {
                key: "checkInTime",
                header: t("checkInTime"),
                sortable: true,
                sortValue: (r) => r.checkInTime || "",
                cell: (r) => (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3 text-muted-foreground/70" />
                    {r.checkInTime || "-"}
                  </span>
                ),
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
                key: "workedHours",
                header: t("workedHours"),
                sortable: true,
                sortValue: (r) => r.workedHours ?? -1,
                cell: (r) => {
                  const hours = r.workedHours;
                  if (hours === null || hours === undefined) return "-";
                  const totalMinutes = Math.round(hours * 60);
                  const h = Math.floor(totalMinutes / 60);
                  const m = totalMinutes % 60;
                  return h > 0 ? (
                    <span className="text-sm font-medium text-foreground">
                      {h}h {m}m
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-foreground">{m}m</span>
                  );
                },
              },
              {
                key: "lateMinutes",
                header: t("lateMinutes"),
                sortable: true,
                sortValue: (r) => r.lateMinutes,
                cell: (r) => {
                  const minutes = r.lateMinutes ?? 0;
                  if (minutes <= 0) return "-";
                  const hours = Math.floor(minutes / 60);
                  const mins = minutes % 60;
                  return hours > 0 ? (
                    <span className="text-[hsl(48_96%_53%)] font-medium">
                      {hours}h {mins}m
                    </span>
                  ) : (
                    <span className="text-[hsl(48_96%_53%)] font-medium">{mins}m</span>
                  );
                },
              },
              {
                key: "geofenceName",
                header: t("location"),
                sortable: true,
                filterable: true,
                sortValue: (r) => r.geofenceName || "",
                cell: (r) => (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-muted-foreground/70" />
                    {r.geofenceName || "-"}
                  </span>
                ),
              },
              {
                key: "status",
                header: t("status"),
                sortable: true,
                sortValue: (r) => r.status,
                cell: (r) => {
                  const isLate = r.status !== "absent" && (r.lateMinutes ?? 0) > 0;
                  const isPresent = r.status !== "absent" && !isLate;
                  const label = isLate
                    ? statusLabels.late
                    : statusLabels[r.status as keyof typeof statusLabels] || r.status;
                  return (
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isPresent
                          ? "bg-primary/10 text-primary"
                          : isLate
                            ? "bg-[hsl(48_96%_53%/0.15)] text-[hsl(48_96%_53%)]"
                            : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {label}
                    </span>
                  );
                },
              },
            ]}
            data={filteredAttendance}
            searchPlaceholder={t("searchPlaceholder")}
            pageSize={10}
          />
        )}
      </div>
    </MainLayout>
  );
}
