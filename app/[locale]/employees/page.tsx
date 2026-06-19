"use client";

import { useState } from "react";
import MainLayout from "@/components/shared/MainLayout";
import FullPageHead from "@/components/shared/FullPageHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Edit, Trash2, Phone, Mail, MapPin } from "lucide-react";
import { useEmployees, useGeofences, useCreateEmployee, useDeleteEmployee } from "@/hooks/useApi";
import { LoadingSkeleton, EmptyState, ErrorState } from "@/components/shared/StateViews";
import { DataTable, type Column } from "@/components/shared/DataTable/DataTable";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import type { Employee, EmployeeRole } from "@/lib/types/trackingTypes";

const roleLabels: Record<string, string> = {
  manager: "مدير",
  employee: "موظف",
  supervisor: "مشرف",
};

export default function EmployeesPage() {
  const { data: employees = [], isLoading, isError, refetch } = useEmployees();
  const { data: geofences = [] } = useGeofences();
  const createEmployee = useCreateEmployee();
  const deleteEmployee = useDeleteEmployee();
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    role: "employee" as EmployeeRole,
    geofenceId: 1,
  });

  const handleAdd = () => {
    createEmployee.mutate(
      {
        ...newEmployee,
        avatar: null,
        status: "active",
        currentLat: null,
        currentLng: null,
        lastSeen: null,
      },
      {
        onSuccess: () => {
          toast({ description: "تم إضافة الموظف بنجاح" });
          setShowAddForm(false);
          setNewEmployee({
            name: "",
            email: "",
            phone: "",
            department: "",
            role: "employee",
            geofenceId: 1,
          });
        },
        onError: () => {
          toast({ description: "حدث خطأ أثناء إضافة الموظف", variant: "destructive" });
        },
      }
    );
    setShowAddForm(false);
    setNewEmployee({
      name: "",
      email: "",
      phone: "",
      department: "",
      role: "employee",
      geofenceId: 1,
    });
  };

  const handleDelete = (emp: Employee) => {
    setDeleteTarget(emp);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteEmployee.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast({ description: "تم حذف الموظف" });
        setDeleteTarget(null);
      },
      onError: () => {
        toast({ description: "تعذر حذف الموظف", variant: "destructive" });
        setDeleteTarget(null);
      },
    });
  };

  const getGeofenceName = (id: number | null) => {
    if (!id) return "-";
    return geofences.find((g) => g.id === id)?.name || "-";
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6 min-h-screen">
        <FullPageHead
          head="إدارة الموظفين"
          description="عرض وإدارة جميع الموظفين في النظام"
          Icon={<Users className="w-7 h-7" />}
          LeftSection={
            <Button
              variant="primary"
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              إضافة موظف
            </Button>
          }
        />

        {showAddForm && (
          <Card className="border-0 shadow-lg dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-900 dark:text-slate-100">
                إضافة موظف جديد
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-transparent dark:bg-slate-900 text-gray-900 dark:text-slate-100"
                    placeholder="email@trax.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 block">
                    الهاتف
                  </label>
                  <input
                    type="tel"
                    value={newEmployee.phone}
                    onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-transparent dark:bg-slate-900 text-gray-900 dark:text-slate-100"
                    placeholder="+966..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 block">
                    القسم
                  </label>
                  <input
                    type="text"
                    value={newEmployee.department}
                    onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-transparent dark:bg-slate-900 text-gray-900 dark:text-slate-100"
                    placeholder="القسم"
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
                      setNewEmployee({ ...newEmployee, geofenceId: Number(e.target.value) })
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
              <div className="flex gap-3 mt-4">
                <Button variant="primary" onClick={handleAdd} disabled={createEmployee.isPending}>
                  {createEmployee.isPending ? "جاري الحفظ..." : "حفظ"}
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  إلغاء
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading && <LoadingSkeleton variant="table" />}
        {isError && <ErrorState onRetry={() => refetch()} />}
        {!isLoading && !isError && employees.length === 0 && (
          <EmptyState
            icon={Users}
            title="لا يوجد موظفون"
            description="لم يتم العثور على أي موظفين في النظام"
            actionLabel="إضافة موظف"
            onAction={() => setShowAddForm(true)}
          />
        )}
        {!isLoading && !isError && employees.length > 0 && (
          <DataTable<Employee>
            columns={[
              {
                key: "name",
                header: "الموظف",
                sortable: true,
                filterable: true,
                sortValue: (emp) => emp.name,
                cell: (emp) => (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      {emp.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
                      {emp.name}
                    </span>
                  </div>
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
                      {emp.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {emp.phone}
                    </span>
                  </div>
                ),
              },
              {
                key: "geofenceId",
                header: "النطاق الجغرافي",
                filterable: true,
                sortValue: (emp) => getGeofenceName(emp.geofenceId),
                cell: (emp) => (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    {getGeofenceName(emp.geofenceId)}
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
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      emp.status === "active"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400"
                    }`}
                  >
                    {emp.status === "active" ? "نشط" : "غير نشط"}
                  </span>
                ),
              },
              {
                key: "actions",
                header: "إجراءات",
                cell: (emp) => (
                  <div className="flex items-center gap-2">
                    <button
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 dark:hover:bg-blue-900/20"
                      title="تعديل"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(emp)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 dark:hover:bg-red-900/20"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ),
              },
            ]}
            data={employees}
            searchPlaceholder="بحث بالاسم أو القسم أو النطاق..."
          />
        )}

        <ConfirmDialog
          open={deleteTarget !== null}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title="تأكيد الحذف"
          description={`هل أنت متأكد من حذف ${deleteTarget?.name}؟ لا يمكن التراجع عن هذا الإجراء.`}
          confirmLabel="حذف"
          cancelLabel="إلغاء"
          onConfirm={confirmDelete}
        />
      </div>
    </MainLayout>
  );
}
