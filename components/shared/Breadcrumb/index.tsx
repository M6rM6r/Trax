"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ChevronLeft, Home } from "lucide-react";

const routeLabels: Record<string, string> = {
  "": "الرئيسية",
  employees: "الموظفون",
  inactive: "غير النشطين",
  attendance: "الحضور والانصراف",
  reports: "التقارير",
  geofences: "النطاقات الجغرافية",
  "live-map": "تتبع مباشر",
  "check-in": "تسجيل الحضور",
  settings: "الإعدادات",
  securitySettings: "إعدادات الأمان",
  notificationSettings: "إعدادات الإشعارات",
};

export default function Breadcrumb() {
  const pathname = usePathname();
  const locale = useLocale();

  const segments = pathname.split("/").filter((s) => s !== locale && s !== "");

  const crumbs = segments.map((seg, i) => {
    const path = `/${locale}/${segments.slice(0, i + 1).join("/")}`;
    return { label: routeLabels[seg] || seg, path };
  });

  return (
    <nav className="flex items-center gap-1 text-sm text-gray-500 dark:text-slate-400 mb-4">
      <Link href="/" className="flex items-center gap-1 hover:text-primaryColor transition-colors">
        <Home className="w-3.5 h-3.5" />
      </Link>
      {crumbs.map((crumb, i) => (
        <div key={i} className="flex items-center gap-1">
          <ChevronLeft className="w-3.5 h-3.5 text-gray-300" />
          {i === crumbs.length - 1 ? (
            <span className="text-gray-700 dark:text-slate-200 font-medium">{crumb.label}</span>
          ) : (
            <Link href={crumb.path} className="hover:text-primaryColor transition-colors">
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
