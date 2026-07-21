"use client";

import { Users } from "lucide-react";
import GenericEmpty from "./GenericEmpty";
import { useRouter } from "@/i18n/navigation";

export default function NoEmployees() {
  const router = useRouter();
  return (
    <GenericEmpty
      icon={Users}
      title="لم تضف موظفين بعد"
      description="ابدأ بإضافة موظفيك لإدارة الحضور والانصراف وتتبع مواقعهم"
      actionLabel="إضافة موظف"
      onAction={() => router.push("/employees?openAdd=true")}
      gradient="from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20"
    />
  );
}
