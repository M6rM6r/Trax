"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { NavMain } from "@/components/Sidebar/nav-main";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  America,
  ArrowDown,
  Category,
  CheckCircle,
  CloseCircle,
  Logout,
  Menu,
  Profile,
  SaudiFlag,
  Search,
  Setting2,
  ShieldTick,
  Location,
} from "@/public/SVG";
import { MapPin } from "lucide-react";
import bill from "@/public/images/bill.jpg";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Link } from "@/i18n/navigation";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteCookie } from "cookies-next";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/useAuthStore";
import UserAvatar from "../Avatar";
import ThemeToggle from "../ThemeToggle";
import Breadcrumb from "../Breadcrumb";
import MobileBottomNav from "../MobileBottomNav";
import PageTransition from "../PageTransition";
import NotificationCenter from "../NotificationCenter";
import { CommandPalette } from "../CommandPalette";
import { ShortcutsHelp } from "../ShortcutsHelp";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useScrollPreservation } from "@/hooks/useScrollPreservation";
import { useResourcePreload } from "@/hooks/useResourcePreload";
import { TopLoadingBar } from "../TopLoadingBar";
import { ScrollProgress } from "../ScrollProgress";
import OfflineBanner from "../OfflineBanner";

const Index = ({
  children,
  showSidebar = true,
}: {
  children: React.ReactNode;
  showSidebar?: boolean;
}) => {
  const pathname = usePathname();
  const locale = useLocale();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const { toast } = useToast();
  const router = useRouter();

  const { user, role, clearUser } = useAuthStore();

  useKeyboardShortcuts();
  const { saveScrollPosition } = useScrollPreservation();
  useResourcePreload();

  useEffect(() => {
    setIsSidebarOpen(false);
    saveScrollPosition();
  }, [pathname, saveScrollPosition]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsSidebarOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;
      if (Math.abs(deltaY) > Math.abs(deltaX)) return;
      if (deltaX < -80 && isSidebarOpen) {
        setIsSidebarOpen(false);
      } else if (deltaX > 80 && !isSidebarOpen && touchStartX.current < 40) {
        setIsSidebarOpen(true);
      }
    },
    [isSidebarOpen]
  );

  const logOut = useCallback(async () => {
    deleteCookie("auth_token");
    clearUser();
    toast({
      description: "تم تسجيل الخروج بنجاح",
      variant: "default",
    });
    router.push("/login");
  }, [router, toast, clearUser]);

  return (
    <section className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <TopLoadingBar />
      <ScrollProgress />
      <OfflineBanner />

      <nav className="fixed top-0 z-[49] w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800" aria-label="الرأس">
        <header className="flex items-center justify-between gap-4 p-3 md:px-6 h-16 md:h-20">
          <div className="flex items-center gap-3">
            <Menu
              className="w-6 h-6 text-gray-700 dark:text-slate-200 lg:hidden cursor-pointer"
              onClick={toggleSidebar}
              aria-label="القائمة"
              suppressHydrationWarning
            />
            <Link href="/" className="flex items-center gap-2">
              <MapPin className="w-6 h-6 text-primaryColor" suppressHydrationWarning />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Trax</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden sm:flex items-center bg-gray-100 dark:bg-slate-800 rounded-full px-3 h-9 w-40 md:w-64">
              <Search className="w-4 h-4 text-gray-400" suppressHydrationWarning />
              <input
                type="text"
                className="bg-transparent border-none focus:ring-0 text-sm w-full px-2 dark:text-slate-200"
                placeholder="بحث..."
              />
            </div>

            <NotificationCenter />

            <div className="hidden md:flex items-center gap-3 border-l dark:border-slate-700 ps-4">
              <ThemeToggle />
              <UserAvatar user={user} className="w-8 h-8" />
            </div>
          </div>
        </header>
      </nav>

      {showSidebar && isSidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {showSidebar && (
        <aside
          id="logo-sidebar"
          className={cn(
            "fixed top-0 z-40 w-64 h-screen pt-20 transition-transform bg-white dark:bg-slate-900 border-e border-gray-200 dark:border-slate-800 lg:translate-x-0",
            locale === "ar" ? (isSidebarOpen ? "translate-x-0" : "translate-x-full") : (isSidebarOpen ? "translate-x-0" : "-translate-x-full")
          )}
        >
          <div className="h-full px-3 pb-4 flex flex-col justify-between">
            <NavMain
              items={
                role === "employee"
                  ? [
                      { title: "تسجيل الحضور", url: "/check-in", icon: CheckCircle, isActive: pathname.includes("/check-in") },
                    ]
                  : [
                      { title: "لوحة التحكم", url: "/", icon: Category, isActive: pathname === "/" },
                      { title: "الموظفون", url: "/employees", icon: Profile, isActive: pathname.includes("/employees") },
                      { title: "تتبع مباشر", url: "/live-map", icon: Location, isActive: pathname.includes("/live-map") },
                      { title: "الحضور والانصراف", url: "/attendance", icon: ShieldTick, isActive: pathname.includes("/attendance") },
                      { title: "النطاقات الجغرافية", url: "/geofences", icon: Location, isActive: pathname.includes("/geofences") },
                      { title: "تسجيل الحضور", url: "/check-in", icon: CheckCircle, isActive: pathname.includes("/check-in") },
                    ]
              }
            />
            <Button variant="ghost" className="w-full justify-start text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={logOut}>
              <Logout className="me-2" /> تسجيل الخروج
            </Button>
          </div>
        </aside>
      )}

      <main
        id="main-content"
        className={cn(
          "flex flex-col min-h-screen pt-16 md:pt-20 pb-24 lg:pb-6 px-4 md:px-8 max-w-7xl mx-auto transition-all",
          showSidebar && "lg:ms-64"
        )}
      >
        <div className="py-4">
          <Breadcrumb />
        </div>
        <PageTransition>{children}</PageTransition>
        <MobileBottomNav />
      </main>
      <CommandPalette />
      <ShortcutsHelp />
    </section>
  );
};

export default Index;
