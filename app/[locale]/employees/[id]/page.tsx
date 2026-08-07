"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import MainLayout from "@/components/shared/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Mail,
  MapPin,
  Phone,
  Edit,
  Trash2,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useRouter, Link } from "@/i18n/navigation";
import {
  useEmployee,
  useAttendance,
  useGeofences,
  useDeleteEmployee,
  useUpdateEmployee,
} from "@/hooks/useApi";
import { FormDrawer } from "@/components/shared/FormDrawer";
import { FormField, FormSelect } from "@/components/shared/form/FormField";
import { LoadingSkeleton, ErrorState, EmptyState } from "@/components/shared/StateViews";
import { DataTable } from "@/components/shared/DataTable/DataTable";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { toastSuccess, toastError, toastWithUndo } from "@/hooks/use-toast";
import type { AttendanceRecord } from "@/lib/types/trackingTypes";
import { useTranslations } from "next-intl";
import { useCompanySettingsStore } from "@/stores/useCompanySettingsStore";
import { computeAttendanceCoverage } from "@/lib/utils/attendanceAbsent";
import { DEFAULT_COMPANY_TIMEZONE } from "@/lib/utils/companyDate";
import { defaultAttendanceWindow, last7CompanyDays } from "@/lib/utils/attendanceWindow";
import { displayOutcome, isLateArrival } from "@/lib/utils/attendancePipeline";

const statusLabels = {
  present: "statusPresent",
  late: "statusLate",
  absent: "statusAbsent",
  checked_out: "statusCheckedOut",
} as const;

