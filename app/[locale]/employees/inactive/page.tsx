"use client";

import MainLayout from "@/components/shared/MainLayout";
import FullPageHead from "@/components/shared/FullPageHead";
import { Users, Mail, Phone } from "lucide-react";
import { useInactiveEmployees } from "@/hooks/useApi";
import { LoadingSkeleton, EmptyState, ErrorState } from "@/components/shared/StateViews";
import { DataTable } from "@/components/shared/DataTable/DataTable";
import type { Employee } from "@/lib/types/trackingTypes";

const roleLabels: Record<string, string> = {
  manager: "مدير",
  employee: "موظف",
  supervisor: "مشرف",
};

export default function InactiveEmployeesPage() {
  const { data: inactiveEmployees = [], isLoading, isError, refetch } = useInactiveEmployees();

  return (
    <MainLayout>
      <div className="p-6 space-y-6 min-h-screen">
        <FullPageHead
          head="الموظفون غير النشطين"
          description="قائمة الموظفين غير النشطين في النظام"
          Icon={<Users className="w-7 h-7" />}
        />

        {isLoading && <LoadingSkeleton variant="table" />}
        {isError && <ErrorState onRetry={() => refetch()} />}
        {!isLoading && !isError && inactiveEmployees.length === 0 && (
          <EmptyState
            icon={Users}
            title="لا يوجد موظفون غير نشطين"
            description="جميع الموظفين نشطون حالياً"
          />
        )}
        {!isLoading && !isError && inactiveEmployees.length > 0 && (
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
                    <div className="w-10 h-10 rounded-full bg-muted-foreground/30 bg-muted flex items-center justify-center text-primary-foreground font-bold text-sm">
                      {emp.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-foreground">
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
                cell: (emp) => (
                  <span className="text-muted-foreground">{emp.department}</span>
                ),
              },
              {
                key: "role",
                header: "الدور",
                sortable: true,
                sortValue: (emp) => emp.role,
                cell: (emp) => (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                    {roleLabels[emp.role]}
                  </span>
                ),
              },
              {
                key: "contact",
                header: "التواصل",
                cell: (emp) => (
                  <div className="flex flex-col gap-1 text-xs text-muted-foreground/70">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      <span dir="ltr" lang="en" style={{ unicodeBidi: "plaintext" }}>
                        {emp.email}
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      <span dir="ltr" lang="en" style={{ unicodeBidi: "plaintext" }}>
                        {emp.phone}
                      </span>
                    </span>
                  </div>
                ),
              },
            ]}
            data={inactiveEmployees}
            searchPlaceholder="بحث بالاسم أو القسم..."
          />
        )}
      </div>
    </MainLayout>
  );
}
