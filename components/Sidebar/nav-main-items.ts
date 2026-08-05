import { Category, Profile, ShieldTick, Location, CheckCircle, Setting2 } from "@/public/SVG";
import { useTranslations } from "next-intl";
import { canRoleAccessPath, isEmployeeRole, isMastermindRole } from "@/lib/utils/roleAccess";
import type { UserRole } from "@/stores/useAuthStore";

export const useMainNavItems = ({
  pathname,
  role,
}: {
  pathname: string;
  role?: UserRole | string | null;
}) => {
  const t = useTranslations("Navigation");
  const appRole = (role as UserRole | null) ?? null;

  // MasterMind uses its own shell — no company sidebar chrome.
  if (isMastermindRole(appRole)) {
    return {
      user: { name: "MasterMind", email: "", avatar: "/avatars/shadcn.jpg" },
      navMain: [
        {
          title: t("companies"),
          url: "/mastermind/companies",
          icon: Category,
          isActive: pathname.includes("/mastermind"),
        },
      ],
    };
  }

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
    if (item.url === "/live-map") return false; // map lives on dashboard widget
    return canRoleAccessPath(appRole, item.url);
  });

  // Employee: check-in only (already filtered); company: no check-in.
  if (isEmployeeRole(appRole) && navMain.every((i) => i.url !== "/check-in")) {
    navMain.push({
      title: t("checkIn"),
      url: "/check-in",
      icon: CheckCircle,
      isActive: pathname.includes("/check-in"),
    });
  }

  return {
    user: {
      name: "shadcn",
      email: "m@example.com",
      avatar: "/avatars/shadcn.jpg",
    },
    navMain,
  };
};
