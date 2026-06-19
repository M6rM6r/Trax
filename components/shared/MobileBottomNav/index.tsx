"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LayoutDashboard, Users, MapPin, Calendar, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "الرئيسية", path: "" },
  { icon: Users, label: "الموظفون", path: "employees" },
  { icon: MapPin, label: "الخريطة", path: "live-map" },
  { icon: Calendar, label: "الحضور", path: "attendance" },
  { icon: CheckCircle, label: "تسجيل", path: "check-in" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const locale = useLocale();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const fullPath = `/${locale}/${item.path}`;
          const isActive =
            item.path === "" ? pathname === `/${locale}` : pathname.includes(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={fullPath}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors",
                isActive ? "text-primaryColor" : "text-gray-400 dark:text-slate-500"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
