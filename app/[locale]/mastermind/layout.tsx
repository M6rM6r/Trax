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
    sessionStorage.removeItem("mastermind_uid");
    router.push("/ar/mastermind/login");
  };

  const activeLabel = navItems.find((n) => pathname.startsWith(n.href))?.label ?? "dashboard";

  return (
    <div dir="ltr" lang="en" className="min-h-screen w-full flex bg-background text-foreground">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/75 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed md:static inset-y-0 left-0 z-30 w-60 flex flex-col border-r border-border bg-background transition-transform duration-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="h-14 flex items-center gap-3 px-5 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold tracking-wider uppercase text-foreground">MasterMind</p>
            <p className="text-[10px] text-muted-foreground/70 truncate">Trax SaaS Control</p>
          </div>
          <button
            type="button"
            className="ml-auto md:hidden text-muted-foreground"
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
                    ? "bg-primary/10 text-primary-foreground border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-card"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && <ChevronRight className="h-3 w-3 shrink-0 text-primary" />}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center gap-3 border-b border-border px-4 md:px-6 bg-background/80 backdrop-blur">
          <button
            type="button"
            className="md:hidden text-muted-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>~/mastermind</span>
            <span>/</span>
            <span className="text-primary">{activeLabel.toLowerCase()}</span>
          </div>
          <div className="ml-auto">
            <span className="text-xs px-2 py-0.5 rounded border border-primary/20 text-primary bg-primary/10">
              ROOT
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
