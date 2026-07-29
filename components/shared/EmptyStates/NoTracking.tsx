"use client";

import { MapPin } from "lucide-react";
import GenericEmpty from "./GenericEmpty";
import { useTranslations } from "next-intl";

export default function NoTracking() {
  const t = useTranslations("LiveMap");
  return (
    <GenericEmpty
      icon={MapPin}
      title={t("noActiveTrackingTitle")}
      description={t("noActiveTrackingDescription")}
    />
  );
}
