"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { Command } from "cmdk";
import {
  LayoutDashboard,
  Users,
  MapPin,
  Calendar,
  CheckCircle,
  UserX,
  FileText,
  Shield,
  Bell,
  LogOut,
  Search,
  UserCircle,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/config/firebase";
import { hapticTap } from "@/lib/utils/haptics";
import { useEmployees } from "@/hooks/useApi";
import { useTranslations } from "next-intl";

interface CommandItem {
  id: string;
  label: string;
  icon: React.ElementType;
  shortcut?: string;
  action: () => void;
  group: string;
}

export function CommandPalette() {
  const t = useTranslations("Navigation");
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const clearUser = useAuthStore((s) => s.clearUser);
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.role);
  const isEmployee = role === "employee";
  const isCompany = role === "company";
  const isMastermind = role === "mastermind";
  const { data: employees = [] } = useEmployees({
    enabled: open && !!token && isCompany,
  });

  const handleLogout = useCallback(async () => {
    if (auth) {
      try {
        await signOut(auth);
      } catch {}
    }
    clearUser();
    router.push("/login");
  }, [router, clearUser]);

  const navigate = useCallback(
    (path: string) => {
      hapticTap();
      router.push(path);
      setOpen(false);
    },
    [router]
  );

  // Commands are role-scoped: mastermind | company | employee only.
  const commands: CommandItem[] = [
    ...(isCompany
      ? [
          ...employees.slice(0, 10).map((emp) => ({
            id: `emp-${emp.id}`,
            label: emp.name,
            icon: UserCircle,
            action: () => navigate(`/employees`),
            group: t("employees"),
          })),
          {
            id: "dashboard",
            label: t("dashboard"),
            icon: LayoutDashboard,
            action: () => navigate("/"),
            group: t("navigation"),
          },
          {
            id: "employees",
            label: t("employees"),
            icon: Users,
            action: () => navigate(`/employees`),
            group: t("navigation"),
          },
          {
            id: "employees-inactive",
            label: t("employeeInactive"),
            icon: UserX,
            action: () => navigate(`/employees/inactive`),
            group: t("navigation"),
          },
          {
            id: "live-map",
            label: t("liveMap"),
            icon: MapPin,
            action: () => navigate(`/live-map`),
            group: t("navigation"),
          },
          {
            id: "attendance",
            label: t("attendance"),
            icon: Calendar,
            action: () => navigate(`/attendance`),
            group: t("navigation"),
          },
          {
            id: "attendance-reports",
            label: t("attendanceReports"),
            icon: FileText,
            action: () => navigate(`/attendance/reports`),
            group: t("navigation"),
          },
          {
            id: "geofences",
            label: t("geofences"),
            icon: MapPin,
            action: () => navigate(`/geofences`),
            group: t("navigation"),
          },
          {
            id: "settings-security",
            label: t("securitySettings"),
            icon: Shield,
            action: () => navigate(`/settings/securitySettings`),
            group: t("settings"),
          },
          {
            id: "settings-notifications",
            label: t("notificationSettings"),
            icon: Bell,
            action: () => navigate(`/settings/notificationSettings`),
            group: t("settings"),
          },
        ]
      : []),
    ...(isEmployee
      ? [
          {
            id: "check-in",
            label: t("checkIn"),
            icon: CheckCircle,
            action: () => navigate(`/check-in`),
            group: t("navigation"),
          } satisfies CommandItem,
          {
            id: "settings-security",
            label: t("securitySettings"),
            icon: Shield,
            action: () => navigate(`/settings/securitySettings`),
            group: t("settings"),
          },
        ]
      : []),
    ...(isMastermind
      ? [
          {
            id: "mm-companies",
            label: t("companies"),
            icon: LayoutDashboard,
            action: () => navigate(`/mastermind/companies`),
            group: t("navigation"),
          } satisfies CommandItem,
        ]
      : []),
    {
      id: "logout",
      label: t("logout"),
      icon: LogOut,
      action: () => {
        hapticTap();
        handleLogout();
        setOpen(false);
      },
      group: t("actions"),
    },
  ];

  useEffect(() => {
    const handler = () => setOpen((prev) => !prev);
    window.addEventListener("toggle-command-palette", handler);
    return () => window.removeEventListener("toggle-command-palette", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const groups = Array.from(new Set(commands.map((c) => c.group)));

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] px-4"
      onClick={() => setOpen(false)}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative w-full max-w-xl bg-card rounded-2xl shadow-lg border border-border overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="flex flex-col" role="dialog" aria-label={t("commandPalette")}>
          <div className="flex items-center gap-3 px-4 border-b border-border">
            <Search className="w-4 h-4 text-muted-foreground/70 shrink-0" />
            <Command.Input
              placeholder={t("searchCommand")}
              className="w-full bg-transparent py-4 outline-none text-sm text-foreground placeholder:text-muted-foreground/70 dark:placeholder:text-muted-foreground/70"
              autoFocus
            />
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted text-muted-foreground rounded shrink-0">
              ESC
            </kbd>
          </div>
          <Command.List className="max-h-[50vh] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground/70">
              {t("noCommandResults")}
            </Command.Empty>
            {groups.map((group) => (
              <Command.Group
                key={group}
                heading={group}
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground/70 [&_[cmdk-group-heading]]:text-muted-foreground/70"
              >
                {commands
                  .filter((c) => c.group === group)
                  .map((cmd) => {
                    const Icon = cmd.icon;
                    return (
                      <Command.Item
                        key={cmd.id}
                        value={cmd.label}
                        onSelect={() => cmd.action()}
                        className="flex items-center gap-3 px-2 py-2.5 rounded-lg cursor-pointer text-sm text-muted-foreground data-[selected=true]:bg-muted dark:data-[selected=true]:bg-muted data-[selected=true]:text-foreground dark:data-[selected=true]:text-foreground transition-colors"
                      >
                        <Icon className="w-4 h-4 text-muted-foreground/70 shrink-0" />
                        <span className="flex-1">{cmd.label}</span>
                      </Command.Item>
                    );
                  })}
              </Command.Group>
            ))}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
