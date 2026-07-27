import { Category, Profile, ShieldTick, Location, CheckCircle } from "@/public/SVG";
import { Settings as Setting2 } from "lucide-react";

export const useMainNavItems = ({
  pathname,
  role,
}: {
  pathname: string;
  role?: string | null;
}) => {
  const isEmployee = role === "employee";

  const navMain = [
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
    {
      title: "الإعدادات",
      url: "/settings",
      icon: Setting2,
      isActive: pathname.includes("/settings"),
    },
  ].filter((item) => {
    if (item.url === "/live-map") return false;
    if (item.url === "/check-in") return isEmployee;
    if (item.url === "/settings") return !isEmployee;
    return true;
  });

  return {
    user: {
      name: "shadcn",
      email: "m@example.com",
      avatar: "/avatars/shadcn.jpg",
    },
    navMain,
  };
};
