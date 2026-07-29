import { Category, Profile, ShieldTick, Location, CheckCircle, Setting2 } from "@/public/SVG";
import { useTranslations } from "next-intl";

export const useMainNavItems = ({ pathname, role }: { pathname: string; role?: string | null }) => {
  const t = useTranslations("Navigation");
  const isEmployee = role === "employee";

  const navMain = [
    {
      title: t("dashboard"),
      url: "/",
      icon: Category,
      isActive: pathname === "/",
    },
    {
      title: t("employees"),
      url: "/employees",
      icon: Profile,
      isActive: pathname.includes("/employees"),
    },
    {
      title: t("liveMap"),
      url: "/live-map",
      icon: Location,
      isActive: pathname.includes("/live-map"),
    },
    {
      title: t("attendance"),
      url: "/attendance",
      icon: ShieldTick,
      isActive: pathname.includes("/attendance"),
    },
    {
      title: t("geofences"),
      url: "/geofences",
      icon: Location,
      isActive: pathname.includes("/geofences"),
    },
    {
      title: t("checkIn"),
      url: "/check-in",
      icon: CheckCircle,
      isActive: pathname.includes("/check-in"),
    },
    {
      title: t("settings"),
      url: "/settings",
      icon: Setting2,
      isActive: pathname.includes("/settings"),
    },
  ].filter((item) => {
    if (item.url === "/live-map") return false;
    if (item.url === "/check-in") return isEmployee;
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
