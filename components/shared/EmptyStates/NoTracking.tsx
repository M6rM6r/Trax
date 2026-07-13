"use client";

import { MapPin } from "lucide-react";
import GenericEmpty from "./GenericEmpty";

export default function NoTracking() {
  return (
    <GenericEmpty
      icon={MapPin}
      title="لا يوجد موظفون نشطون على الخريطة"
      description="لا يوجد موظفون متصلون حالياً. ستظهر مواقعهم هنا عند تسجيل الحضور"
      gradient="from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20"
    />
  );
}
