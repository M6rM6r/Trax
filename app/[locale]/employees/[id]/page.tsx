"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import MainLayout from "@/components/shared/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Mail,
  MapPin,
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
  useEmployees,
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

export default function EmployeeProfilePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { data: employees = [], isLoading: empLoading, isError: empError } = useEmployees();
  const { data: attendanceData = [] } = useAttendance();
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
    role: "employee" | "supervisor" | "manager";
    geofenceId: string;
  }>({
    name: "",
    email: "",
    phone: "",
    department: "",
    role: "employee",
    geofenceId: "",
  });

  const employee = employees.find((e) => String(e.id) === String(id));
  const empAttendance = attendanceData
    .filter((a) => String(a.employeeId) === String(id))
    .slice(0, 30);

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
      role: employee.role as "employee" | "supervisor" | "manager",
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
          router.push(`/employees`);
        });
        router.push(`/employees`);
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
            href={`/employees`}
            className="flex items-center gap-1 text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            الموظفون
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
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-xl border-4 border-border">
                  {employee.name.charAt(0)}
                </div>
                <div className="flex-1 mt-4 sm:mt-0">
                  <h1 className="text-2xl font-bold text-foreground">{employee.name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {roleLabels[employee.role]}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        employee.status === "active"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
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
                    variant="destructive"
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
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 bg-primary/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">البريد الإلكتروني</p>
                    <p className="text-sm font-medium text-foreground">
                      <span dir="ltr" lang="en" style={{ unicodeBidi: "plaintext" }}>
                        {employee.email}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">النطاق الجغرافي</p>
                    <p className="text-sm font-medium text-foreground">{geofenceName}</p>
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
          <Card className="border-0 shadow-lg bg-card">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{presentCount}</p>
                <p className="text-xs text-muted-foreground">أيام الحضور (7 أيام)</p>
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
                <p className="text-xs text-muted-foreground">أيام التأخير (7 أيام)</p>
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
                <p className="text-xs text-muted-foreground">أيام الغياب (7 أيام)</p>
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
          <Card className="border-0 shadow-lg bg-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/50 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-foreground">
                    سجل الحضور (آخر 30 سجل)
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">تاريخ عمليات الحضور والانصراف</p>
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
                          <Clock className="w-3 h-3 text-muted-foreground/70" />
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
                              ? "bg-primary/10 text-primary"
                              : r.status === "late"
                                ? "bg-[hsl(48_96%_53%/0.15)] text-[hsl(48_96%_53%)]"
                                : "bg-destructive/10 text-destructive"
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
          <div className="grid grid-cols-1 gap-4">
            <FormField
              label="الاسم"
              value={editEmployee.name}
              onChange={(v) => setEditEmployee({ ...editEmployee, name: v })}
              placeholder="اسم الموظف"
            />
            <FormField
              label="البريد الإلكتروني"
              type="email"
              value={editEmployee.email}
              onChange={(v) => setEditEmployee({ ...editEmployee, email: v })}
              placeholder="email@trax.com"
              ltr
            />
            <FormSelect
              label="الدور"
              value={editEmployee.role}
              onChange={(v) =>
                setEditEmployee({ ...editEmployee, role: v as typeof editEmployee.role })
              }
            >
              <option value="employee">موظف</option>
              <option value="supervisor">مشرف</option>
              <option value="manager">مدير</option>
            </FormSelect>
            <FormSelect
              label="النطاق الجغرافي"
              value={editEmployee.geofenceId}
              onChange={(v) => setEditEmployee({ ...editEmployee, geofenceId: v })}
            >
              {geofences.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </FormSelect>
          </div>
        </FormDrawer>
      </div>
    </MainLayout>
  );
}
