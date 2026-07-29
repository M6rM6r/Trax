"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { NavMain } from "@/components/Sidebar/nav-main";
import { usePathname, useRouter, Link } from "@/i18n/navigation";
import { Logout } from "@/public/SVG";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/config/firebase";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useMainNavItems } from "@/components/Sidebar/nav-main-items";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/useAuthStore";
import Image from "next/image";
import UserAvatar from "../Avatar";
import Breadcrumb from "../Breadcrumb";
import MobileBottomNav from "../MobileBottomNav";
import { CommandPalette } from "../CommandPalette";
import { ShortcutsHelp } from "../ShortcutsHelp";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useScrollPreservation } from "@/hooks/useScrollPreservation";
import { useResourcePreload } from "@/hooks/useResourcePreload";
import type { AdminUser } from "@/lib/types/responseTypes";
import { TopLoadingBar } from "../TopLoadingBar";
import OfflineBanner from "../OfflineBanner";
import NotificationCenter from "../NotificationCenter";

const Index = ({
  children,
  showSidebar = true,
  bare = false,
}: {
  children: React.ReactNode;
  showSidebar?: boolean;
  bare?: boolean;
}) => {
  const pathname = usePathname();
  const { toast } = useToast();
  const router = useRouter();

  const { user, role, clearUser } = useAuthStore();
  const t = useTranslations("Navigation");
  const mainNavItems = useMainNavItems({ pathname, role });
  const [authReady, setAuthReady] = useState(false);

  useKeyboardShortcuts();
  const { saveScrollPosition } = useScrollPreservation();
  useResourcePreload();

  // Synchronously peek at persisted auth so the guard doesn't flash-redirect
  // before Zustand persist rehydrates on the client.
  const storedUser = useRef<AdminUser | null>(null);
  if (typeof window !== "undefined" && storedUser.current === null) {
    try {
      const raw = sessionStorage.getItem("auth-storage") ?? localStorage.getItem("auth-storage");
      if (raw) {
        const parsed = JSON.parse(raw) as { state?: { user?: AdminUser } };
        storedUser.current = parsed?.state?.user ?? null;
      }
    } catch {
      storedUser.current = null;
    }
  }

  useEffect(() => {
    // Give Zustand persist one tick to rehydrate before enforcing the guard.
    const timer = setTimeout(() => setAuthReady(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Auth guard: redirect to login if no user (unless on auth pages)
  useEffect(() => {
    if (!authReady) return;
    const effectiveUser = user ?? storedUser.current;
    if (
      !effectiveUser &&
      !pathname.includes("/login") &&
      !pathname.includes("/register") &&
      !pathname.includes("/forgot-password") &&
      !pathname.includes("/reset-password") &&
      !pathname.includes("/mastermind")
    ) {
      router.replace("/login");
    }
  }, [authReady, user, pathname, router]);

  useEffect(() => {
    saveScrollPosition();
  }, [pathname, saveScrollPosition]);

  const logOut = useCallback(async () => {
    if (auth) {
      try {
        await signOut(auth);
      } catch {
        // Ignore Firebase sign-out errors and continue clearing local session.
      }
    }
    clearUser();
    toast({
      description: t("logoutSuccess"),
      variant: "default",
    });
    router.push("/login");
  }, [router, toast, clearUser, t]);

  // Show a minimal spinner until auth state is resolved to avoid flashing the
  // dashboard skeleton/layout to unauthenticated users.
  const effectiveUser = user ?? storedUser.current;
  if (
    !authReady ||
    (!effectiveUser &&
      !pathname.includes("/login") &&
      !pathname.includes("/register") &&
      !pathname.includes("/forgot-password") &&
      !pathname.includes("/reset-password") &&
      !pathname.includes("/mastermind"))
  ) {
    return (
      <div className="w-screen min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-background">
      <a href="#main-content" className="skip-to-content" aria-label={t("skipToMain")}>
        {t("skipToContent")}
      </a>
      <TopLoadingBar />
      <OfflineBanner />

      {!bare && (
        <nav
          className="fixed top-0 z-[49] w-full bg-card border-b border-border"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
          aria-label={t("header")}
        >
          <header className="mx-auto flex h-16 w-full max-w-[110rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/images/logo.png"
                  alt="Trax"
                  width={48}
                  height={48}
                  className="h-12 w-auto object-contain"
                  unoptimized
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              </Link>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <div className="flex items-center gap-2 md:gap-3 md:border-l md:border-border md:ps-4">
                <NotificationCenter />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={t("userMenu")}
                    >
                      <UserAvatar user={user} className="w-8 h-8" />
                      <span className="hidden md:inline text-sm font-medium text-foreground">
                        {user?.name || t("user")}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user?.name || t("user")}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={logOut}
                      className="text-destructive focus:bg-destructive/10 cursor-pointer"
                    >
                      <Logout className="w-4 h-4 me-2" />
                      {t("logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>
        </nav>
      )}

      {showSidebar && !bare && (
        <aside
          id="logo-sidebar"
          className={cn(
            "fixed top-0 z-40 hidden h-screen w-64 border-e border-sidebar-border bg-sidebar pt-16 lg:block"
          )}
        >
          <div className="flex h-full flex-col justify-between px-3 py-4">
            <NavMain items={mainNavItems?.navMain || []} />
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:bg-destructive/10"
              onClick={logOut}
            >
              <Logout className="me-2" /> {t("logout")}
            </Button>
          </div>
        </aside>
      )}

      <main
        id="main-content"
        tabIndex={-1}
        className={cn(
          "flex min-h-screen w-full flex-col transition-all scroll-mt-16 focus:outline-none",
          bare ? "pt-0 pb-0" : "pt-16 pb-24 lg:pb-8",
          showSidebar && !bare && "lg:ms-64 lg:w-[calc(100%-16rem)]"
        )}
      >
        {!bare && (
          <div className="w-full px-4 py-4 sm:px-6 lg:px-8">
            <Breadcrumb />
          </div>
        )}
        <div className="w-full max-w-[110rem]">{children}</div>
        {!bare && <MobileBottomNav />}
      </main>
      <CommandPalette />
      <ShortcutsHelp />
    </section>
  );
};

export default Index;
