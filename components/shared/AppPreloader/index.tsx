"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

export default function AppPreloader() {
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    router.prefetch(`/${locale}/employees`);
    router.prefetch(`/${locale}/live-map`);
    router.prefetch(`/${locale}/attendance`);
    router.prefetch(`/${locale}/geofences`);
    router.prefetch(`/${locale}/check-in`);
  }, [router, locale]);

  return null;
}
