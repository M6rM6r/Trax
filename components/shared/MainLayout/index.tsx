"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { NavMain } from "@/components/Sidebar/nav-main";
import { usePathname, useRouter } from "next/navigation";
import {
  America,
  ArrowDown,
  Category,
  CheckCircle,
  CloseCircle,
  Logout,
  Menu,
  Notepad,
  Notification,
  Profile,
  SaudiFlag,
  Search,
  Setting2,
  ShieldTick,
  Warning,
  Location,
} from "@/public/SVG";
import { MapPin } from "lucide-react";
import bill from "@/public/images/bill.jpg";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Link } from "@/i18n/navigation";
import { Separator } from "@/components/ui/separator";
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
import { OnboardingTour } from "../OnboardingTour";
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State to manage sidebar visibility
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

  // Memoized callback for sidebar toggle
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

  // Memoized callback for logout
  const logOut = useCallback(async () => {
    deleteCookie("auth_token");
    clearUser();
    toast({
      description: "تم تسجيل الخروج بنجاح",
      variant: "default",
    });
    router.push(`/${locale}/login`);
  }, [locale, router, toast, clearUser]);

  return (
    <section>
      <TopLoadingBar />
      <ScrollProgress />
      <OfflineBanner />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg"
      >
        تخطي إلى المحتوى الرئيسي
      </a>
      <nav className="fixed top-0 z-[49] w-full bg-background dark:bg-slate-900" aria-label="الرأس">
        <header className=" flex items-center flex-wrap gap-x-3 md:gap-5 p-3 md:p-5 border-b border-b-gray-200 dark:border-b-slate-700 relative">
          {/* Menu Icon with onClick handler */}
          <Menu
            className="w-5 text-gray900 dark:text-slate-100 lg:hidden me-auto md:me-0 cursor-pointer"
            onClick={toggleSidebar}
            aria-label="فتح/إغلاق القائمة"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleSidebar();
              }
            }}
          />
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <MapPin className="w-7 h-7 text-primaryColor" />
            <span className="text-xl font-bold text-gray-900 dark:text-slate-100">Trax</span>
          </Link>
          <div className="hidden md:flex items-center gap-3 me-auto">
            <UserAvatar user={user} />
            <div>
              <p className="text-20 text-black dark:text-slate-100 font-[600]"> {user?.name}</p>
              <p className="text-16 text-gray500 dark:text-slate-400">
                {role === "employee" ? "موظف" : "المدير"}
              </p>
            </div>
          </div>
          <div className="grow xxsm:max-w-[220px] xsm:max-w-[260px] sm:max-w-[320px] bg-gray-50 dark:bg-slate-800 border border-gray300 dark:border-slate-600 rounded-12 h-[38px] flex items-center md:hidden px-3">
            <Search />
            <input
              type="text"
              className="w-full h-full px-3 outline-none dark:text-slate-100 dark:placeholder-slate-500"
              placeholder="بحث"
              aria-label="بحث"
            />
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400 rounded">
              ⌘K
            </kbd>
          </div>
          <NotificationCenter />

          <div className=" hidden md:block">
            <ThemeToggle />
            <Popover>
              <PopoverTrigger
                className=" flex items-center gap-2 cursor-not-allowed"
                disabled
                aria-label="تغيير اللغة"
              >
                <SaudiFlag className="w-[33px] h-[24px]" />
                <span className="text-20 text-black dark:text-slate-100">العربية</span>
                <ArrowDown />
              </PopoverTrigger>
              <PopoverContent className="max-w-[180px] flex flex-col gap-5 dark:bg-slate-800 dark:border-slate-700">
                <Link href={"/"} locale="ar" className="flex gap-2">
                  <SaudiFlag className="w-[33px] h-[24px]" />
                  <span className="text-20 text-black dark:text-slate-100">العربية</span>
                </Link>
                <Link href={"/"} locale="en" className="flex gap-2">
                  <America className="w-[33px] h-[24px]" />
                  <span className="text-20 text-black dark:text-slate-100">الانجليزيه</span>
                </Link>
              </PopoverContent>
            </Popover>
          </div>
        </header>
      </nav>

      {showSidebar && isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {showSidebar && (
        <aside
          id="logo-sidebar"
          aria-label="القائمة الجانبية"
          className={cn(
            `fixed top-0 ${
              locale === "ar"
                ? "right-0 translate-x-full lg:translate-x-0"
                : "left-0 -translate-x-full lg:translate-x-0"
            } z-40 w-64 h-screen pt-[11rem] lg:pt-[7rem] transition-transform duration-300 ease-in-out bg-background dark:bg-slate-900 border-l border-gray-200 dark:border-slate-700`,
            isSidebarOpen && "translate-x-0" // Show sidebar when isSidebarOpen is true
          )}
        >
          <div className="h-full px-3 pb-4 overflow-y-auto bg-background dark:bg-slate-900 flex flex-col gap-2 ">
            <NavMain
              items={
                role === "employee"
                  ? [
                      {
                        title: "تسجيل الحضور",
                        url: `/${locale}/check-in`,
                        icon: CheckCircle,
                        isActive: pathname.includes("/check-in"),
                      },
                    ]
                  : [
                      {
                        title: "لوحة التحكم",
                        url: "/",
                        icon: Category,
                        isActive: pathname === `/${locale}`,
                      },
                      {
                        title: "الموظفون",
                        url: `/${locale}/employees`,
                        icon: Profile,
                        isActive: pathname.includes("/employees"),
                        items: [
                          {
                            title: "جميع الموظفين",
                            url: `/${locale}/employees`,
                            active: pathname === `/${locale}/employees`,
                          },
                          {
                            title: "الموظفون غير النشطين",
                            url: `/${locale}/employees/inactive`,
                            active: pathname === `/${locale}/employees/inactive`,
                          },
                        ],
                      },
                      {
                        title: "تتبع مباشر",
                        url: `/${locale}/live-map`,
                        icon: Location,
                        isActive: pathname.includes("/live-map"),
                      },
                      {
                        title: "الحضور والانصراف",
                        url: `/${locale}/attendance`,
                        icon: ShieldTick,
                        isActive: pathname.includes("/attendance"),
                        items: [
                          {
                            title: "سجلات اليوم",
                            url: `/${locale}/attendance`,
                            active: pathname === `/${locale}/attendance`,
                          },
                          {
                            title: "التقارير",
                            url: `/${locale}/attendance/reports`,
                            active: pathname === `/${locale}/attendance/reports`,
                          },
                        ],
                      },
                      {
                        title: "النطاقات الجغرافية",
                        url: `/${locale}/geofences`,
                        icon: Location,
                        isActive: pathname.includes("/geofences"),
                      },
                      {
                        title: "تسجيل الحضور",
                        url: `/${locale}/check-in`,
                        icon: CheckCircle,
                        isActive: pathname.includes("/check-in"),
                      },
                      {
                        title: "الإعدادات",
                        url: `/${locale}/settings`,
                        icon: Setting2,
                        isActive: pathname.includes(`/settings`),
                        items: [
                          {
                            title: "إعدادات الأمان",
                            url: `/${locale}/settings/securitySettings`,
                            active: pathname === `/${locale}/settings/securitySettings`,
                          },
                          {
                            title: "إعدادات الإشعارات",
                            url: `/${locale}/settings/notificationSettings`,
                            active: pathname === `/${locale}/settings/notificationSettings`,
                          },
                        ],
                      },
                    ]
              }
            />
            <Dialog>
              <DialogTrigger
                className=" w-full shrink-0 h-[48px] flex items-center gap-1.5 bg-error50 dark:bg-red-900/20 rounded-6 px-3 text-16 text-error dark:text-red-400 font-[600]"
                aria-label="تسجيل الخروج"
              >
                <Logout />
                تسجيل الخروج
              </DialogTrigger>
              <DialogContent className=" max-w-[516px] p-6 rounded-16 flex flex-col dark:bg-slate-800 dark:border-slate-700">
                <DialogClose className=" absolute top-6 left-6">
                  <CloseCircle />
                </DialogClose>
                <Image src={bill} alt="bill" className=" mx-auto w-[128px] h-[141px] mb-8" />
                <p className="text-24 text-textMain dark:text-slate-100 font-[600] text-center">
                  هل أنت متأكد أنك تريد تسجيل الخروج؟
                </p>
                <p className="text-20 text-textSubTextDarker dark:text-slate-400 text-center">
                  هل أنت متأكد أنك تريد تسجيل الخروج؟ قد تفقد أي تغييرات غير محفوظة.
                </p>
                <div className=" flex w-full gap-4">
                  <DialogClose asChild>
                    <Button
                      type="button"
                      variant={"errorOutline"}
                      className="grow bg-error50 dark:bg-red-900/20 border-none"
                      onClick={logOut}
                    >
                      تأكيد تسجيل الخروج
                    </Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button type="button" variant={"error"} className="grow ">
                      إلغاء
                    </Button>
                  </DialogClose>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </aside>
      )}

      <div
        id="main-content"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "p-3 md:p-4 pt-[8rem] sm:pt-[9rem] md:pt-[7.5rem] pb-20 lg:pb-4 flex flex-col gap-4 sm:gap-5",
          showSidebar && "lg:ms-64"
        )}
      >
        <Breadcrumb />
        <PageTransition>{children}</PageTransition>
        <MobileBottomNav />
      </div>
      <CommandPalette />
      <OnboardingTour />
      <ShortcutsHelp />
    </section>
  );
};

export default Index;
