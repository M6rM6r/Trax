"use client";
import { useState, useCallback, useMemo } from "react";
import { NavMain } from "@/components/Sidebar/nav-main";
import { usePathname, useRouter } from "next/navigation";
import {
  America,
  ArrowDown,
  Category,
  CheckCircle,
  CloseCircle,
  Logo,
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
import bill from "@/public/images/bill.jpg";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";
import Image from "next/image";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Link } from "@/i18n/navigation";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fetcherClient } from "@/lib/fetcherClient";
import { deleteCookie } from "cookies-next";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/useAuthStore";
import UserAvatar from "../Avatar";

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
  const { toast } = useToast();
  const router = useRouter();

  const { user, role, clearUser } = useAuthStore();

  // Memoized callback for sidebar toggle
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

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

  const towing = false;
  return (
    <section>
      <nav className="fixed top-0 z-[49] w-full bg-white ">
        <header className=" flex items-center flex-wrap gap-x-5 md:gap-5 p-5 border-b border-b-gray-200 relative ">
          {/* Menu Icon with onClick handler */}
          <Menu
            className="w-5 text-gray900 lg:hidden me-auto md:me-0 cursor-pointer"
            onClick={toggleSidebar} // Toggle sidebar on click
          />
          <Link href="/">
            <Logo className="w-[120px] md:w-auto" />
          </Link>
          <div className="hidden md:flex items-center gap-3 me-auto">
            <UserAvatar user={user} />
            <div>
              <p className="text-20 text-black font-[600]"> {user?.name}</p>
              <p className="text-16 text-gray500">
                {role === "employee" ? "موظف" : "المدير"}
              </p>
            </div>
          </div>
          <div className="grow xxsm:max-w-[260px] xsm:max-w-[300px] sm:max-w-[400px] bg-gray-50 border border-gray300 rounded-12 h-[43px] flex items-center md:hidden px-3">
            <Search />
            <input
              type="text"
              className="w-full h-full px-3 outline-none "
              placeholder="بحث"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild disabled>
              <button className=" relative cursor-not-allowed">
                <span className="w-[12px] h-[12px] bg-error rounded-full border border-white absolute top-0 right-0"></span>
                <Notification />
              </button>
            </PopoverTrigger>
            <PopoverContent className=" max-w-[372px] max-h-[500px] rounded-12 p-0 overflow-auto hideScrollbar">
              <div className=" flex items-center justify-between gap-5 py-4 px-6 ">
                <p className="text-16 text-textMain font-[600]">الإشعارات</p>
                <button className="text-14 text-primaryColor">
                  تحديد الكل كمقروء
                </button>
              </div>
              <Separator className="h-[1px]" />
              <div className=" py-8 px-6 flex flex-col gap-4">
                <p className="text-12 text-textSubText">اليوم</p>
                <div className=" flex items-center gap-5">
                  <CheckCircle />
                  <div>
                    <p className="text-14 text-textMain">هذه إشعار نجاح.</p>
                    <p className="text-14 text-gray500"> min ago 5</p>
                  </div>
                </div>
                <div className=" flex items-center gap-5">
                  <Warning />
                  <div>
                    <p className="text-14 text-textMain">
                      تم حظر المستخدم بنجاح.
                    </p>
                    <p className="text-14 text-gray500"> min ago 5</p>
                  </div>
                </div>
                <div className=" flex items-center gap-5">
                  <Notepad />
                  <div>
                    <p className="text-14 text-textMain">
                      تم تحديث خطة التسعير الخاصة بالعميل.
                    </p>
                    <p className="text-14 text-gray500"> min ago 5</p>
                  </div>
                </div>
                <p className="text-12 text-textSubText">أمس</p>
                {Array.from({ length: 5 }, (_, index) => (
                  <div key={index} className=" flex items-center gap-5">
                    <Notepad />
                    <div>
                      <p className="text-14 text-textMain">
                        تم تحديث خطة التسعير الخاصة بالعميل.
                      </p>
                      <p className="text-14 text-gray500"> min ago 5</p>
                    </div>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <div className=" hidden md:block">
            <Popover>
              <PopoverTrigger className=" flex items-center gap-2 cursor-not-allowed" disabled>
                <SaudiFlag className="w-[33px] h-[24px]" />
                <span className="text-20 text-black">العربية</span>
                <ArrowDown />
              </PopoverTrigger>
              <PopoverContent className="max-w-[180px] flex flex-col gap-5">
                <Link href={"/"} locale="ar" className="flex gap-2">
                  <SaudiFlag className="w-[33px] h-[24px]" />
                  <span className="text-20 text-black">العربية</span>
                </Link>
                <Link href={"/"} locale="en" className="flex gap-2">
                  <America className="w-[33px] h-[24px]" />
                  <span className="text-20 text-black">الانجليزيه</span>
                </Link>
              </PopoverContent>
            </Popover>
          </div>
        </header>
      </nav>

      {showSidebar && (
        <aside
          id="logo-sidebar"
          className={cn(
            `fixed top-0 ${locale === "ar"
              ? "right-0 translate-x-full lg:translate-x-0"
              : "left-0 -translate-x-full lg:translate-x-0"
            } z-40 w-64 h-screen pt-[11rem] lg:pt-[7rem] transition-transform bg-white border-l border-gray-200`,
            isSidebarOpen && "translate-x-0" // Show sidebar when isSidebarOpen is true
          )}
          aria-label="Sidebar"
        >
          <div className="h-full px-3 pb-4 overflow-y-auto bg-white flex flex-col gap-2 ">
            <NavMain
              items={role === "employee" ? [
                {
                  title: "تسجيل الحضور",
                  url: `/${locale}/check-in`,
                  icon: CheckCircle,
                  isActive: pathname.includes("/check-in"),
                },
              ] : [
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
                  title: "إعددات عامة",
                  url: `#`,
                  icon: Setting2,
                  isActive: pathname.includes(`/settings`),
                  items: [
                    {
                      title: "إعدادات الأمان",
                      url: `/${locale}/settings/securitySettings`,
                      active:
                        pathname === `/${locale}/settings/securitySettings`,
                    },
                    {
                      title: "إعدادات الإشعارات",
                      url: `/${locale}/settings/notificationSettings`,
                      active:
                        pathname === `/${locale}/settings/notificationSettings`,
                    },
                  ],
                },
              ]}
            />
            <Dialog>
              <DialogTrigger className=" w-full shrink-0 h-[48px] flex items-center gap-1.5 bg-error50 rounded-6 px-3 text-16 text-error font-[600]">
                <Logout />
                تسجيل الخروج
              </DialogTrigger>
              <DialogContent className=" max-w-[516px] p-6 rounded-16 flex flex-col ">
                <DialogClose className=" absolute top-6 left-6">
                  <CloseCircle />
                </DialogClose>
                <Image
                  src={bill}
                  alt="bill"
                  className=" mx-auto w-[128px] h-[141px] mb-8"
                />
                <p className="text-24 text-textMain font-[600] text-center">
                  هل أنت متأكد أنك تريد تسجيل الخروج؟
                </p>
                <p className="text-20 text-textSubTextDarker text-center">
                  هل أنت متأكد أنك تريد تسجيل الخروج؟ قد تفقد أي تغييرات غير
                  محفوظة.
                </p>
                <div className=" flex w-full gap-4">
                  <DialogClose asChild>
                    <Button
                      type="button"
                      variant={"errorOutline"}
                      className="grow bg-error50 border-none"
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
        className={cn(
          "p-4 pt-[10rem] md:pt-[7.5rem]   flex flex-col gap-5",
          showSidebar && "lg:ms-64"
        )}
      >
        {children}
      </div>
    </section>
  );
};

export default Index;
