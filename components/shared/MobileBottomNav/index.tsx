"use client";

import { usePathname, Link } from "@/i18n/navigation";
import { LayoutDashboard, Users, MapPin, Calendar, CheckCircle, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { hapticTap } from "@/lib/utils/haptics";
import { useAuthStore } from "@/stores/useAuthStore";

const bossNavItems = [
  { icon: LayoutDashboard, label: "الرئيسية", path: "/" },
  { icon: Users, label: "الموظفون", path: "/employees" },
  { icon: MapPin, label: "الخريطة", path: "/live-map" },
  { icon: Calendar, label: "الحضور", path: "/attendance" },
  { icon: CheckCircle, label: "تسجيل", path: "/check-in" },
  { icon: Target, label: "النطاقات", path: "/geofences" },
];

const employeeNavItems = [{ icon: CheckCircle, label: "تسجيل الحضور", path: "/check-in" }];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { role } = useAuthStore();
  const navItems = role === "employee" ? employeeNavItems : bossNavItems;

  const handlePress = () => {
    hapticTap();
  };

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-slate-700 transition-transform duration-300"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="التنقل السفلي"
    >
      <div className="flex items-center justify-around px-1 py-1.5 overflow-x-auto hideScrollbar">
        {navItems.map((item) => {
          const isActive =
            item.path === "/" ? pathname === "/" : pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={handlePress}
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 min-w-[48px] shrink-0",
                isActive
                  ? "text-primaryColor dark:text-blue-400 bg-primaryColor/10 dark:bg-blue-900/20"
                  : "text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-1 bg-primaryColor dark:bg-blue-400 rounded-full"
                />
              )}
              <motion.div whileTap={{ scale: 0.85 }} transition={{ duration: 0.1 }}>
                <Icon className="w-[18px] h-[18px]" />
              </motion.div>
              <span className="text-[9px] font-medium leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
