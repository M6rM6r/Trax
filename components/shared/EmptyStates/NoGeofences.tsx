"use client";

import { MapPin } from "lucide-react";
import GenericEmpty from "./GenericEmpty";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function NoGeofences() {
  const router = useRouter();
  const t = useTranslations("Geofences");
  return (
    <GenericEmpty
      icon={MapPin}
      title={t("noGeofences")}
      description={t("noGeofencesDescription")}
      actionLabel={t("addGeofence")}
      onAction={() => router.push("/geofences?openAdd=true")}
    />
  );
}
