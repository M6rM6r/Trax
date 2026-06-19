"use client";

import MainLayout from "@/components/shared/MainLayout";
import FullPageHead from "@/components/shared/FullPageHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockAttendance, mockEmployees } from "@/lib/mockData/trackingMockData";

const statusLabels: Record<string, string> = {
  present: "حاضر",
  late: "متأخر",
  absent: "غائب",
  checked_out: "منصرف",
};

export default function AttendancePage() {
  return (
    <MainLayout>
      <div className="p-6 space-y-6 min-h-screen">
        <FullPageHead
          head="سجلات الحضور والانصراف"
          description="سجلات حضور الموظفين لهذا اليوم"
          Icon={<Calendar className="w-7 h-7" />}
          LeftSection={
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              تصدير
            </Button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-black text-green-600">
                  {mockAttendance.filter((r) => r.status === "present").length}
                </p>
                <p className="text-sm text-gray-600 mt-1">حاضر</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-black text-amber-600">
                  {mockAttendance.filter((r) => r.status === "late").length}
                </p>
                <p className="text-sm text-gray-600 mt-1">متأخر</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-black text-red-600">
                  {mockAttendance.filter((r) => r.status === "absent").length}
                </p>
                <p className="text-sm text-gray-600 mt-1">غائب</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-black text-gray-600">
                  {mockAttendance.length}
                </p>
                <p className="text-sm text-gray-600 mt-1">الإجمالي</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-bold">تفاصيل الحضور</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">الموظف</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">القسم</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">وقت الحضور</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">وقت الانصراف</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">التأخير (دقيقة)</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">الموقع</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {mockAttendance.map((record) => {
                    const employee = mockEmployees.find((e) => e.id === record.employeeId);
                    return (
                      <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">{record.employeeName}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{employee?.department || "-"}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{record.checkInTime || "-"}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{record.checkOutTime || "-"}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {record.lateMinutes > 0 ? (
                            <span className="text-amber-600 font-medium">{record.lateMinutes}</span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{record.geofenceName || "-"}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              record.status === "present"
                                ? "bg-green-100 text-green-800"
                                : record.status === "late"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {statusLabels[record.status]}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
