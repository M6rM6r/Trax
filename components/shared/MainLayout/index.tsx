"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { NavMain } from "@/components/Sidebar/nav-main";
import { usePathname, useRouter, Link } from "@/i18n/navigation";
import { Category, CheckCircle, Logout, Menu, Profile, ShieldTick, Location } from "@/public/SVG";
import { MapPin, Settings, User as UserIcon } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/config/firebase";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/useAuthStore";
import UserAvatar from "../Avatar";
import ThemeToggle from "../ThemeToggle";
import Breadcrumb from "../Breadcrumb";
import MobileBottomNav from "../MobileBottomNav";
import PageTransition from "../PageTransition";
import { CommandPalette } from "../CommandPalette";
import { ShortcutsHelp } from "../ShortcutsHelp";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useScrollPreservation } from "@/hooks/useScrollPreservation";
import { useResourcePreload } from "@/hooks/useResourcePreload";
import { TopLoadingBar } from "../TopLoadingBar";
import { ScrollProgress } from "../ScrollProgress";
import OfflineBanner from "../OfflineBanner";
import NotificationCenter from "../NotificationCenter";

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

  // Auth guard: redirect to login if no user (unless on auth pages)
  useEffect(() => {
    if (!user && !pathname.includes("/login") && !pathname.includes("/register") && !pathname.includes("/forgot-password") && !pathname.includes("/reset-password") && !pathname.includes("/mastermind")) {
      router.replace("/login");
    }
  }, [user, pathname, router]);

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
    if (auth) {
      try {
        await signOut(auth);
      } catch {
        // Ignore Firebase sign-out errors and continue clearing local session.
      }
    }
    clearUser();
    toast({
      description: "تم تسجيل الخروج بنجاح",
      variant: "default",
    });
    router.push("/login");
  }, [router, toast, clearUser]);

  return (
    <section
      className="min-h-screen bg-gray-50 dark:bg-slate-950"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <a href="#main-content" className="skip-to-content" aria-label="تخطي إلى المحتوى الرئيسي">
        تخطي إلى المحتوى
      </a>
      <TopLoadingBar />
      <ScrollProgress />
      <OfflineBanner />

      <nav
        className="fixed top-0 z-[49] w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
        aria-label="الرأس"
      >
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
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                Trax
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center gap-2 md:gap-3 md:border-l dark:border-slate-700 md:ps-4">
              <div className="hidden md:flex items-center gap-2">
                <span
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full border font-medium uppercase",
                    role === "employee"
                      ? "border-slate-300 text-slate-500 dark:border-slate-600 dark:text-slate-400"
                      : "border-primaryColor text-primaryColor dark:border-blue-400 dark:text-blue-400"
                  )}
                >
                  {role === "employee" ? "Staff" : "Company"}
                </span>
                <ThemeToggle />
              </div>
              <NotificationCenter />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryColor"
                    aria-label="قائمة المستخدم"
                  >
                    <UserAvatar user={user} className="w-8 h-8" />
                    <span className="hidden md:inline text-sm font-medium text-gray-700 dark:text-slate-200">
                      {user?.name || "المستخدم"}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
                      {user?.name || "المستخدم"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                      {user?.email || ""}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  {role !== "employee" && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/settings" className="cursor-pointer flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          الإعدادات
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/employees" className="cursor-pointer flex items-center gap-2">
                          <UserIcon className="w-4 h-4" />
                          الموظفون
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem
                    onClick={logOut}
                    className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/20 cursor-pointer"
                  >
                    <Logout className="w-4 h-4 me-2" />
                    تسجيل الخروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
      </nav>

      {showSidebar && isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {showSidebar && (
        <aside
          id="logo-sidebar"
          className={cn(
            "fixed top-0 z-40 w-64 h-screen pt-20 transition-transform bg-white dark:bg-slate-900 border-e border-gray-200 dark:border-slate-800 lg:translate-x-0",
            locale === "ar"
              ? isSidebarOpen
                ? "translate-x-0"
                : "translate-x-full"
              : isSidebarOpen
                ? "translate-x-0"
                : "-translate-x-full"
          )}
        >
          <div className="h-full px-3 pb-4 flex flex-col justify-between">
            <NavMain
              items={
                role === "employee"
                  ? [
                      {
                        title: "تسجيل الحضور",
                        url: "/check-in",
                        icon: CheckCircle,
                        isActive: pathname.includes("/check-in"),
                      },
                    ]
                  : [
                      {
                        title: "لوحة التحكم",
                        url: "/",
                        icon: Category,
                        isActive: pathname === "/",
                      },
                      {
                        title: "الموظفون",
                        url: "/employees",
                        icon: Profile,
                        isActive: pathname.includes("/employees"),
                      },
                      {
                        title: "تتبع مباشر",
                        url: "/live-map",
                        icon: Location,
                        isActive: pathname.includes("/live-map"),
                      },
                      {
                        title: "الحضور والانصراف",
                        url: "/attendance",
                        icon: ShieldTick,
                        isActive: pathname.includes("/attendance"),
                      },
                      {
                        title: "النطاقات الجغرافية",
                        url: "/geofences",
                        icon: Location,
                        isActive: pathname.includes("/geofences"),
                      },
                      {
                        title: "تسجيل الحضور",
                        url: "/check-in",
                        icon: CheckCircle,
                        isActive: pathname.includes("/check-in"),
                      },
                    ]
              }
            />
            <Button
              variant="ghost"
              className="w-full justify-start text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
              onClick={logOut}
            >
              <Logout className="me-2" /> تسجيل الخروج
            </Button>
          </div>
        </aside>
      )}

      <main
        id="main-content"
        tabIndex={-1}
        className={cn(
          "flex flex-col min-h-screen pt-16 md:pt-20 pb-24 lg:pb-6 px-4 md:px-8 max-w-7xl mx-auto transition-all scroll-mt-20 focus:outline-none",
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
