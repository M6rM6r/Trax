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

interface CommandItem {
  id: string;
  label: string;
  icon: React.ElementType;
  shortcut?: string;
  action: () => void;
  group: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { clearUser, token } = useAuthStore();
  const { data: employees = [] } = useEmployees({ enabled: open && !!token });

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

  const commands: CommandItem[] = [
    ...employees.slice(0, 10).map((emp) => ({
      id: `emp-${emp.id}`,
      label: emp.name,
      icon: UserCircle,
      action: () => navigate(`/employees`),
      group: "الموظفون",
    })),
    {
      id: "dashboard",
      label: "لوحة التحكم",
      icon: LayoutDashboard,
      action: () => navigate("/"),
      group: "التنقل",
    },
    {
      id: "employees",
      label: "الموظفون",
      icon: Users,
      action: () => navigate(`/employees`),
      group: "التنقل",
    },
    {
      id: "employees-inactive",
      label: "الموظفون غير النشطين",
      icon: UserX,
      action: () => navigate(`/employees/inactive`),
      group: "التنقل",
    },
    {
      id: "live-map",
      label: "التتبع المباشر",
      icon: MapPin,
      action: () => navigate(`/live-map`),
      group: "التنقل",
    },
    {
      id: "attendance",
      label: "الحضور والانصراف",
      icon: Calendar,
      action: () => navigate(`/attendance`),
      group: "التنقل",
    },
    {
      id: "attendance-reports",
      label: "تقارير الحضور",
      icon: FileText,
      action: () => navigate(`/attendance/reports`),
      group: "التنقل",
    },
    {
      id: "geofences",
      label: "النطاقات الجغرافية",
      icon: MapPin,
      action: () => navigate(`/geofences`),
      group: "التنقل",
    },
    {
      id: "check-in",
      label: "تسجيل الحضور",
      icon: CheckCircle,
      action: () => navigate(`/check-in`),
      group: "التنقل",
    },
    {
      id: "settings-security",
      label: "إعدادات الأمان",
      icon: Shield,
      action: () => navigate(`/settings/securitySettings`),
      group: "الإعدادات",
    },
    {
      id: "settings-notifications",
      label: "إعدادات الإشعارات",
      icon: Bell,
      action: () => navigate(`/settings/notificationSettings`),
      group: "الإعدادات",
    },
    {
      id: "logout",
      label: "تسجيل الخروج",
      icon: LogOut,
      action: () => {
        hapticTap();
        handleLogout();
        setOpen(false);
      },
      group: "إجراءات",
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
        className="relative w-full max-w-xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="flex flex-col" role="dialog" aria-label="لوحة الأوامر">
          <div className="flex items-center gap-3 px-4 border-b border-gray-200 dark:border-slate-700">
            <Search className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />
            <Command.Input
              placeholder="ابحث عن صفحة أو إجراء..."
              className="w-full bg-transparent py-4 outline-none text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500"
              autoFocus
            />
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 rounded shrink-0">
              ESC
            </kbd>
          </div>
          <Command.List className="max-h-[50vh] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-gray-400 dark:text-slate-500">
              لا توجد نتائج
            </Command.Empty>
            {groups.map((group) => (
              <Command.Group
                key={group}
                heading={group}
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-gray-400 [&_[cmdk-group-heading]]:dark:text-slate-500"
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
                        className="flex items-center gap-3 px-2 py-2.5 rounded-lg cursor-pointer text-sm text-gray-700 dark:text-slate-300 data-[selected=true]:bg-gray-100 dark:data-[selected=true]:bg-slate-700 data-[selected=true]:text-gray-900 dark:data-[selected=true]:text-slate-100 transition-colors"
                      >
                        <Icon className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />
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
