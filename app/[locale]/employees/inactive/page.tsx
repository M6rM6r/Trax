"use client";

import MainLayout from "@/components/shared/MainLayout";
import FullPageHead from "@/components/shared/FullPageHead";
import { Users, Mail, Phone } from "lucide-react";
import { useInactiveEmployees } from "@/hooks/useApi";
import { LoadingSkeleton, EmptyState, ErrorState } from "@/components/shared/StateViews";
import { DataTable } from "@/components/shared/DataTable/DataTable";
import type { Employee } from "@/lib/types/trackingTypes";
import { useTranslations } from "next-intl";

export default function InactiveEmployeesPage() {
  const t = useTranslations("Employees");
  const { data: inactiveEmployees = [], isLoading, isError, refetch } = useInactiveEmployees();

  return (
    <MainLayout>
      <div className="min-h-screen space-y-4 p-3 sm:space-y-6 sm:p-4 md:p-6">
        <FullPageHead
          head={t("inactiveEmployees")}
          description={t("inactiveEmployeesDescription")}
          Icon={<Users className="w-7 h-7" />}
        />

        {isLoading && <LoadingSkeleton variant="table" />}
        {isError && <ErrorState onRetry={() => refetch()} />}
        {!isLoading && !isError && inactiveEmployees.length === 0 && (
          <EmptyState
            icon={Users}
            title={t("noInactiveEmployees")}
            description={t("allEmployeesActive")}
          />
        )}
        {!isLoading && !isError && inactiveEmployees.length > 0 && (
          <DataTable<Employee>
            columns={[
              {
                key: "name",
                header: t("employee"),
                sortable: true,
                filterable: true,
                sortValue: (emp) => emp.name,
                cell: (emp) => (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted-foreground/30 bg-muted flex items-center justify-center text-primary-foreground font-bold text-sm">
                      {emp.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-foreground">{emp.name}</span>
                  </div>
                ),
              },
              {
                key: "department",
                header: t("department"),
                sortable: true,
                filterable: true,
                sortValue: (emp) => emp.department,
                cell: (emp) => <span className="text-muted-foreground">{emp.department}</span>,
              },
              {
                key: "contact",
                header: t("contact"),
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
            searchPlaceholder={t("searchByNameOrDepartment")}
          />
        )}
      </div>
    </MainLayout>
  );
}
