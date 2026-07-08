"use client";

import { useState, use } from "react";
import { motion } from "framer-motion";
import MainLayout from "@/components/shared/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  MapPin,
  Edit,
  Trash2,
  UserCircle,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  useEmployees,
  useAttendance,
  useGeofences,
  useDeleteEmployee,
  useUpdateEmployee,
} from "@/hooks/useApi";
import { FormDrawer } from "@/components/shared/FormDrawer";
import { LoadingSkeleton, ErrorState, EmptyState } from "@/components/shared/StateViews";
import { DataTable, type Column } from "@/components/shared/DataTable/DataTable";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { toastSuccess, toastError, toastWithUndo, useToast } from "@/hooks/use-toast";
import { Link } from "@/i18n/navigation";
import type { AttendanceRecord } from "@/lib/types/trackingTypes";
import AvatarUpload from "@/components/shared/AvatarUpload";
import Image from "next/image";

const statusLabels: Record<string, string> = {
  present: "حاضر",
  late: "متأخر",
  absent: "غائب",
  checked_out: "منصرف",
};

const roleLabels: Record<string, string> = {
  manager: "مدير",
  employee: "موظف",
  supervisor: "مشرف",
};

export default function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const locale = useLocale();
  const { data: employees = [], isLoading: empLoading, isError: empError } = useEmployees();
  const { data: attendanceData = [] } = useAttendance();
  const { data: geofences = [] } = useGeofences();
  const deleteEmployee = useDeleteEmployee();
  const updateEmployee = useUpdateEmployee();
  const { toast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null);
  const [editEmployee, setEditEmployee] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    role: "employee" as "employee" | "supervisor" | "manager",
    geofenceId: 1,
  });

  const employee = employees.find((e) => e.id === Number(id));
  const empAttendance = attendanceData.filter((a) => a.employeeId === Number(id)).slice(0, 30);

  const last7Days = empAttendance.slice(0, 7);
  const presentCount = last7Days.filter((a) => a.status === "present").length;
  const lateCount = last7Days.filter((a) => a.status === "late").length;
  const absentCount = last7Days.filter((a) => a.status === "absent").length;

  if (empLoading) {
    return (
      <MainLayout>
        <div className="p-6">
          <LoadingSkeleton variant="list" />
        </div>
      </MainLayout>
    );
  }

  if (empError || !employee) {
    return (
      <MainLayout>
        <div className="p-6">
          <ErrorState onRetry={() => router.push(`/${locale}/employees`)} />
        </div>
      </MainLayout>
    );
  }

  const geofenceName = geofences.find((g) => g.id === employee.geofenceId)?.name || "-";

  const handleOpenEdit = () => {
    if (!employee) return;
    setEditEmployee({
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      department: employee.department,
      role: employee.role as "employee" | "supervisor" | "manager",
      geofenceId: employee.geofenceId ?? 1,
    });
    setShowEditForm(true);
  };

  const handleUpdate = () => {
    if (!employee) return;
    updateEmployee.mutate(
      { id: employee.id, data: editEmployee },
      {
        onSuccess: () => {
          toastSuccess("تم تحديث بيانات الموظف");
          setShowEditForm(false);
        },
        onError: () => toastError("حدث خطأ أثناء التحديث"),
      }
    );
  };

  const handleDelete = () => {
    const deletedEmployee = employee;
    deleteEmployee.mutate(employee.id, {
      onSuccess: () => {
        toastWithUndo(`تم حذف الموظف ${deletedEmployee.name}`, () => {
          router.push(`/${locale}/employees`);
        });
        router.push(`/${locale}/employees`);
      },
      onError: () => {
        toastError("تعذر حذف الموظف");
      },
    });
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6 min-h-screen">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={`/${locale}/employees`}
            className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            الموظفون
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-700 dark:text-slate-300 font-medium">{employee.name}</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Profile Header Card */}
          <Card className="border-0 shadow-xl dark:bg-slate-800 overflow-hidden">
            <div className="h-24 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700" />
            <CardContent className="pb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 -mt-12">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl border-4 border-white dark:border-slate-800">
                  {employee.avatar ? (
                    <Image
                      src={employee.avatar}
                      alt={employee.name}
                      width={96}
                      height={96}
                      unoptimized
                      className="w-full h-full rounded-2xl object-cover"
                    />
                  ) : (
                    employee.name.charAt(0)
                  )}
                </div>
                <div className="flex-1 mt-4 sm:mt-0">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                    {employee.name}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      {roleLabels[employee.role]}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        employee.status === "active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400"
                      }`}
                    >
                      {employee.status === "active" ? "نشط" : "غير نشط"}
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
                    تحرير
                  </Button>
                  <Button
                    variant="error"
                    size="sm"
                    className="flex items-center gap-1.5"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="w-4 h-4" />
                    حذف
                  </Button>
                </div>
              </div>

              {/* Contact Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-700/50">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-slate-400">البريد الإلكتروني</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                      <span dir="ltr" lang="en" style={{ unicodeBidi: "plaintext" }}>
                        {employee.email}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-700/50">
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-slate-400">الهاتف</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                      <span dir="ltr" lang="en" style={{ unicodeBidi: "plaintext" }}>
                        {employee.phone}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-700/50">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-slate-400">القسم</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                      {employee.department || "-"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-700/50">
                  <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-slate-400">النطاق الجغرافي</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                      {geofenceName}
                    </p>
                  </div>
                </div>
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
          <Card className="border-0 shadow-lg dark:bg-slate-800">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                  {presentCount}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">أيام الحضور (7 أيام)</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg dark:bg-slate-800">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{lateCount}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">أيام التأخير (7 أيام)</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg dark:bg-slate-800">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                  {absentCount}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">أيام الغياب (7 أيام)</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Attendance History Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg dark:bg-slate-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-slate-100">
                    سجل الحضور (آخر 30 سجل)
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    تاريخ عمليات الحضور والانصراف
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {empAttendance.length === 0 ? (
                <EmptyState
                  illustration="attendance"
                  title="لا توجد سجلات حضور"
                  description="لم يتم تسجيل أي حضور لهذا الموظف بعد"
                />
              ) : (
                <DataTable<AttendanceRecord>
                  columns={[
                    {
                      key: "date",
                      header: "التاريخ",
                      sortable: true,
                      sortValue: (r) => r.date,
                      cell: (r) => r.date,
                    },
                    {
                      key: "checkInTime",
                      header: "وقت الحضور",
                      sortable: true,
                      sortValue: (r) => r.checkInTime || "",
                      cell: (r) => (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {r.checkInTime || "-"}
                        </span>
                      ),
                    },
                    {
                      key: "checkOutTime",
                      header: "وقت الانصراف",
                      cell: (r) => r.checkOutTime || "-",
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
                          {statusLabels[r.status] || r.status}
                        </span>
                      ),
                    },
                    {
                      key: "workedHours",
                      header: "ساعات العمل",
                      cell: (r) => `${r.workedHours?.toFixed(1) || "0"} ساعة`,
                    },
                    {
                      key: "geofenceName",
                      header: "الموقع",
                      cell: (r) => r.geofenceName || "-",
                    },
                  ]}
                  data={empAttendance}
                  searchPlaceholder="بحث في السجلات..."
                  pageSize={10}
                />
              )}
            </CardContent>
          </Card>
        </motion.div>

        <ConfirmDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title="تأكيد الحذف"
          description={`هل أنت متأكد من حذف ${employee.name}؟ لا يمكن التراجع عن هذا الإجراء.`}
          confirmLabel="حذف"
          cancelLabel="إلغاء"
          onConfirm={handleDelete}
        />

        <FormDrawer
          open={showEditForm}
          onOpenChange={setShowEditForm}
          title={`تعديل: ${employee.name}`}
          description="تحديث بيانات الموظف"
          onSubmit={handleUpdate}
          isSubmitting={updateEmployee.isPending}
          submitLabel="حفظ التعديلات"
        >
          <div className="flex justify-center mb-6">
            <AvatarUpload
              currentUrl={editAvatarPreview ?? employee.avatar}
              name={editEmployee.name || employee.name}
              size={96}
              folder="avatars"
              onUpload={(url) => setEditAvatarPreview(url)}
              onRemove={() => setEditAvatarPreview(null)}
            />
          </div>
          <div className="grid grid-cols-1 gap-4">
            {[
              { label: "الاسم", key: "name", type: "text", placeholder: "اسم الموظف" },
              {
                label: "البريد الإلكتروني",
                key: "email",
                type: "email",
                placeholder: "email@trax.com",
              },
              { label: "الهاتف", key: "phone", type: "tel", placeholder: "+966..." },
              { label: "القسم", key: "department", type: "text", placeholder: "القسم" },
            ].map(({ label, key, type, placeholder }) => {
              const isLtrField = key === "email" || key === "phone";

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
                  setEditEmployee({
                    ...editEmployee,
                    role: e.target.value as typeof editEmployee.role,
                  })
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
                  setEditEmployee({ ...editEmployee, geofenceId: Number(e.target.value) })
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
          </div>
        </FormDrawer>
      </div>
    </MainLayout>
  );
}
