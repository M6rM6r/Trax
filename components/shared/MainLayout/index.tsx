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
  Complaints,
  Driving,
  Logo,
  Logout,
  Menu,
  Notepad,
  Notification,
  Profile,
  Routing,
  SaudiFlag,
  Search,
  Setting2,
  Shapes,
  ShieldTick,
  Star,
  UserTag,
  Warning,
  Rewards,
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

  const { user } = useAuthStore();

  // Memoized callback for sidebar toggle
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  // Memoized callback for logout
  const logOut = useCallback(async () => {
    try {
      const response = await fetcherClient<any>("/logout");
      deleteCookie("auth_token");
      toast({
        description: response.message,
        variant: "default",
      });
      router.push(`/${locale}/login`);
    } catch (error: unknown) { }
  }, [locale, router, toast]);

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
                {user?.role ?? "المشرف التنفيذى"}
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
              items={[
                {
                  title: "الصفحة الرئيسية",
                  url: "/",
                  icon: Category,
                  isActive: pathname === `/${locale}`,
                },
                {
                  title: "العملاء",
                  url: `/${locale}/customers`,
                  icon: Profile,
                  isActive: pathname.includes("/customers"),
                  items: [
                    {
                      title: "جميع العملاء",
                      url: `/${locale}/customers`,
                      active: pathname === `/${locale}/customers`,
                    },
                    {
                      title: "العملاء الموقوفون",
                      url: `/${locale}/customers/blocked`,
                      active:
                        pathname === `/${locale}/customers/blocked` ||
                        pathname === `/${locale}/customers/deleted`,
                    },
                    {
                      title: "الإحصائيات",
                      url: `/${locale}/customers/analytics`,
                      active: pathname === `/${locale}/customers/analytics`,
                    },
                  ],
                },
                {
                  title: "السائقين",
                  url: `/${locale}/drivers`,
                  icon: UserTag,
                  isActive: pathname.includes("/drivers"),
                  items: [
                    {
                      title: "جميع السائقين",
                      url: `/${locale}/drivers`,
                      active: pathname === `/${locale}/drivers`,
                    },
                    {
                      title: "قواعد السائقين",
                      url: `/${locale}/drivers/rules`,
                      active: pathname === `/${locale}/drivers/rules`,
                    },
                    {
                      title: "السائقون الموقفون",
                      url: `/${locale}/drivers/blocked`,
                      active:
                        pathname === `/${locale}/drivers/blocked` ||
                        pathname === `/${locale}/drivers/deleted`,
                    },
                    {
                      title: "الإحصائيات",
                      url: `/${locale}/drivers/analytics`,
                      active: pathname === `/${locale}/drivers/analytics`,
                    },
                  ],
                },
                {
                  title: "الخدمات",
                  url: `#`,
                  icon: Star,
                  isActive: pathname.includes("/services"),
                  items: [
                    {
                      title: "سيارة تاكسي",
                      url: `/${locale}/services/taxi`,
                      active: pathname === `/${locale}/services/taxi`,
                    },
                    {
                      title: "مواعيد مهمة",
                      url: `/${locale}/services/important_dates`,
                      active:
                        pathname === `/${locale}/services/important_dates`,
                    },
                    {
                      title: "النقل الخفيف",
                      url: `/${locale}/services/light_transportation`,
                      active:
                        pathname === `/${locale}/services/light_transportation`,
                    },
                    {
                      title: "سطحات ودينات ",
                      url: `/${locale}/services/wensh`,
                      active: pathname === `/${locale}/services/wensh`,
                    },
                    {
                      title: "وايت ماء",
                      url: `/${locale}/services/fontas`,
                      active: pathname === `/${locale}/services/fontas`,
                    },
                    {
                      title: "سائق بدون سيارة",
                      url: `/${locale}/services/driver_without_car`,
                      active:
                        pathname === `/${locale}/services/driver_without_car`,
                    },
                    {
                      title: "العطالات",
                      url: `/${locale}/services/outages/fuel/settings`,
                      active: pathname.includes("/services/fast_support"),
                      items: [
                        {
                          title: "الوقود",
                          url: `/${locale}/services/outages/fuel/settings`,
                          active: pathname.includes("/services/outages/fuel"),
                        },
                        {
                          title: "الإطارات",
                          url: `/${locale}/services/outages/tires/settings`,
                          active: pathname.includes("/services/outages/tires"),
                        },
                        {
                          title: "العالقين فى الرمال",
                          url: `/${locale}/services/outages/towing/settings`,
                          active: pathname.includes("/services/outages/towing"),
                        },
                        {
                          title: "الإحصائيات  ",
                          url: `/${locale}/services/outages/analytics`,
                          active: pathname.includes(
                            "/services/outages/analytics"
                          ),
                        },
                      ],
                    },
                    {
                      title: "الإحصائيات",
                      url: `/${locale}/services/analytics`,
                      active: pathname.includes("/services/analytics"),
                    },
                  ],
                },
                {
                  title: "الرحلات",
                  url: `/${locale}/trips`,
                  icon: Routing,
                  isActive: pathname.includes("/trips"),
                  items: [
                    {
                      title: "جميع الرحلات",
                      url: `/${locale}/trips`,
                      active: pathname === `/${locale}/trips`,
                    },
                    {
                      title: " الإحصائيات",
                      url: `/${locale}/trips/analytics`,
                      active: pathname === `/${locale}/trips/analytics`,
                    },
                  ],
                },
                {
                  title: "صلاحيات المشرفين",
                  url: `#`,
                  icon: ShieldTick,
                  isActive:
                    pathname.includes("/moderators") ||
                    pathname.includes("/roles") ||
                    pathname.includes("/categories") ||
                    pathname.includes("/complaintsTeam"),
                  items: [
                    {
                      title: "المشرفين",
                      url: `/${locale}/moderators`,
                      active: pathname === `/${locale}/moderators`,
                    },
                    {
                      title: "الأدوار",
                      url: `/${locale}/roles`,
                      active: pathname === `/${locale}/roles`,
                    },
                    {
                      title: "التصنيفات",
                      url: `/${locale}/categories`,
                      active: pathname === `/${locale}/categories`,
                    },
                    {
                      title: "إدارة فرق الشكاوى",
                      url: `/${locale}/complaintsTeam`,
                      active: pathname === `/${locale}/complaintsTeam`,
                    },
                  ],
                },
                {
                  title: "بيانات المركبات",
                  url: `#`,
                  icon: Driving,
                  isActive: pathname.includes("/vehicles"),
                  items: [
                    {
                      title: "ماركة السيارة",
                      url: `/${locale}/vehicles/brands`,
                      active: pathname === `/${locale}/vehicles/brands`,
                    },
                    {
                      title: "موديلات السيارة",
                      url: `/${locale}/vehicles/models`,
                      active: pathname === `/${locale}/vehicles/models`,
                    },
                    {
                      title: "موديلات غير موجودة",
                      url: `/${locale}/vehicles/modelsNotAvailable`,
                      active:
                        pathname === `/${locale}/vehicles/modelsNotAvailable`,
                    },
                    {
                      title: "وحدات الفونتاس",
                      url: `/${locale}/vehicles/units`,
                      active: pathname === `/${locale}/vehicles/units`,
                    },
                    {
                      title: "الألوان",
                      url: `/${locale}/vehicles/colors`,
                      active: pathname === `/${locale}/vehicles/colors`,
                    },
                  ],
                },
                {
                  title: "إدارة الشكاوى",
                  url: `#`,
                  icon: Complaints,
                  isActive: pathname.includes("/complaintsManagement"),
                  items: [
                    {
                      title: "الشكاوى",
                      url: `/${locale}/complaintsManagement/complaints`,
                      active:
                        pathname ===
                        `/${locale}/complaintsManagement/complaints`,
                    },
                    {
                      title: "العملاء",
                      url: `/${locale}/complaintsManagement/customers`,
                      active:
                        pathname ===
                        `/${locale}/complaintsManagement/customers`,
                    },
                    {
                      title: "السائقين",
                      url: `/${locale}/complaintsManagement/drivers`,
                      active:
                        pathname === `/${locale}/complaintsManagement/drivers`,
                    },
                    {
                      title: "إدارة تصنيفات الشكاوى",
                      url: `/${locale}/complaintsManagement/categories`,
                      active:
                        pathname ===
                        `/${locale}/complaintsManagement/categories`,
                    },
                    {
                      title: "إدراة الإجراءات",
                      url: `/${locale}/complaintsManagement/actions`,
                      active:
                        pathname === `/${locale}/complaintsManagement/actions`,
                    },
                  ],
                },

                // Rewards
                {
                  title: "الدعوات والمكآفأت",
                  url: `#`,
                  icon: Rewards,
                  isActive: pathname.includes("/inviteRewards"),
                  items: [
                    {
                      title: "الإحصائيات",
                      url: `/${locale}/inviteRewards/stats`,
                      active: pathname === `/${locale}/inviteRewards/stats`,
                    },
                    {
                      title: "المستخدمين",
                      url: `/${locale}/inviteRewards/users`,
                      active: pathname === `/${locale}/inviteRewards/users`,
                    },

                    {
                      title: "الإعدادات",
                      url: `/${locale}/inviteRewards/settings`,
                      active: pathname === `/${locale}/inviteRewards/settings`,
                    },
                  ],
                },
                {
                  title: "إدارة التطبيقات",
                  url: `#`,
                  icon: Shapes,
                  isActive: pathname.includes("/apps"),
                  items: [
                    {
                      title: "الصفحات",
                      url: `/${locale}/apps/pages`,
                      active: pathname === `/${locale}/apps/pages`,
                    },
                    {
                      title: "اللافتات",
                      url: `/${locale}/apps/banners`,
                      active: pathname === `/${locale}/apps/banners`,
                    },
                    {
                      title: "سجلات النشاط",
                      url: `/${locale}/apps/logs`,
                      active: pathname === `/${locale}/apps/logs`,
                    },
                    {
                      title: "إشعارات",
                      url: `/${locale}/apps/notifications/add`,
                      active: pathname === `/${locale}/apps/notifications`,
                    },
                    {
                      title: "موقع الويب الخارجي",
                      url: `/${locale}/apps/companyWebsite`,
                      active: pathname === `/${locale}/apps/companyWebsite`,
                    },
                    {
                      title: "أسباب الإلغاء",
                      url: `/${locale}/apps/cancellationReasons`,
                      active: pathname === `/${locale}/apps/cancellationReasons`,
                    },
                  ],
                },
                {
                  title: "متطلبات وزارة النقل",
                  url: `#`,
                  icon: ShieldTick,
                  isActive: pathname.includes("/ministryRequirements"),
                  items: [
                    {
                      title: "المتوسط الشهري للإنتظار",
                      url: `/${locale}/ministryRequirements/monthlyWaitingAverage`,
                      active:
                        pathname ===
                        `/${locale}/ministryRequirements/monthlyWaitingAverage`,
                    },
                  ],
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
