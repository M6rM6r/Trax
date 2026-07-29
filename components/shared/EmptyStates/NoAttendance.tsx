"use client";

import { Calendar } from "lucide-react";
import GenericEmpty from "./GenericEmpty";
import { useTranslations } from "next-intl";

export default function NoAttendance() {
  const t = useTranslations("Attendance");
  return (
    <GenericEmpty icon={Calendar} title={t("emptyTitle")} description={t("emptyDescription")} />
  );
}
