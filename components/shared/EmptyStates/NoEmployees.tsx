"use client";

import { Users } from "lucide-react";
import GenericEmpty from "./GenericEmpty";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function NoEmployees() {
  const router = useRouter();
  const t = useTranslations("Employees");
  return (
    <GenericEmpty
      icon={Users}
      title={t("emptyEmployeesTitle")}
      description={t("emptyEmployeesDescription")}
      actionLabel={t("addEmployee")}
      onAction={() => router.push("/employees?openAdd=true")}
    />
  );
}
