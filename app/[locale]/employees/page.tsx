"use client";

import { useState, useEffect, useMemo } from "react";
import MainLayout from "@/components/shared/MainLayout";
import FullPageHead from "@/components/shared/FullPageHead";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Mail,
  MapPin,
  Download,
  Eye,
  X,
  Check,
  LayoutGrid,
  LayoutList,
  Search,
  Upload,
} from "lucide-react";
import {
  useEmployees,
  useGeofences,
  useCreateEmployee,
  useDeleteEmployee,
  useUpdateEmployee,
  useResetEmployeePassword,
} from "@/hooks/useApi";
import { EmptyState, ErrorState } from "@/components/shared/StateViews";
import EmployeeListSkeleton from "@/components/shared/Skeletons/EmployeeListSkeleton";
import { DataTable } from "@/components/shared/DataTable/DataTable";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { FormDrawer } from "@/components/shared/FormDrawer";
import { FormField, FormSelect } from "@/components/shared/form/FormField";
import { toastSuccess, toastError, toastWithUndo } from "@/hooks/use-toast";
import { hapticTap, hapticSuccess } from "@/lib/utils/haptics";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import type { Employee } from "@/lib/types/trackingTypes";
import { useAuthStore } from "@/stores/useAuthStore";
import AccessDeniedCard from "@/components/shared/AccessDeniedCard";
import { BulkImportDrawer } from "@/components/employees/BulkImportDrawer";
import { buildStaffCredentialsMessage, generateStaffUsername } from "@/lib/utils/staffOnboarding";

const DEFAULT_PUBLIC_APP_URL = "https://naf--trax-ae.asia-southeast1.hosted.app";

function getEmployeeCreationErrorMessage(
  error: unknown,
  t: ReturnType<typeof useTranslations>
): string {
  const code =
    typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";

  if (code === "auth/email-already-in-use") return t("emailInUse");
  if (code === "auth/weak-password") return t("weakPassword");
  if (code === "permission-denied") return t("noPermission");
  if (error instanceof Error && error.message === "NO_COMPANY") return t("noCompany");

  return t("addEmployeeFailed");
}

