"use client";

import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { ChevronLeft, Home } from "lucide-react";
import { useEmployee } from "@/hooks/useApi";
import { useTranslations } from "next-intl";

function useRouteLabel(segment: string): string {
  const t = useTranslations("Navigation");
  const labelMap: Record<string, string> = {
    "": t("home"),
    employees: t("employees"),
    inactive: t("inactive"),
    attendance: t("attendance"),
    reports: t("reports"),
    geofences: t("geofences"),
    "live-map": t("liveMap"),
    "check-in": t("checkIn"),
    settings: t("settings"),
    securitySettings: t("securitySettings"),
    notificationSettings: t("notificationSettings"),
  };
  return labelMap[segment] ?? segment;
}

export default function Breadcrumb() {
  const pathname = usePathname();

  const segments = pathname.split("/").filter((s) => s !== "" && s !== "ar" && s !== "en");

  const lastIndex = segments.length - 1;
  const secondLastSegment = segments.length > 1 ? segments[segments.length - 2] : null;
  const isEmployeeProfile = secondLastSegment === "employees";
  const employeeId = isEmployeeProfile ? segments[lastIndex] : null;
  const { data: activeEmployee } = useEmployee(employeeId);

  const getLabel = useRouteLabel;
  const crumbs = segments.map((seg, i) => {
    const path = `/${segments.slice(0, i + 1).join("/")}`;
    const isLast = i === lastIndex;
    const employeeName = isEmployeeProfile && isLast ? activeEmployee?.name : undefined;
    const label = getLabel(seg) ?? employeeName ?? (isEmployeeProfile && isLast ? "..." : seg);
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
