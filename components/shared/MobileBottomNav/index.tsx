"use client";

import { usePathname, Link } from "@/i18n/navigation";
import {
  LayoutDashboard,
  Users,
  MapPin,
  Calendar,
  CheckCircle,
  Target,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { hapticTap } from "@/lib/utils/haptics";
import { useAuthStore } from "@/stores/useAuthStore";
import { useState, useEffect } from "react";

const PRIMARY_ITEMS = [
  { icon: LayoutDashboard, label: "الرئيسية", path: "/" },
  { icon: Users, label: "الموظفون", path: "/employees" },
  { icon: MapPin, label: "الخريطة", path: "/live-map" },
  { icon: Calendar, label: "الحضور", path: "/attendance" },
];

const SECONDARY_ITEMS = [
  { icon: CheckCircle, label: "تسجيل الحضور", path: "/check-in" },
  { icon: Target, label: "النطاقات", path: "/geofences" },
];

const employeeNavItems = [{ icon: CheckCircle, label: "تسجيل الحضور", path: "/check-in" }];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { role } = useAuthStore();
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    setShowMore(false);
  }, [pathname]);

  if (role === "employee") {
    return (
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-slate-700"
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
                  isActive
                    ? "text-primaryColor dark:text-primaryColor bg-primaryColor/10 dark:bg-primaryColor/10"
                    : "text-gray-400 dark:text-slate-500"
                )}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavEmployee"
                    className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-1 bg-primaryColor dark:bg-primaryColor rounded-full"
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

  const activeSecondary = SECONDARY_ITEMS.some((item) =>
    item.path === "/" ? pathname === "/" : pathname.startsWith(item.path)
  );

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-slate-700"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="التنقل السفلي"
      >
        <div className="flex items-center justify-around px-1 py-1.5">
          {PRIMARY_ITEMS.map((item) => {
            const isActive = item.path === "/" ? pathname === "/" : pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => hapticTap()}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 min-w-[48px] shrink-0",
                  isActive
                    ? "text-primaryColor dark:text-primaryColor bg-primaryColor/10 dark:bg-primaryColor/10"
                    : "text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
                )}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavPrimary"
                    className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-1 bg-primaryColor dark:bg-primaryColor rounded-full"
                  />
                )}
                <motion.div whileTap={{ scale: 0.85 }} transition={{ duration: 0.1 }}>
                  <Icon className="w-[18px] h-[18px]" />
                </motion.div>
                <span className="text-[9px] font-medium leading-tight">{item.label}</span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => {
              hapticTap();
              setShowMore(!showMore);
            }}
            className={cn(
              "relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 min-w-[48px] shrink-0",
              showMore || activeSecondary
                ? "text-primaryColor dark:text-primaryColor bg-primaryColor/10 dark:bg-primaryColor/10"
                : "text-gray-400 dark:text-slate-500"
            )}
            aria-label="المزيد"
            aria-expanded={showMore}
          >
            {(showMore || activeSecondary) && (
              <motion.div
                layoutId="activeNavMore"
                className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-1 bg-primaryColor dark:bg-primaryColor rounded-full"
              />
            )}
            <MoreHorizontal className="w-[18px] h-[18px]" />
            <span className="text-[9px] font-medium leading-tight">المزيد</span>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 z-40 flex items-end justify-center"
            onClick={() => setShowMore(false)}
          >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative z-50 mb-16 bg-background dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2 flex gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              {SECONDARY_ITEMS.map((item) => {
                const isActive = pathname.startsWith(item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => {
                      hapticTap();
                      setShowMore(false);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1 px-4 py-3 rounded-xl transition-all min-w-[72px]",
                      isActive
                        ? "text-primaryColor dark:text-primaryColor bg-primaryColor/10 dark:bg-primaryColor/10"
                        : "text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700"
                    )}
                    aria-label={item.label}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
