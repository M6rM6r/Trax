import { Category, Profile, Setting2, Star, UserTag } from "@/public/SVG";

export const useMainNavItems = ({ pathname }: { pathname: string }) => {
  return {
    user: {
      name: "shadcn",
      email: "m@example.com",
      avatar: "/avatars/shadcn.jpg",
    },
    navMain: [
      {
        title: "الصفحة الرئيسية",
        url: "/",
        icon: Category,
        isActive: pathname === "/",
      },
      {
        title: "العملاء",
        url: "#",
        icon: Profile,
        isActive: pathname.includes("/educationalContentManagment"),
      },
      {
        title: "السائقين",
        url: "#",
        icon: UserTag,
        isActive: pathname.includes("/drivers"),
        items: [
          {
            title: "جميع السائقين",
            url: "#",
            active: pathname === "#",
          },
          {
            title: "قواعد السائقين",
            url: "#",
            active: pathname === "#",
          },
          {
            title: "السائقون المحذوفون",
            url: "/drivers/deleted",
            active: pathname.includes("/drivers/deleted"),
          },
        ],
      },
      {
        title: "الخدمات",
        url: "#",
        icon: Star,
        isActive: pathname.includes("/order-management"),
      },
      {
        title: "إعددات عامة",
        url: "#",
        icon: Setting2,
        isActive: pathname.includes("/students"),
      },
    ],
  };
};
