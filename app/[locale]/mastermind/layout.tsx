"use client";

import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Brain, Building2, BarChart3, LogOut, Menu, X, ChevronRight } from "lucide-react";

const navItems = [
  { href: "/mastermind/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/mastermind/companies", label: "Companies", icon: Building2 },
  { href: "/mastermind/reports", label: "Reports", icon: BarChart3 },
];

export default function MastermindLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (pathname !== "/ar/mastermind/login" && !sessionStorage.getItem("mastermind_token")) {
      router.push("/ar/mastermind/login");
    }
  }, [pathname, router]);

  if (pathname === "/ar/mastermind/login") return <>{children}</>;
  if (!mounted) return null;

  const handleLogout = () => {
    sessionStorage.removeItem("mastermind_token");
    router.push("/ar/mastermind/login");
  };

  const activeLabel = navItems.find((n) => pathname.startsWith(n.href))?.label ?? "dashboard";

  return (
    <div dir="ltr" lang="en" className="min-h-screen w-full flex bg-slate-950 text-slate-100">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/75 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed md:static inset-y-0 left-0 z-30 w-60 flex flex-col border-r border-slate-800 bg-slate-900 transition-transform duration-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="h-14 flex items-center gap-3 px-5 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Brain className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold tracking-wider uppercase text-slate-100">MasterMind</p>
            <p className="text-[10px] text-slate-500 truncate">Trax SaaS Control</p>
          </div>
          <button
            type="button"
            className="ml-auto md:hidden text-slate-400"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => {
                  router.push(`/ar${item.href}`);
                  setSidebarOpen(false);
                }}
                className={cn(
                  "group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative",
                  isActive
                    ? "bg-emerald-500/10 text-white border border-emerald-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && <ChevronRight className="h-3 w-3 shrink-0 text-emerald-400" />}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-400/70 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center gap-3 border-b border-slate-800 px-4 md:px-6 bg-slate-900/80 backdrop-blur">
          <button
            type="button"
            className="md:hidden text-slate-400"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-1.5 text-sm text-slate-400">
            <span>~/mastermind</span>
            <span>/</span>
            <span className="text-emerald-400">{activeLabel.toLowerCase()}</span>
          </div>
          <div className="ml-auto">
            <span className="text-xs px-2 py-0.5 rounded border border-emerald-500/20 text-emerald-400 bg-emerald-500/10">
              ROOT
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
