"use client";
import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";
import { useMainNavItems } from "./nav-main-items";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LogOut, Search } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import Image from "next/image";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/config/firebase";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearUser } = useAuthStore();
  const mainNavItems = useMainNavItems({ pathname, role: user?.role });
  const sidebar = useSidebar();

  const handleLogout = async () => {
    if (auth) {
      try {
        await signOut(auth);
      } catch {}
    }
    clearUser();
    router.push("/login");
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
    : "T";

  return (
    <Sidebar
      side="right"
      variant="inset"
      {...props}
      className="bg-sidebar"
      collapsible="icon"
    >
      <SidebarHeader
        className={` bg-sidebar text-sidebar-foreground flex ${
          sidebar.state === "collapsed" ? "flex-col" : "flex-row-reverse"
        }  gap-5 items-center justify-between`}
      >
        <SidebarTrigger className="hover:bg-transparent text-primary-foreground hover:text-primary-foreground h-9 w-9 md:h-7 md:w-7" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className=" hover:bg-transparent focus:bg-transparent "
            >
              <div className="flex items-center gap-3 px-1">
                <Image
                  src="/images/logo.png"
                  alt="Trax"
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain"
                  unoptimized
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
                {sidebar.state !== "collapsed" && (
                  <span className="text-xl font-bold text-primary-foreground tracking-wide">Trax</span>
                )}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className=" bg-sidebar text-sidebar-foreground pt-5 hideScrollbar">
        {sidebar.state !== "collapsed" && (
          <div className="px-3 pb-3">
            <button
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-background/5 hover:bg-background/10 border border-white/10 text-muted-foreground hover:text-foreground transition-colors text-sm"
              aria-label="بحث سريع — Ctrl+K"
              onClick={() => {
                window.dispatchEvent(new Event("toggle-command-palette"));
              }}
            >
              <Search className="w-3.5 h-3.5" />
              <span className="flex-1 text-right">بحث...</span>
              <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-background/10 text-[10px] font-mono text-primary-foreground/50 border border-white/10">
                Ctrl <span className="text-[8px]">+</span> K
              </kbd>
            </button>
          </div>
        )}
        <NavMain items={mainNavItems?.navMain} />
      </SidebarContent>
      <SidebarFooter className="bg-sidebar border-t border-sidebar-border p-2">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
            {initials}
          </div>
          {sidebar.state !== "collapsed" && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary-foreground truncate">
                  {user?.name || "المستخدم"}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user?.role || ""}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-background/10 text-muted-foreground hover:text-primary-foreground transition-colors"
                title="تسجيل الخروج"
                aria-label="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
