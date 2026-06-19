"use client";

import { useState } from "react";
import MainLayout from "@/components/shared/MainLayout";
import FullPageHead from "@/components/shared/FullPageHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Edit, Trash2, Phone, Mail, MapPin } from "lucide-react";
import { useEmployees, useGeofences, useCreateEmployee, useDeleteEmployee } from "@/hooks/useApi";
import type { EmployeeRole } from "@/lib/types/trackingTypes";

const roleLabels: Record<string, string> = {
  manager: "مدير",
  employee: "موظف",
  supervisor: "مشرف",
};

export default function EmployeesPage() {
  const { data: employees = [] } = useEmployees();
  const { data: geofences = [] } = useGeofences();
  const createEmployee = useCreateEmployee();
  const deleteEmployee = useDeleteEmployee();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    role: "employee" as EmployeeRole,
    geofenceId: 1,
  });

  const handleAdd = () => {
    createEmployee.mutate({
      ...newEmployee,
      avatar: null,
      status: "active",
      currentLat: null,
      currentLng: null,
      lastSeen: null,
    });
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

  const handleDelete = (id: number) => {
    deleteEmployee.mutate(id);
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
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-bold">إضافة موظف جديد</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">الاسم</label>
                  <input
                    type="text"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="اسم الموظف"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="email@trax.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">الهاتف</label>
                  <input
                    type="tel"
                    value={newEmployee.phone}
                    onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+966..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">القسم</label>
                  <input
                    type="text"
                    value={newEmployee.department}
                    onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="القسم"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">الدور</label>
                  <select
                    value={newEmployee.role}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, role: e.target.value as EmployeeRole })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="employee">موظف</option>
                    <option value="supervisor">مشرف</option>
                    <option value="manager">مدير</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    النطاق الجغرافي
                  </label>
                  <select
                    value={newEmployee.geofenceId}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, geofenceId: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
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
                <Button variant="primary" onClick={handleAdd}>
                  حفظ
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  إلغاء
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-0 shadow-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">
                      الموظف
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">
                      القسم
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">
                      الدور
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">
                      التواصل
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">
                      النطاق الجغرافي
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">
                      الحالة
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">
                      إجراءات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                            {emp.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{emp.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{emp.department}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {roleLabels[emp.role]}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {emp.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {emp.phone}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          {getGeofenceName(emp.geofenceId)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            emp.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {emp.status === "active" ? "نشط" : "غير نشط"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"
                            title="تعديل"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(emp.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