export default function EmployeesPage() {
  const t = useTranslations("Employees");
  const { data: employees = [], isLoading, isError, error, refetch } = useEmployees();
  const { data: geofences = [] } = useGeofences();
  const createEmployee = useCreateEmployee();
  const deleteEmployee = useDeleteEmployee();
  const updateEmployee = useUpdateEmployee();
  const resetEmployeePassword = useResetEmployeePassword();
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const locale = useLocale();
  const { role } = useAuthStore();
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("trax_employees_view") as "table" | "grid" | null;
    if (stored) setViewMode(stored);
  }, []);

  const handleViewMode = (mode: "table" | "grid") => {
    setViewMode(mode);
    localStorage.setItem("trax_employees_view", mode);
  };
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [selectedIds, setSelectedIds] = useState<Array<number | string>>([]);
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    username: string;
    password: string;
  } | null>(null);
  const [newEmployee, setNewEmployee] = useState<{
    name: string;
    email: string;
    employeeNumber: string;
    phone: string;
    department: string;
    geofenceId: string;
    attendanceMode: Employee["attendanceMode"];
    password: string;
  }>({
    name: "",
    email: "",
    employeeNumber: "",
    phone: "",
    department: "",
    geofenceId: "",
    attendanceMode: null,
    password: "",
  });
  const [editEmployee, setEditEmployee] = useState<{
    name: string;
    email: string;
    employeeNumber: string;
    phone: string;
    department: string;
    geofenceId: string;
    attendanceMode: Employee["attendanceMode"];
    status: "active" | "inactive";
    password: string;
  }>({
    name: "",
    email: "",
    employeeNumber: "",
    phone: "",
    department: "",
    geofenceId: "",
    attendanceMode: null,
    status: "active",
    password: "",
  });

  const resetNewEmployee = () => {
    setNewEmployee({
      name: "",
      email: "",
      employeeNumber: "",
      phone: "",
      department: "",
      geofenceId: "",
      attendanceMode: null,
      password: "",
    });
    setShowAddForm(false);
  };

  const handleAdd = () => {
    if (!newEmployee.name || !newEmployee.email || !newEmployee.password) {
      toastError(t("fillRequired"));
      return;
    }
    if (newEmployee.password.length < 8) {
      toastError(t("passwordMin"));
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmployee.email)) {
      toastError(t("invalidEmail"));
      return;
    }
    const email = newEmployee.email;
    const username = generateStaffUsername({
      employeeNumber: newEmployee.employeeNumber,
      email: newEmployee.email,
      name: newEmployee.name,
    });
    const password = newEmployee.password;
    createEmployee.mutate(
      {
        ...newEmployee,
        employeeNumber: username,
        status: "active",
        currentLat: null,
        currentLng: null,
        lastSeen: null,
      },
      {
        onSuccess: () => {
          resetNewEmployee();
          setCreatedCredentials({ email, username, password });
        },
        onError: (error) => {
          toastError(getEmployeeCreationErrorMessage(error, t));
        },
      }
    );
  };

  const handleEdit = (emp: Employee) => {
    hapticTap();
    setEditTarget(emp);
    setResetPasswordValue("");
    setShowResetPassword(false);
    setEditEmployee({
      name: emp.name,
      email: emp.email,
      employeeNumber: emp.employeeNumber ?? "",
      phone: emp.phone,
      department: emp.department,
      geofenceId: emp.geofenceId ?? "",
      attendanceMode: emp.attendanceMode ?? null,
      status: emp.status ?? "active",
      password: emp.password ?? "",
    });
  };

  const handleUpdate = () => {
    if (!editTarget) return;
    const { password, ...updateData } = editEmployee;
    void password;
    updateEmployee.mutate(
      {
        id: editTarget.id,
        data: {
          ...updateData,
          employeeNumber: generateStaffUsername({ employeeNumber: editEmployee.employeeNumber }),
        },
      },
      {
        onSuccess: () => {
          toastSuccess(t("employeeUpdated"));
          setEditTarget(null);
        },
        onError: () => toastError(t("employeeUpdateFailed")),
      }
    );
  };

  const handleBulkDelete = async () => {
    hapticTap();
    const selectedEmployees = employees.filter((e) => selectedIds.includes(e.id));
    if (selectedEmployees.length === 0) {
      toastError(t("noEmployeeSelected"));
      return;
    }
    let successCount = 0;
    let failCount = 0;
    await Promise.all(
      selectedEmployees.map((emp) =>
        deleteEmployee
          .mutateAsync(emp.id)
          .then(() => successCount++)
          .catch(() => failCount++)
      )
    );
    if (successCount > 0 && failCount === 0) {
      toastWithUndo(t("employeesDeleted", { count: successCount }), () => {
        toastError(t("cannotUndo"));
        void refetch();
      });
    } else if (successCount > 0 && failCount > 0) {
      toastError(t("deletePartialSuccess", { success: successCount, failed: failCount }));
    } else {
      toastError(t("deleteFailed"));
    }
    setSelectedIds([]);
  };

  const handleBulkExport = () => {
    const selected = employees.filter((e) => selectedIds.includes(e.id));
    if (selected.length === 0) {
      toastError(t("noEmployeeSelectedExport"));
      return;
    }
    hapticSuccess();
    const headers = t("csvHeaders") as unknown as string[];
    const rows = selected.map((e) => [
      e.name,
      e.email,
      e.phone,
      e.department,
      e.status === "active" ? t("active") : t("inactiveStatus"),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `employees_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toastSuccess(t("exportSuccess", { count: selected.length }));
  };

  const handleDelete = (emp: Employee) => {
    setDeleteTarget(emp);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const deletedEmployee = deleteTarget;
    deleteEmployee.mutate(deleteTarget.id, {
      onSuccess: () => {
        toastWithUndo(t("deleteEmployeeSuccess", { name: deletedEmployee.name }), () => {
          toastError(t("cannotUndo"));
          void refetch();
        });
        setDeleteTarget(null);
      },
      onError: () => {
        toastError(t("deleteEmployeeFailed"));
        setDeleteTarget(null);
      },
    });
  };

  const getGeofenceName = (id: string | null) => {
    if (!id) return "-";
    return geofences.find((g) => String(g.id) === String(id))?.name || "-";
  };

  const geofenceOptions = useMemo(
    () =>
      geofences.map((g) => (
        <option key={String(g.id)} value={String(g.id)}>
          {g.name}
        </option>
      )),
    [geofences]
  );

  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const staffLoginUrl = useMemo(() => {
    const envBase = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "";

    let browserOrigin = "";
    let browserIsLocal = false;

    if (typeof window !== "undefined") {
      browserOrigin = window.location.origin || "";
      try {
        const host = new URL(browserOrigin).hostname;
        browserIsLocal = host === "localhost" || host === "127.0.0.1";
      } catch {
        browserIsLocal = false;
      }
    }

    const baseCandidate = envBase || (browserIsLocal ? DEFAULT_PUBLIC_APP_URL : browserOrigin);
    const normalizedBase = baseCandidate?.replace(/\/$/, "");
    if (!normalizedBase) return null;

    const identifier = createdCredentials?.username || createdCredentials?.email || "";
    const withIdentifier = identifier ? `?identifier=${encodeURIComponent(identifier)}` : "";

    return `${normalizedBase}/${locale}/login${withIdentifier}`;
  }, [locale, createdCredentials?.email, createdCredentials?.username]);

  const departments = useMemo(() => {
    const depts = new Set(employees.map((e) => e.department).filter(Boolean));
    return Array.from(depts);
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      if (
        search &&
        !e.name.toLowerCase().includes(search.toLowerCase()) &&
        !e.email.toLowerCase().includes(search.toLowerCase()) &&
        !e.department.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      if (filterDept && e.department !== filterDept) return false;
      if (filterStatus && e.status !== filterStatus) return false;
      return true;
    });
  }, [employees, search, filterDept, filterStatus]);

  const inactiveCount = employees.filter((e) => e.status !== "active").length;

  if (role === "employee") {
    return (
      <MainLayout>
        <div className="p-6 min-h-screen">
          <AccessDeniedCard icon={Users} message={t("accessDenied")} ctaHref="/check-in" />
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
          Icon={<Users className="w-7 h-7" />}
          LeftSection={
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-muted rounded-lg p-1">
                <button
                  onClick={() => handleViewMode("table")}
                  className={`p-1.5 rounded-md transition-all ${
                    viewMode === "table"
                      ? "bg-card shadow-sm text-primary"
                      : "text-muted-foreground hover:text-muted-foreground dark:hover:text-foreground"
                  }`}
                  aria-label={t("tableView")}
                >
                  <LayoutList className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleViewMode("grid")}
                  className={`p-1.5 rounded-md transition-all ${
                    viewMode === "grid"
                      ? "bg-card shadow-sm text-primary"
                      : "text-muted-foreground hover:text-muted-foreground dark:hover:text-foreground"
                  }`}
                  aria-label={t("cardView")}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowBulkImport(true)}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {t("importCsv")}
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                {t("addEmployee")}
              </Button>
            </div>
          }
        />

        <BulkImportDrawer
          open={showBulkImport}
          onOpenChange={setShowBulkImport}
          existingEmployees={employees}
        />

        {showAddForm && (
          <FormDrawer
            open={showAddForm}
            onOpenChange={setShowAddForm}
            title={t("addEmployeeTitle")}
            description={t("addEmployeeDescription")}
            onSubmit={handleAdd}
            isSubmitting={createEmployee.isPending}
            submitLabel={t("save")}
          >
            <div className="grid grid-cols-1 gap-4">
              <FormField
                label={t("name")}
                value={newEmployee.name}
                onChange={(v) => setNewEmployee({ ...newEmployee, name: v })}
                placeholder={t("employeeNamePlaceholder")}
              />
              <FormField
                label={t("email")}
                type="email"
                value={newEmployee.email}
                onChange={(v) => setNewEmployee({ ...newEmployee, email: v })}
                placeholder="email@trax.com"
                ltr
              />
              <FormSelect
                label={t("geofenceLabel")}
                value={newEmployee.geofenceId}
                onChange={(v) => setNewEmployee({ ...newEmployee, geofenceId: v })}
                placeholder={t("selectGeofence")}
              >
                {geofenceOptions}
              </FormSelect>
              <FormField
                label={t("password")}
                type="text"
                value={newEmployee.password}
                onChange={(v) => setNewEmployee({ ...newEmployee, password: v })}
                placeholder={t("passwordMin")}
                required
              />
              <p className="text-xs text-muted-foreground -mt-2">{t("passwordHint")}</p>
            </div>
          </FormDrawer>
        )}

        {/* Credentials success dialog */}
        {createdCredentials && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{t("accountCreated")}</h3>
                  <p className="text-xs text-muted-foreground">{t("keepCredentials")}</p>
                </div>
              </div>
              <div className="bg-muted rounded-xl p-4 space-y-3 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t("adminEmail")}</p>
                  <p className="font-mono text-sm font-semibold text-foreground select-all">
                    <span dir="ltr" lang="en" style={{ unicodeBidi: "plaintext" }}>
                      {createdCredentials.email}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t("employeePassword")}</p>
                  <p className="font-mono text-sm font-semibold text-foreground select-all">
                    {createdCredentials.password}
                  </p>
                </div>
              </div>
              <div className="mb-4">
                <button
                  type="button"
                  onClick={async () => {
                    const message = buildStaffCredentialsMessage({
                      email: createdCredentials.email,
                      username: createdCredentials.username,
                      password: createdCredentials.password,
                      loginUrl: staffLoginUrl,
                    });

                    const copyText = async (text: string) => {
                      if (navigator.clipboard?.writeText) {
                        try {
                          await navigator.clipboard.writeText(text);
                          return;
                        } catch {
                          // fall through to textarea fallback
                        }
                      }

                      const textarea = document.createElement("textarea");
                      textarea.value = text;
                      textarea.style.position = "fixed";
                      textarea.style.top = "0";
                      textarea.style.left = "0";
                      textarea.style.opacity = "0";
                      textarea.style.pointerEvents = "none";
                      textarea.setAttribute("readonly", "");
                      document.body.appendChild(textarea);
                      textarea.focus();
                      textarea.setSelectionRange(0, text.length);
                      const copied = document.execCommand("copy");
                      document.body.removeChild(textarea);
                      if (!copied) throw new Error("execCommand copy failed");
                    };

                    try {
                      await copyText(message);
                      toastSuccess(t("copySuccess"));
                    } catch (err) {
                      console.error("[copyCredentials] failed:", err);
                      toastError(t("copyFailed"));
                    }
                  }}
                  aria-label={t("copyCredentials")}
                  className="w-full py-2 px-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  {t("copyCredentials")}
                </button>
              </div>
              <button
                onClick={() => setCreatedCredentials(null)}
                className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-colors"
              >
                {t("gotIt")}
              </button>
            </div>
          </div>
        )}

        {/* Stats strip */}
        {!isLoading && !isError && employees.length > 0 && (
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/30">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary/70">
                {employees.length} {t("employees")}
              </span>
            </div>
            {inactiveCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted border border-input">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                <span className="text-sm font-semibold text-muted-foreground">
                  {inactiveCount} {t("inactive")}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Search + filter bar */}
        {!isLoading && !isError && employees.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full pr-9 pl-3 py-2 rounded-xl border border-input bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring shadow-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground/70 hover:text-muted-foreground" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="px-3 py-2 rounded-xl border border-input bg-card text-sm text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring shadow-sm"
              >
                <option value="">{t("allDepartments")}</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-xl border border-input bg-card text-sm text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring shadow-sm"
              >
                <option value="">{t("allStatuses")}</option>
                <option value="active">{t("active")}</option>
                <option value="inactive">{t("inactiveStatus")}</option>
              </select>
              {(search || filterDept || filterStatus) && (
                <button
                  onClick={() => {
                    setSearch("");
                    setFilterDept("");
                    setFilterStatus("");
                  }}
                  className="px-3 py-2 rounded-xl text-sm text-destructive hover:bg-destructive/5 dark:hover:bg-destructive/10 border border-destructive/20 border-destructive/30 transition-colors"
                >
                  {t("clear")}
                </button>
              )}
            </div>
          </div>
        )}

        {isLoading && <EmployeeListSkeleton />}
        {isError && (
          <div className="space-y-3">
            <ErrorState onRetry={() => refetch()} />
            <div className="bg-destructive/5 border border-destructive/20 border-destructive/30 rounded-xl p-4 text-left">
              <p className="text-xs font-bold text-destructive text-destructive/70 mb-1">
                {t("errorDetails")}
              </p>
              <p className="text-xs text-destructive font-mono break-all">
                {error instanceof Error ? error.message : JSON.stringify(error)}
              </p>
            </div>
          </div>
        )}
        {!isLoading && !isError && employees.length === 0 && (
          <EmptyState
            icon={Users}
            illustration="employees"
            title={t("noEmployees")}
            description={t("noEmployeesDescription")}
            actionLabel={t("addEmployee")}
            onAction={() => setShowAddForm(true)}
            secondaryActionLabel={t("importFromCsv")}
            onSecondaryAction={() => setShowBulkImport(true)}
            tip={t("addEmployeeTip")}
          />
        )}
        {!isLoading && !isError && employees.length > 0 && viewMode === "grid" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence>
              {filteredEmployees.map((emp, index) => (
                <motion.div
                  key={emp.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.3 }}
                >
                  <Card className="border-0 shadow-md bg-card hover:shadow-xl group transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                    <CardContent className="p-4">
                      {/* Avatar + name row */}
                      <div className="flex items-center gap-3 mb-3">
                        <motion.div
                          transition={{ type: "spring", stiffness: 300 }}
                          className={`relative w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold text-lg overflow-hidden shadow-md ring-2 ${
                            emp.status === "active" ? "ring-primary/40" : "ring-border"
                          }`}
                        >
                          {emp.name.charAt(0)}
                          {emp.status === "active" && (
                            <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-primary ring-2 ring-background ring-card">
                              <span className="animate-ping absolute inset-0 rounded-full bg-primary opacity-75" />
                            </span>
                          )}
                        </motion.div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-foreground truncate">{emp.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{emp.department}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            {emp.geofenceId && (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                <MapPin className="w-2.5 h-2.5" />
                                {getGeofenceName(emp.geofenceId)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Contact info */}
                      <div className="text-xs text-muted-foreground space-y-1 mb-3 px-1">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span
                            dir="ltr"
                            lang="en"
                            style={{ unicodeBidi: "plaintext" }}
                            className="truncate"
                          >
                            {emp.email}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 pt-3 border-t border-border">
                        <Link
                          href={`/employees/${emp.id}`}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                          title={t("viewProfile")}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {t("view")}
                        </Link>
                        <div className="w-px h-5 bg-muted" />
                        <button
                          onClick={() => handleEdit(emp)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                          title={t("edit")}
                        >
                          <Edit className="w-3.5 h-3.5" />
                          {t("edit")}
                        </button>
                        <div className="w-px h-5 bg-muted" />
                        <button
                          onClick={() => handleDelete(emp)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          title={t("delete")}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {t("delete")}
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
        {!isLoading && !isError && employees.length > 0 && viewMode === "table" && (
          <>
            <DataTable<Employee>
              columns={[
                {
                  key: "name",
                  header: t("employee"),
                  sortable: true,
                  filterable: true,
                  sortValue: (emp) => emp.name,
                  cell: (emp) => (
                    <Link
                      href={`/employees/${emp.id}`}
                      className="flex items-center gap-3 hover:underline"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold text-sm overflow-hidden">
                        {emp.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-foreground">{emp.name}</span>
                    </Link>
                  ),
                },
                {
                  key: "status",
                  header: t("status"),
                  sortable: true,
                  sortValue: (emp) => emp.status,
                  cell: (emp) => (
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        emp.status === "active"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {emp.status === "active" && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                        </span>
                      )}
                      {emp.status === "active" ? t("active") : t("inactiveStatus")}
                    </span>
                  ),
                },
                {
                  key: "contact",
                  header: t("username"),
                  cell: (emp) => (
                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        <span dir="ltr" lang="en" style={{ unicodeBidi: "plaintext" }}>
                          {emp.email}
                        </span>
                      </span>
                    </div>
                  ),
                },
                {
                  key: "geofenceId",
                  header: t("geofence"),
                  filterable: true,
                  sortValue: (emp) => getGeofenceName(emp.geofenceId ?? null),
                  cell: (emp) => (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-muted-foreground/70" />
                      {getGeofenceName(emp.geofenceId ?? null)}
                    </span>
                  ),
                },
                {
                  key: "actions",
                  header: t("actions"),
                  cell: (emp) => (
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/employees/${emp.id}`}
                        className="p-1.5 rounded-lg text-primary hover:bg-primary/10"
                        title={t("viewProfile")}
                        aria-label={t("viewProfile")}
                      >
                        <Eye className="w-4 h-4" aria-hidden />
                      </Link>
                      <button
                        onClick={() => handleEdit(emp)}
                        className="p-1.5 rounded-lg text-primary hover:bg-primary/10"
                        title={t("edit")}
                        aria-label={t("edit")}
                      >
                        <Edit className="w-4 h-4" aria-hidden />
                      </button>
                      <button
                        onClick={() => handleDelete(emp)}
                        className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10"
                        title={t("delete")}
                        aria-label={t("delete")}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden />
                      </button>
                    </div>
                  ),
                },
              ]}
              data={employees}
              searchPlaceholder={t("searchPlaceholder")}
              selectable
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
            />
          </>
        )}

        {/* Bulk Actions Floating Bar */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card rounded-2xl shadow-2xl border border-border px-6 py-3 flex items-center gap-4"
            >
              <span className="text-sm font-medium text-foreground">
                {selectedIds.length} {t("selected")}
              </span>
              <div className="h-6 w-px bg-muted" />
              <button
                onClick={handleBulkExport}
                className="flex items-center gap-1.5 text-sm text-primary hover:bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                {t("exportSelected")}
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 text-sm text-destructive hover:bg-destructive/5 dark:hover:bg-destructive/10 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {t("deleteSelected")}
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="text-sm text-muted-foreground hover:text-muted-foreground dark:hover:text-foreground px-2"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <ConfirmDialog
          open={deleteTarget !== null}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title={t("confirmDeleteTitle")}
          description={t("confirmDeleteDescription", { name: deleteTarget?.name })}
          confirmLabel={t("delete")}
          cancelLabel={t("cancel")}
          onConfirm={confirmDelete}
        />

        {/* Edit Employee Drawer */}
        <FormDrawer
          open={editTarget !== null}
          onOpenChange={(open) => !open && setEditTarget(null)}
          title={t("editEmployeeTitle", { name: editTarget?.name || "" })}
          description={t("editEmployeeDescription")}
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
            <div className="flex items-center justify-between p-3 rounded-xl border border-input bg-card">
              <span className="text-sm font-medium text-foreground">
                {editEmployee.status === "active" ? t("active") : t("inactiveStatus")}
              </span>
              <Switch
                checked={editEmployee.status === "active"}
                onCheckedChange={(checked) =>
                  setEditEmployee({ ...editEmployee, status: checked ? "active" : "inactive" })
                }
                aria-label={t("status")}
              />
            </div>
            <FormSelect
              label={t("geofenceLabel")}
              value={editEmployee.geofenceId}
              onChange={(v) => setEditEmployee({ ...editEmployee, geofenceId: v })}
              placeholder={t("selectGeofence")}
            >
              {geofenceOptions}
            </FormSelect>
            <FormField
              label={t("currentPassword")}
              type="text"
              value={editEmployee.password}
              readOnly
              ltr
              className="bg-muted/30"
            />

            {/* Reset password section */}
            <div className="pt-3 border-t border-border">
              {!showResetPassword ? (
                <button
                  type="button"
                  onClick={() => setShowResetPassword(true)}
                  className="text-xs text-primary hover:underline"
                >
                  {t("setNewPassword")}
                </button>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-muted-foreground">
                    {t("newPassword")}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={resetPasswordValue}
                      onChange={(e) => setResetPasswordValue(e.target.value)}
                      placeholder={t("passwordMin")}
                      dir="ltr"
                      className="flex-1 px-3 py-2 text-sm border border-input rounded-lg outline-none focus:ring-2 focus:ring-ring bg-transparent text-foreground"
                    />
                    <button
                      type="button"
                      disabled={resetPasswordValue.length < 8 || resetEmployeePassword.isPending}
                      onClick={() => {
                        if (!editTarget || resetPasswordValue.length < 8) return;
                        resetEmployeePassword.mutate(
                          {
                            id: editTarget.id,
                            password: resetPasswordValue,
                            email: editTarget.email,
                          },
                          {
                            onSuccess: () => {
                              toastSuccess(t("passwordChanged"));
                              setResetPasswordValue("");
                              setShowResetPassword(false);
                            },
                            onError: () => toastError(t("passwordChangeFailed")),
                          }
                        );
                      }}
                      className="px-3 py-2 text-sm bg-primary hover:bg-primary/90 disabled:opacity-40 text-primary-foreground rounded-lg transition-colors"
                    >
                      {resetEmployeePassword.isPending ? "…" : t("changePassword")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowResetPassword(false);
                        setResetPasswordValue("");
                      }}
                      className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      {t("cancel")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </FormDrawer>
      </div>
    </MainLayout>
  );
}
