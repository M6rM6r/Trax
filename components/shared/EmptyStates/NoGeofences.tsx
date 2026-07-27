"use client";

import { MapPin } from "lucide-react";
import GenericEmpty from "./GenericEmpty";
import { useRouter } from "@/i18n/navigation";

export default function NoGeofences() {
  const router = useRouter();
  return (
    <GenericEmpty
      icon={MapPin}
      title="لم تنشئ نطاقات جغرافية"
      description="أنشئ نطاقك الجغرافي الأول لتحديد مناطق العمل وتتبع حضور الموظفين"
      actionLabel="إنشاء نطاق"
      onAction={() => router.push("/geofences?openAdd=true")}
    />
  );
}
