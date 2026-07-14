"use client";

import { useState, useEffect, useMemo } from "react";
import MainLayout from "@/components/shared/MainLayout";
import FullPageHead from "@/components/shared/FullPageHead";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { toastSuccess, toastError, toastWithUndo } from "@/hooks/use-toast";
import { hapticTap, hapticSuccess } from "@/lib/utils/haptics";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import type { Employee, EmployeeRole } from "@/lib/types/trackingTypes";
import { useAuthStore } from "@/stores/useAuthStore";
import AccessDeniedCard from "@/components/shared/AccessDeniedCard";
import {
  buildStaffCredentialsEmail,
  buildStaffCredentialsMessage,
  generateStaffUsername,
} from "@/lib/utils/staffOnboarding";

const DEFAULT_PUBLIC_APP_URL = "https://naf--trax-ae.asia-southeast1.hosted.app";

const roleLabels: Record<string, string> = {
  manager: "مدير",
  employee: "موظف",
  supervisor: "مشرف",
};

export default function EmployeesPage() {
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
  const [newEmployee, setNewEmployee] = useState<{ name: string; email: string; employeeNumber: string; phone: string; department: string; role: EmployeeRole; geofenceId: string | number; password: string; }>({
    name: "",
    email: "",
    employeeNumber: "",
    phone: "",
    department: "",
    role: "employee",
    geofenceId: 1,
    password: "",
  });
  const [editEmployee, setEditEmployee] = useState<{ name: string; email: string; employeeNumber: string; phone: string; department: string; role: EmployeeRole; geofenceId: string | number; }>({
    name: "",
    email: "",
    employeeNumber: "",
    phone: "",
    department: "",
    role: "employee",
    geofenceId: 1,
  });

  const resetNewEmployee = () => {
    setNewEmployee({
      name: "",
      email: "",
      employeeNumber: "",
      phone: "",
      department: "",
      role: "employee",
      geofenceId: 1,
      password: "",
    });
    setShowAddForm(false);
  };

  const handleAdd = () => {
    if (!newEmployee.name || !newEmployee.email || !newEmployee.password) {
      toastError("يرجى ملء الاسم والبريد الإلكتروني وكلمة المرور");
      return;
    }
    if (newEmployee.password.length < 8) {
      toastError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
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
        onError: () => {
          toastError("حدث خطأ أثناء إضافة الموظف");
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
      role: emp.role,
      geofenceId: emp.geofenceId ?? 1,
    });
  };

  const handleUpdate = () => {
    if (!editTarget) return;
    updateEmployee.mutate(
      {
        id: editTarget.id,
        data: {
          ...editEmployee,
          employeeNumber: generateStaffUsername({ employeeNumber: editEmployee.employeeNumber }),
        },
      },
      {
        onSuccess: () => {
          toastSuccess("تم تحديث بيانات الموظف بنجاح");
          setEditTarget(null);
        },
        onError: () => toastError("حدث خطأ أثناء تحديث بيانات الموظف"),
      }
    );
  };

  const handleBulkDelete = () => {
    hapticTap();
    const selectedEmployees = employees.filter((e) => selectedIds.includes(e.id));
    selectedEmployees.forEach((emp) => {
      deleteEmployee.mutate(emp.id);
    });
    toastWithUndo(`تم حذف ${selectedEmployees.length} موظف`, () => {
      toastError("لا يمكن التراجع — يرجى إعادة إضافة الموظفين يدوياً");
      void refetch();
    });
    setSelectedIds([]);
  };

  const handleBulkExport = () => {
    hapticSuccess();
    const selected = employees.filter((e) => selectedIds.includes(e.id));
    const headers = ["الاسم", "البريد", "الهاتف", "القسم", "الدور", "الحالة"];
    const rows = selected.map((e) => [
      e.name,
      e.email,
      e.phone,
      e.department,
      roleLabels[e.role],
      e.status === "active" ? "نشط" : "غير نشط",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `employees_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toastSuccess(`تم تصدير ${selected.length} موظف`);
  };

  const handleDelete = (emp: Employee) => {
    setDeleteTarget(emp);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const deletedEmployee = deleteTarget;
    deleteEmployee.mutate(deleteTarget.id, {
      onSuccess: () => {
        toastWithUndo(`تم حذف الموظف ${deletedEmployee.name}`, () => {
          toastError("لا يمكن التراجع — يرجى إعادة إضافة الموظف يدوياً");
          void refetch();
        });
        setDeleteTarget(null);
      },
      onError: () => {
        toastError("تعذر حذف الموظف");
        setDeleteTarget(null);
      },
    });
  };

  const getGeofenceName = (id: number | null) => {
    if (!id) return "-";
    return geofences.find((g) => g.id === id)?.name || "-";
  };

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

  const activeCount = employees.filter((e) => e.status === "active").length;
  const inactiveCount = employees.filter((e) => e.status !== "active").length;

  if (role === "employee") {
    return (
      <MainLayout>
        <div className="p-6 min-h-screen">
          <AccessDeniedCard
            icon={Users}
            message="صفحة إدارة الموظفين متاحة لمدير الشركة فقط."
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
          head="إدارة الموظفين"
          description="عرض وإدارة جميع الموظفين في النظام"
          Icon={<Users className="w-7 h-7" />}
          LeftSection={
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                <button
                  onClick={() => handleViewMode("table")}
                  className={`p-1.5 rounded-md transition-all ${
                    viewMode === "table"
                      ? "bg-white dark:bg-slate-800 shadow-sm text-blue-600"
                      : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
                  }`}
                  aria-label="عرض جدول"
                >
                  <LayoutList className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleViewMode("grid")}
                  className={`p-1.5 rounded-md transition-all ${
                    viewMode === "grid"
                      ? "bg-white dark:bg-slate-800 shadow-sm text-blue-600"
                      : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
                  }`}
                  aria-label="عرض بطاقات"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
              <Button
                variant="primary"
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                إضافة موظف
              </Button>
            </div>
          }
        />

        {showAddForm && (
          <FormDrawer
            open={showAddForm}
            onOpenChange={setShowAddForm}
            title="إضافة موظف جديد"
            description="أدخل بيانات الموظف الجديد"
            onSubmit={handleAdd}
            isSubmitting={createEmployee.isPending}
            submitLabel="حفظ"
          >
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 block">
                  الاسم
                </label>
                <input
                  type="text"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-transparent dark:bg-slate-900 text-gray-900 dark:text-slate-100"
                  placeholder="اسم الموظف"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 block">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  dir="ltr"
                  lang="en"
                  style={{ unicodeBidi: "plaintext" }}
                  className="w-full text-left px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-transparent dark:bg-slate-900 text-gray-900 dark:text-slate-100"
                  placeholder="email@trax.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 block">
                  الدور
                </label>
                <select
                  value={newEmployee.role}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, role: e.target.value as EmployeeRole })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-transparent dark:bg-slate-900 text-gray-900 dark:text-slate-100"
                >
                  <option value="employee">موظف</option>
                  <option value="supervisor">مشرف</option>
                  <option value="manager">مدير</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 block">
                  النطاق الجغرافي
                </label>
                <select
                  value={newEmployee.geofenceId}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, geofenceId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-transparent dark:bg-slate-900 text-gray-900 dark:text-slate-100"
                >
                  {geofences.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 block">
                  كلمة المرور <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={newEmployee.password}
                  onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-transparent dark:bg-slate-900 text-gray-900 dark:text-slate-100"
                  placeholder="8 أحرف على الأقل"
                />
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  سيستخدم الموظف هذه البيانات لتسجيل الدخول
                </p>
              </div>
            </div>
          </FormDrawer>
        )}

        {/* Credentials success dialog */}
        {createdCredentials && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-slate-100">
                    تم إنشاء حساب الموظف
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    احتفظ بهذه البيانات وشاركها مع الموظف
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-slate-900 rounded-xl p-4 space-y-3 mb-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">
                    البريد الإلكتروني
                  </p>
                  <p className="font-mono text-sm font-semibold text-gray-900 dark:text-slate-100 select-all">
                    <span dir="ltr" lang="en" style={{ unicodeBidi: "plaintext" }}>
                      {createdCredentials.email}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">كلمة المرور</p>
                  <p className="font-mono text-sm font-semibold text-gray-900 dark:text-slate-100 select-all">
                    {createdCredentials.password}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  type="button"
                  onClick={async () => {
                    const message = buildStaffCredentialsMessage({
                      email: createdCredentials.email,
                      password: createdCredentials.password,
                      loginUrl: staffLoginUrl,
                    });
                    try {
                      await navigator.clipboard.writeText(message);
                      toastSuccess("تم نسخ بيانات الدخول");
                    } catch {
                      toastError("تعذر النسخ التلقائي. انسخ البيانات يدويًا.");
                    }
                  }}
                  aria-label="نسخ بيانات الدخول"
                  className="py-2 px-3 rounded-xl border border-gray-200 dark:border-slate-600 text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  نسخ البيانات
                </button>
                <a
                  href={`mailto:${createdCredentials.email}?subject=${encodeURIComponent(
                    buildStaffCredentialsEmail({
                      email: createdCredentials.email,
                      password: createdCredentials.password,
                      loginUrl: staffLoginUrl,
                    }).subject
                  )}&body=${encodeURIComponent(
                    buildStaffCredentialsEmail({
                      email: createdCredentials.email,
                      password: createdCredentials.password,
                      loginUrl: staffLoginUrl,
                    }).body
                  )}`}
                  className="py-2 px-3 rounded-xl border border-blue-200 dark:border-blue-700 text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-center"
                >
                  مشاركة عبر البريد
                </a>
              </div>
              <button
                onClick={() => setCreatedCredentials(null)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
              >
                فهمت
              </button>
            </div>
          </div>
        )}

        {/* Stats strip */}
        {!isLoading && !isError && employees.length > 0 && (
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                {employees.length} موظف
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                {activeCount} نشط
              </span>
            </div>
            {inactiveCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-700 border border-gray-100 dark:border-slate-600">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                <span className="text-sm font-semibold text-gray-600 dark:text-slate-300">
                  {inactiveCount} غير نشط
                </span>
              </div>
            )}
          </div>
        )}

        {/* Search + filter bar */}
        {!isLoading && !isError && employees.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث بالاسم أو البريد أو القسم..."
                className="w-full pr-9 pl-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              >
                <option value="">جميع الأقسام</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              >
                <option value="">جميع الحالات</option>
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
              </select>
              {(search || filterDept || filterStatus) && (
                <button
                  onClick={() => {
                    setSearch("");
                    setFilterDept("");
                    setFilterStatus("");
                  }}
                  className="px-3 py-2 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 transition-colors"
                >
                  مسح
                </button>
              )}
            </div>
          </div>
        )}

        {isLoading && <EmployeeListSkeleton />}
        {isError && (
          <div className="space-y-3">
            <ErrorState onRetry={() => refetch()} />
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-left">
              <p className="text-xs font-bold text-red-700 dark:text-red-300 mb-1">تفاصيل الخطأ:</p>
              <p className="text-xs text-red-600 dark:text-red-400 font-mono break-all">
                {error instanceof Error ? error.message : JSON.stringify(error)}
              </p>
            </div>
          </div>
        )}
        {!isLoading && !isError && employees.length === 0 && (
          <EmptyState
            icon={Users}
            illustration="employees"
            title="لا يوجد موظفون"
            description="لم يتم العثور على أي موظفين في النظام"
            actionLabel="إضافة موظف"
            onAction={() => setShowAddForm(true)}
            secondaryActionLabel="استيراد من CSV"
            onSecondaryAction={() => toastSuccess("سيتم إضافة الاستيراد قريباً")}
            tip="يمكنك إضافة موظفين فرديين أو استيراد ملف CSV جماعي"
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
                  <Card className="border-0 shadow-md dark:bg-slate-800 hover:shadow-xl group transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                    <CardContent className="p-4">
                      {/* Avatar + name row */}
                      <div className="flex items-center gap-3 mb-3">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          transition={{ type: "spring", stiffness: 300 }}
                          className={`relative w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-lg overflow-hidden shadow-md ring-2 ${
                            emp.status === "active"
                              ? "ring-green-400"
                              : "ring-gray-200 dark:ring-slate-600"
                          }`}
                        >
                          {emp.name.charAt(0)}
                          {emp.status === "active" && (
                            <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-green-400 ring-2 ring-white dark:ring-slate-800">
                              <span className="animate-ping absolute inset-0 rounded-full bg-green-400 opacity-75" />
                            </span>
                          )}
                        </motion.div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-gray-900 dark:text-slate-100 truncate">
                            {emp.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                            {emp.department}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                              {roleLabels[emp.role] || emp.role}
                            </span>
                            {emp.geofenceId && (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400">
                                <MapPin className="w-2.5 h-2.5" />
                                {getGeofenceName(emp.geofenceId)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Contact info */}
                      <div className="text-xs text-gray-500 dark:text-slate-400 space-y-1 mb-3 px-1">
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

                      <div className="flex items-center gap-1 pt-3 border-t border-gray-100 dark:border-slate-700">
                        <Link
                          href={`/employees/${emp.id}`}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-slate-400 hover:bg-cyan-50 hover:text-cyan-600 dark:hover:bg-cyan-900/20 dark:hover:text-cyan-400 transition-colors"
                          title="عرض الملف"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          عرض
                        </Link>
                        <div className="w-px h-5 bg-gray-100 dark:bg-slate-700" />
                        <button
                          onClick={() => handleEdit(emp)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-colors"
                          title="تعديل"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          تعديل
                        </button>
                        <div className="w-px h-5 bg-gray-100 dark:bg-slate-700" />
                        <button
                          onClick={() => handleDelete(emp)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          حذف
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
                  header: "الموظف",
                  sortable: true,
                  filterable: true,
                  sortValue: (emp) => emp.name,
                  cell: (emp) => (
                    <Link
                      href={`/employees/${emp.id}`}
                      className="flex items-center gap-3 hover:underline"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                        {emp.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
                        {emp.name}
                      </span>
                    </Link>
                  ),
                },
                {
                  key: "employeeNumber",
                  header: "الرقم الوظيفي",
                  sortable: true,
                  filterable: true,
                  sortValue: (emp) => emp.employeeNumber ?? "",
                  cell: (emp) => (
                    <span
                      dir="ltr"
                      lang="en"
                      style={{ unicodeBidi: "plaintext" }}
                      className="inline-block text-left text-sm text-gray-600 dark:text-slate-400 font-mono"
                    >
                      {emp.employeeNumber || "-"}
                    </span>
                  ),
                },
                {
                  key: "department",
                  header: "القسم",
                  sortable: true,
                  filterable: true,
                  sortValue: (emp) => emp.department,
                  cell: (emp) => emp.department,
                },
                {
                  key: "role",
                  header: "الدور",
                  sortable: true,
                  sortValue: (emp) => emp.role,
                  cell: (emp) => (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      {roleLabels[emp.role]}
                    </span>
                  ),
                },
                {
                  key: "contact",
                  header: "التواصل",
                  cell: (emp) => (
                    <div className="flex flex-col gap-1 text-xs text-gray-500 dark:text-slate-400">
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
                  header: "النطاق الجغرافي",
                  filterable: true,
                  sortValue: (emp) => getGeofenceName(emp.geofenceId ?? null),
                  cell: (emp) => (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {getGeofenceName(emp.geofenceId ?? null)}
                    </span>
                  ),
                },
                {
                  key: "status",
                  header: "الحالة",
                  sortable: true,
                  sortValue: (emp) => emp.status,
                  cell: (emp) => (
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        emp.status === "active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400"
                      }`}
                    >
                      {emp.status === "active" && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                        </span>
                      )}
                      {emp.status === "active" ? "نشط" : "غير نشط"}
                    </span>
                  ),
                },
                {
                  key: "actions",
                  header: "إجراءات",
                  cell: (emp) => (
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/employees/${emp.id}`}
                        className="p-1.5 rounded-lg hover:bg-cyan-50 text-cyan-600 dark:hover:bg-cyan-900/20"
                        title="عرض الملف"
                        aria-label="عرض ملف الموظف"
                      >
                        <Eye className="w-4 h-4" aria-hidden />
                      </Link>
                      <button
                        onClick={() => handleEdit(emp)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 dark:hover:bg-blue-900/20"
                        title="تعديل"
                        aria-label="تعديل الموظف"
                      >
                        <Edit className="w-4 h-4" aria-hidden />
                      </button>
                      <button
                        onClick={() => handleDelete(emp)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 dark:hover:bg-red-900/20"
                        title="حذف"
                        aria-label="حذف الموظف"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden />
                      </button>
                    </div>
                  ),
                },
              ]}
              data={employees}
              searchPlaceholder="بحث بالاسم أو الرقم الوظيفي أو القسم أو النطاق..."
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
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 px-6 py-3 flex items-center gap-4"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                {selectedIds.length} محدد
              </span>
              <div className="h-6 w-px bg-gray-200 dark:bg-slate-600" />
              <button
                onClick={handleBulkExport}
                className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                تصدير المحدد
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                حذف المحدد
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 px-2"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <ConfirmDialog
          open={deleteTarget !== null}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title="تأكيد الحذف"
          description={`هل أنت متأكد من حذف ${deleteTarget?.name}؟ لا يمكن التراجع عن هذا الإجراء.`}
          confirmLabel="حذف"
          cancelLabel="إلغاء"
          onConfirm={confirmDelete}
        />

        {/* Edit Employee Drawer */}
        <FormDrawer
          open={editTarget !== null}
          onOpenChange={(open) => !open && setEditTarget(null)}
          title={`تعديل: ${editTarget?.name || ""}`}
          description="تحديث بيانات الموظف"
          onSubmit={handleUpdate}
          isSubmitting={updateEmployee.isPending}
          submitLabel="حفظ التعديلات"
        >
          <div className="grid grid-cols-1 gap-4">
            {[
              { label: "الاسم", key: "name", type: "text", placeholder: "اسم الموظف" },
              {
                label: "البريد الإلكتروني",
                key: "email",
                type: "email",
                placeholder: "email@trax.com",
              },
            ].map(({ label, key, type, placeholder }) => {
              const isLtrField = key === "email";

              return (
                <div key={key}>
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 block">
                    {label}
                  </label>
                  <input
                    type={type}
                    value={editEmployee[key as keyof typeof editEmployee] as string}
                    onChange={(e) => setEditEmployee({ ...editEmployee, [key]: e.target.value })}
                    dir={isLtrField ? "ltr" : "rtl"}
                    lang={isLtrField ? "en" : "ar"}
                    style={isLtrField ? { unicodeBidi: "plaintext" } : undefined}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-transparent dark:bg-slate-900 text-gray-900 dark:text-slate-100 ${isLtrField ? "text-left" : "text-right"}`}
                    placeholder={placeholder}
                  />
                </div>
              );
            })}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 block">
                الدور
              </label>
              <select
                value={editEmployee.role}
                onChange={(e) =>
                  setEditEmployee({ ...editEmployee, role: e.target.value as EmployeeRole })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-transparent dark:bg-slate-900 text-gray-900 dark:text-slate-100"
              >
                <option value="employee">موظف</option>
                <option value="supervisor">مشرف</option>
                <option value="manager">مدير</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 block">
                النطاق الجغرافي
              </label>
              <select
                value={editEmployee.geofenceId}
                onChange={(e) =>
                  setEditEmployee({ ...editEmployee, geofenceId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-transparent dark:bg-slate-900 text-gray-900 dark:text-slate-100"
              >
                {geofences.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset password section */}
            <div className="pt-3 border-t border-gray-200 dark:border-slate-700">
              {!showResetPassword ? (
                <button
                  type="button"
                  onClick={() => setShowResetPassword(true)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  تعيين كلمة مرور جديدة للموظف
                </button>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300">
                    كلمة المرور الجديدة
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={resetPasswordValue}
                      onChange={(e) => setResetPasswordValue(e.target.value)}
                      placeholder="8 أحرف على الأقل"
                      dir="ltr"
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-transparent dark:bg-slate-900 text-gray-900 dark:text-slate-100"
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
                              toastSuccess("تم تغيير كلمة المرور بنجاح");
                              setResetPasswordValue("");
                              setShowResetPassword(false);
                            },
                            onError: () => toastError("فشل تغيير كلمة المرور"),
                          }
                        );
                      }}
                      className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg transition-colors"
                    >
                      {resetEmployeePassword.isPending ? "…" : "حفظ"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowResetPassword(false);
                        setResetPasswordValue("");
                      }}
                      className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-slate-400"
                    >
                      إلغاء
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
