"use client";

import { useState, useMemo } from "react";
import MainLayout from "@/components/shared/MainLayout";
import FullPageHead from "@/components/shared/FullPageHead";
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
  const role = useAuthStore((s) => s.role);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
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
    const headers = ["Name", "Email", "Phone", "Department", "Status"];
    const rows = selected.map((e) => [
      e.name,
      e.email,
      e.phone,
      e.department,
      e.status === "active" ? "Active" : "Inactive",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${(c ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `employees_export_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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

  const inactiveCount = employees.filter((e) => e.status !== "active").length;

  if (role === "employee") {
    return (
      <MainLayout>
        <div className="min-h-screen p-3 sm:p-4 md:p-6">
          <AccessDeniedCard icon={Users} message={t("accessDenied")} ctaHref="/check-in" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen space-y-4 p-3 sm:space-y-6 sm:p-4 md:p-6">
        <FullPageHead
          head={t("title")}
          description={t("description")}
          Icon={<Users className="w-7 h-7" />}
          LeftSection={
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
              <Button
                variant="outline"
                onClick={() => setShowBulkImport(true)}
                className="flex h-11 w-full items-center justify-center gap-2 sm:h-10 sm:w-auto"
              >
                <Upload className="h-4 w-4 shrink-0" />
                {t("importCsv")}
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex h-11 w-full items-center justify-center gap-2 sm:h-10 sm:w-auto"
              >
                <UserPlus className="h-4 w-4 shrink-0" />
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
        {!isLoading && !isError && employees.length > 0 && (
          <>
            <DataTable<Employee>
              columns={[
                {
                  key: "name",
                  header: t("employee"),
                  sortable: true,
                  filterable: true,
                  mobilePrimary: true,
                  sortValue: (emp) => emp.name,
                  cell: (emp) => (
                    <Link href={`/employees/${emp.id}`} className="hover:underline">
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
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Link
                        href={`/employees/${emp.id}`}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-primary hover:bg-primary/10 sm:h-8 sm:w-8 sm:p-1.5"
                        title={t("viewProfile")}
                        aria-label={t("viewProfile")}
                      >
                        <Eye className="h-4 w-4" aria-hidden />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleEdit(emp)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-primary hover:bg-primary/10 sm:h-8 sm:w-8"
                        title={t("edit")}
                        aria-label={t("edit")}
                      >
                        <Edit className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(emp)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 sm:h-8 sm:w-8"
                        title={t("delete")}
                        aria-label={t("delete")}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
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
              className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-3 right-3 z-50 flex max-w-lg flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-card px-3 py-2.5 shadow-2xl sm:left-1/2 sm:right-auto sm:w-auto sm:max-w-none sm:-translate-x-1/2 sm:flex-nowrap sm:gap-4 sm:px-6 sm:py-3 lg:bottom-6"
            >
              <span className="text-sm font-medium text-foreground">
                {selectedIds.length} {t("selected")}
              </span>
              <div className="hidden h-6 w-px bg-muted sm:block" />
              <div className="flex flex-1 flex-wrap items-center justify-end gap-1 sm:flex-none sm:gap-2">
                <button
                  type="button"
                  onClick={handleBulkExport}
                  className="flex min-h-10 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-primary transition-colors hover:bg-primary/10"
                >
                  <Download className="h-4 w-4 shrink-0" />
                  <span className="hidden xs:inline sm:inline">{t("exportSelected")}</span>
                </button>
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  className="flex min-h-10 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">{t("deleteSelected")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
                  aria-label={t("cancel")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
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
