"use client";

import { Calendar } from "lucide-react";
import GenericEmpty from "./GenericEmpty";

export default function NoAttendance() {
  return (
    <GenericEmpty
      icon={Calendar}
      title="لا توجد سجلات حضور"
      description="لم يتم تسجيل أي حضور بعد. اطلب من موظفيك تسجيل الحضور عبر صفحة تسجيل الحضور"
    />
  );
}
