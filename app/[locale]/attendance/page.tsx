"use client";

import MainLayout from "@/components/shared/MainLayout";
import FullPageHead from "@/components/shared/FullPageHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAttendance, useEmployees } from "@/hooks/useApi";
import { LoadingSkeleton, EmptyState, ErrorState } from "@/components/shared/StateViews";
import { DataTable, type Column } from "@/components/shared/DataTable/DataTable";
import type { AttendanceRecord } from "@/lib/types/trackingTypes";

const statusLabels: Record<string, string> = {
  present: "حاضر",
  late: "متأخر",
  absent: "غائب",
  checked_out: "منصرف",
};

export default function AttendancePage() {
  const { data: attendance = [], isLoading, isError, refetch } = useAttendance();
  const { data: employees = [] } = useEmployees();

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
                  {attendance.filter((r) => r.status === "present").length}
                </p>
                <p className="text-sm text-gray-600 mt-1">حاضر</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-black text-amber-600">
                  {attendance.filter((r) => r.status === "late").length}
                </p>
                <p className="text-sm text-gray-600 mt-1">متأخر</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-black text-red-600">
                  {attendance.filter((r) => r.status === "absent").length}
                </p>
                <p className="text-sm text-gray-600 mt-1">غائب</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-black text-gray-600">{attendance.length}</p>
                <p className="text-sm text-gray-600 mt-1">الإجمالي</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {isLoading && <LoadingSkeleton variant="table" />}
        {isError && <ErrorState onRetry={() => refetch()} />}
        {!isLoading && !isError && attendance.length === 0 && (
          <EmptyState
            icon={Calendar}
            title="لا توجد سجلات حضور"
            description="لم يتم العثور على أي سجلات حضور لهذا اليوم"
          />
        )}
        {!isLoading && !isError && attendance.length > 0 && (
          <DataTable<AttendanceRecord>
            columns={[
              {
                key: "employeeName",
                header: "الموظف",
                sortable: true,
                filterable: true,
                sortValue: (r) => r.employeeName,
                cell: (r) => (
                  <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
                    {r.employeeName}
                  </span>
                ),
              },
              {
                key: "department",
                header: "القسم",
                sortable: true,
                filterable: true,
                sortValue: (r) => {
                  const emp = employees.find((e) => e.id === r.employeeId);
                  return emp?.department || "-";
                },
                cell: (r) => {
                  const emp = employees.find((e) => e.id === r.employeeId);
                  return emp?.department || "-";
                },
              },
              {
                key: "checkInTime",
                header: "وقت الحضور",
                sortable: true,
                sortValue: (r) => r.checkInTime || "",
                cell: (r) => r.checkInTime || "-",
              },
              {
                key: "checkOutTime",
                header: "وقت الانصراف",
                sortable: true,
                sortValue: (r) => r.checkOutTime || "",
                cell: (r) => r.checkOutTime || "-",
              },
              {
                key: "lateMinutes",
                header: "التأخير (دقيقة)",
                sortable: true,
                sortValue: (r) => r.lateMinutes,
                cell: (r) =>
                  r.lateMinutes > 0 ? (
                    <span className="text-amber-600 font-medium">{r.lateMinutes}</span>
                  ) : (
                    "-"
                  ),
              },
              {
                key: "geofenceName",
                header: "الموقع",
                filterable: true,
                sortValue: (r) => r.geofenceName || "",
                cell: (r) => r.geofenceName || "-",
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
                    {statusLabels[r.status]}
                  </span>
                ),
              },
            ]}
            data={attendance}
            searchPlaceholder="بحث بالاسم أو القسم أو الموقع..."
          />
        )}
      </div>
    </MainLayout>
  );
}
