"use client";

import { usePathname, Link } from "@/i18n/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  CheckCircle,
  Target,
  Settings,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { hapticTap } from "@/lib/utils/haptics";
import { useAuthStore } from "@/stores/useAuthStore";

const PRIMARY_ITEMS = [
  { icon: LayoutDashboard, label: "الرئيسية", path: "/" },
  { icon: Users, label: "الموظفون", path: "/employees" },
  { icon: Calendar, label: "الحضور", path: "/attendance" },
  { icon: Target, label: "النطاقات", path: "/geofences" },
  { icon: Settings, label: "الإعدادات", path: "/settings" },
];

const COMPANY_ITEM = { icon: Building2, label: "الشركة", path: "/settings/company" };

const employeeNavItems = [{ icon: CheckCircle, label: "تسجيل الحضور", path: "/check-in" }];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { role } = useAuthStore();

  if (role === "employee") {
    return (
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 bg-background/95 backdrop-blur-lg border-t border-border"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="التنقل السفلي"
      >
        <div className="flex items-center justify-around px-1 py-1.5">
          {employeeNavItems.map((item) => {
            const isActive = pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => hapticTap()}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[56px]",
                  isActive ? "text-primary bg-primary/10" : "text-muted-foreground/70"
                )}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavEmployee"
                    className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-1 bg-primary rounded-full"
                  />
                )}
                <Icon className="w-[20px] h-[20px]" />
                <span className="text-[10px] font-medium leading-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 bg-background/95 backdrop-blur-lg border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="التنقل السفلي"
    >
      <div className="flex items-center justify-around px-1 py-1.5">
        {(role === "company"
          ? [...PRIMARY_ITEMS.slice(0, 4), COMPANY_ITEM, ...PRIMARY_ITEMS.slice(4)]
          : PRIMARY_ITEMS
        ).map((item) => {
          const isActive =
            item.path === "/"
              ? pathname === "/"
              : item.path === "/settings"
                ? pathname.startsWith("/settings") && !pathname.includes("/settings/company")
                : pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => hapticTap()}
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 min-w-[48px] shrink-0",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground/70 hover:text-muted-foreground dark:hover:text-muted-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNavPrimary"
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-1 bg-primary rounded-full"
                />
              )}
              <div className="active:scale-[0.85] transition-transform duration-100">
                <Icon className="w-[18px] h-[18px]" />
              </div>
              <span className="text-[9px] font-medium leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
