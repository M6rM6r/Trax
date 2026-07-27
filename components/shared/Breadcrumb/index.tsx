"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { ChevronLeft, Home } from "lucide-react";
import { useEmployees } from "@/hooks/useApi";

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

  const segments = pathname.split("/").filter((s) => s !== "" && s !== "ar" && s !== "en");

  const { data: employees = [] } = useEmployees({
    enabled: segments.includes("employees"),
  });

  const employeeNameById = useMemo(() => {
    const map = new Map<string, string>();
    employees.forEach((e) => map.set(e.id, e.name));
    return map;
  }, [employees]);

  const crumbs = segments.map((seg, i) => {
    const path = `/${segments.slice(0, i + 1).join("/")}`;
    const label = routeLabels[seg] ?? employeeNameById.get(seg) ?? seg;
    return { label, path };
  });

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
      <Link href="/" className="flex items-center gap-1 hover:text-primary transition-colors">
        <Home className="w-3.5 h-3.5" />
      </Link>
      {crumbs.map((crumb, i) => (
        <div key={i} className="flex items-center gap-1">
          <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground/50" />
          {i === crumbs.length - 1 ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <Link href={crumb.path} className="hover:text-primary transition-colors">
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
