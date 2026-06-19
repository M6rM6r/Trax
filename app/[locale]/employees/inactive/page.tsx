"use client";

import MainLayout from "@/components/shared/MainLayout";
import FullPageHead from "@/components/shared/FullPageHead";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Mail, Phone } from "lucide-react";
import { mockEmployees } from "@/lib/mockData/trackingMockData";

const roleLabels: Record<string, string> = {
  manager: "مدير",
  employee: "موظف",
  supervisor: "مشرف",
};

export default function InactiveEmployeesPage() {
  const inactiveEmployees = mockEmployees.filter((e) => e.status === "inactive");

  return (
    <MainLayout>
      <div className="p-6 space-y-6 min-h-screen">
        <FullPageHead
          head="الموظفون غير النشطين"
          description="قائمة الموظفين غير النشطين في النظام"
          Icon={<Users className="w-7 h-7" />}
        />

        <Card className="border-0 shadow-lg">
          <CardContent className="p-0">
            {inactiveEmployees.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                لا يوجد موظفون غير نشطين
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">الموظف</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">القسم</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">الدور</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">التواصل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inactiveEmployees.map((emp) => (
                      <tr key={emp.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold text-sm">
                              {emp.name.charAt(0)}
                            </div>
                            <span className="text-sm font-medium text-gray-700">{emp.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">{emp.department}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            {roleLabels[emp.role]}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1 text-xs text-gray-400">
                            <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{emp.email}</span>
                            <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{emp.phone}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