export default function EmployeeProfilePage({ params }: { params: { id: string } }) {
  const t = useTranslations("Employees");
  const { id } = params;
  const router = useRouter();
  const { data: employee, isLoading: empLoading, isError: empError } = useEmployee(id);
  const workStartTime = useCompanySettingsStore((s) => s.workStartTime);
  const gracePeriodMinutes = useCompanySettingsStore((s) => s.gracePeriodMinutes);
  const timezone = useCompanySettingsStore((s) => s.timezone) || DEFAULT_COMPANY_TIMEZONE;
  const weekendDays = useCompanySettingsStore((s) => s.weekendDays);
  const companySettings = useMemo(
    () => ({ workStartTime, gracePeriodMinutes, timezone, weekendDays }),
    [workStartTime, gracePeriodMinutes, timezone, weekendDays]
  );
  // History: last 30 company days. KPIs: last 7 (subset of same fetch).
  const last30Range = useMemo(() => defaultAttendanceWindow(timezone), [timezone]);
  const last7Range = useMemo(() => last7CompanyDays(timezone), [timezone]);
  const { data: attendanceData = [] } = useAttendance({ dateRange: last30Range });
  const { data: geofences = [] } = useGeofences();
  const deleteEmployee = useDeleteEmployee();
  const updateEmployee = useUpdateEmployee();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editEmployee, setEditEmployee] = useState<{
    name: string;
    email: string;
    phone: string;
    department: string;
    geofenceId: string;
  }>({
    name: "",
    email: "",
    phone: "",
    department: "",
    geofenceId: "",
  });

  // Real punches only — no synthetic “absent every empty day” rows.
  const empAttendance = useMemo(
    () =>
      attendanceData
        .filter((a) => String(a.employeeId) === String(id))
        .sort((a, b) => (b.date || "").localeCompare(a.date || "")),
    [attendanceData, id]
  );

  const roster = useMemo(
    () =>
      employee
        ? [{ id: employee.id, name: employee.name, status: employee.status }]
        : [{ id, name: "", status: "active" as const }],
    [employee, id]
  );

  const { presentCount, lateCount, absentCount } = useMemo(() => {
    const cov = computeAttendanceCoverage({
      employees: roster,
      attendance: empAttendance,
      fromYmd: last7Range.from,
      toYmd: last7Range.to,
      settings: companySettings,
      employeeId: id,
    });
    return {
      presentCount: cov.present,
      lateCount: cov.late,
      absentCount: cov.absent,
    };
  }, [roster, empAttendance, last7Range, companySettings, id]);

  const geofenceOptions = useMemo(
    () =>
      geofences.map((g) => (
        <option key={String(g.id)} value={String(g.id)}>
          {g.name}
        </option>
      )),
    [geofences]
  );

  if (empLoading) {
    return (
      <MainLayout>
        <div className="p-3 sm:p-4 md:p-6">
          <LoadingSkeleton variant="list" />
        </div>
      </MainLayout>
    );
  }

  if (empError || !employee) {
    return (
      <MainLayout>
        <div className="p-3 sm:p-4 md:p-6">
          <ErrorState onRetry={() => router.push(`/employees`)} />
        </div>
      </MainLayout>
    );
  }

  const geofenceName =
    geofences.find((g) => String(g.id) === String(employee.geofenceId))?.name || "-";

  const handleOpenEdit = () => {
    if (!employee) return;
    setEditEmployee({
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      department: employee.department,
      geofenceId: employee.geofenceId ?? "",
    });
    setShowEditForm(true);
  };

  const handleUpdate = () => {
    if (!employee) return;
    updateEmployee.mutate(
      { id: employee.id, data: editEmployee },
      {
        onSuccess: () => {
          toastSuccess(t("updated"));
          setShowEditForm(false);
        },
        onError: () => toastError(t("updateError")),
      }
    );
  };

  const handleDelete = () => {
    const deletedEmployee = employee;
    deleteEmployee.mutate(employee.id, {
      onSuccess: () => {
        toastWithUndo(t("deleted", { name: deletedEmployee.name }), () => {
          router.push(`/employees`);
        });
      },
      onError: () => {
        toastError(t("deleteFailed"));
      },
    });
  };

  return (
    <MainLayout>
      <div className="min-h-screen space-y-4 p-3 sm:space-y-6 sm:p-4 md:p-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={`/employees`}
            className="flex items-center gap-1 text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("employees")}
          </Link>
          <span className="text-muted-foreground/70">/</span>
          <span className="text-muted-foreground font-medium">{employee.name}</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Profile Header Card */}
          <Card className="border-0 shadow-xl bg-card overflow-hidden">
            <div className="h-24 bg-gradient-to-br from-primary via-primary/90 to-primary/70" />
            <CardContent className="pb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 -mt-12">
                <div className="flex-1 mt-4 sm:mt-0">
                  <h1 className="text-2xl font-bold text-foreground">{employee.name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        employee.status === "active"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {employee.status === "active" ? t("active") : t("inactive")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1.5"
                    onClick={handleOpenEdit}
                  >
                    <Edit className="w-4 h-4" />
                    {t("edit")}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex items-center gap-1.5"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="w-4 h-4" />
                    {t("delete")}
                  </Button>
                </div>
              </div>

              {/* Contact Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <div className="flex min-w-0 items-center gap-3 rounded-xl bg-muted/50 p-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("email")}</p>
                    <p className="text-sm font-medium text-foreground">
                      <span dir="ltr" lang="en" style={{ unicodeBidi: "plaintext" }}>
                        {employee.email}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex min-w-0 items-center gap-3 rounded-xl bg-muted/50 p-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("geofence")}</p>
                    <p className="text-sm font-medium text-foreground">{geofenceName}</p>
                  </div>
                </div>
                <div className="flex min-w-0 items-center gap-3 rounded-xl bg-muted/50 p-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("phone")}</p>
                    <p className="text-sm font-medium text-foreground" dir="ltr">
                      {employee.phone || "-"}
                    </p>
                  </div>
                </div>
                {/* Passwords are never stored on employee docs — reset only from employees list. */}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 7-Day Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <Card className="border-0 shadow-lg bg-card">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{presentCount}</p>
                <p className="text-xs text-muted-foreground">{t("presentDays")}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-card">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="w-12 h-12 rounded-xl bg-[hsl(48_96%_53%/0.15)] dark:bg-[hsl(48_96%_53%/0.15)] flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-[hsl(48_96%_53%)]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{lateCount}</p>
                <p className="text-xs text-muted-foreground">{t("lateDays")}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-card">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{absentCount}</p>
                <p className="text-xs text-muted-foreground">{t("absentDays")}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Attendance History Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <Card className="border-0 shadow-lg bg-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/50 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-foreground">
                    {t("attendanceHistory")}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{t("attendanceHistorySubtitle")}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {empAttendance.length === 0 ? (
                <EmptyState
                  illustration="attendance"
                  title={t("noAttendanceRecords")}
                  description={t("noAttendanceDescription")}
                />
              ) : (
                <DataTable<AttendanceRecord>
                  columns={[
                    {
                      key: "date",
                      header: t("date"),
                      sortable: true,
                      sortValue: (r) => r.date,
                      cell: (r) => r.date,
                    },
                    {
                      key: "checkInTime",
                      header: t("checkInTime"),
                      sortable: true,
                      sortValue: (r) => r.checkInTime || "",
                      cell: (r) => (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-muted-foreground/70" />
                          {r.checkInTime || "-"}
                        </span>
                      ),
                    },
                    {
                      key: "checkOutTime",
                      header: t("checkOutTime"),
                      cell: (r) => r.checkOutTime || "-",
                    },
                    {
                      key: "status",
                      header: t("status"),
                      sortable: true,
                      sortValue: (r) => displayOutcome(r),
                      cell: (r) => {
                        const outcome = displayOutcome(r);
                        const late = isLateArrival(r);
                        const labelKey = statusLabels[outcome];
                        const label = labelKey
                          ? outcome === "checked_out" && late
                            ? `${t(statusLabels.checked_out)} · ${t(statusLabels.late)}`
                            : t(labelKey)
                          : r.status;
                        return (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              outcome === "present"
                                ? "bg-primary/10 text-primary"
                                : outcome === "late"
                                  ? "bg-[hsl(48_96%_53%/0.15)] text-[hsl(48_96%_53%)]"
                                  : outcome === "checked_out"
                                    ? "bg-slate-500/15 text-slate-700 dark:text-slate-200"
                                    : "bg-destructive/10 text-destructive"
                            }`}
                          >
                            {label}
                          </span>
                        );
                      },
                    },
                    {
                      key: "workedHours",
                      header: t("workedHours"),
                      cell: (r) =>
                        !r.checkInTime ? "—" : `${r.workedHours?.toFixed(1) || "0"} ${t("hours")}`,
                    },
                    {
                      key: "geofenceName",
                      header: t("location"),
                      cell: (r) => {
                        if (!r.checkInTime) return "—";
                        const name =
                          (r.geofenceName && !/^\d+$/.test(String(r.geofenceName).trim())
                            ? r.geofenceName
                            : null) ||
                          geofences.find((g) => String(g.id) === String(r.geofenceId))?.name ||
                          (employee?.geofenceId
                            ? geofences.find((g) => String(g.id) === String(employee.geofenceId))
                                ?.name
                            : null);
                        return name || "-";
                      },
                    },
                  ]}
                  data={empAttendance}
                  searchPlaceholder={t("searchRecords")}
                  pageSize={10}
                />
              )}
            </CardContent>
          </Card>
        </motion.div>

        <ConfirmDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title={t("confirmDelete")}
          description={t("deleteConfirmDescription", { name: employee.name })}
          confirmLabel={t("deleteConfirmLabel")}
          cancelLabel={t("cancel")}
          onConfirm={handleDelete}
        />

        <FormDrawer
          open={showEditForm}
          onOpenChange={setShowEditForm}
          title={t("editEmployee", { name: employee.name })}
          description={t("updateEmployeeDescription")}
          onSubmit={handleUpdate}
          isSubmitting={updateEmployee.isPending}
          submitLabel={t("saveChanges")}
        >
          <div className="grid grid-cols-1 gap-4">
            <FormField
              label={t("name")}
              value={editEmployee.name}
              onChange={(v) => setEditEmployee({ ...editEmployee, name: v })}
              placeholder={t("employeeNamePlaceholder")}
            />
            <FormField
              label={t("email")}
              type="email"
              value={editEmployee.email}
              onChange={(v) => setEditEmployee({ ...editEmployee, email: v })}
              placeholder="email@trax.com"
              ltr
            />
            <FormField
              label={t("phone")}
              value={editEmployee.phone}
              onChange={(v) => setEditEmployee({ ...editEmployee, phone: v })}
              placeholder="0500000000"
              ltr
            />
            <FormField
              label={t("department")}
              value={editEmployee.department}
              onChange={(v) => setEditEmployee({ ...editEmployee, department: v })}
              placeholder={t("department")}
            />
            <FormSelect
              label={t("geofence")}
              value={editEmployee.geofenceId}
              onChange={(v) => setEditEmployee({ ...editEmployee, geofenceId: v })}
            >
              {geofenceOptions}
            </FormSelect>
          </div>
        </FormDrawer>
      </div>
    </MainLayout>
  );
}
