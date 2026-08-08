import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/toaster";
import AppPreloader from "@/components/shared/AppPreloader";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import OfflineIndicator from "@/components/shared/OfflineIndicator";
import { QueryProvider } from "@/components/providers/QueryProvider";
import AuthProvider from "@/components/providers/AuthProvider";
import CompanySettingsLoader from "@/components/providers/CompanySettingsLoader";
import { PWARegistrar } from "@/components/shared/PWARegistrar";
import { ThemeProvider } from "next-themes";
import { TopLoadingBar } from "@/components/shared/TopLoadingBar";
import { MonitoringProvider } from "@/components/providers/MonitoringProvider";
import SettingsApplier from "@/components/providers/SettingsApplier";
import { CommandPalette } from "@/components/shared/CommandPalette";
import MotionProvider from "@/components/providers/MotionProvider";
import InstallPrompt from "@/components/shared/InstallPrompt";
import OfflineSyncManager from "@/components/shared/OfflineSyncManager";
import NotificationManager from "@/components/shared/NotificationManager";
import RoleGate from "@/components/providers/RoleGate";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ namespace: "Metadata", locale: params.locale });
  return {
    title: {
      default: t("title"),
      template: "%s | Trax",
    },
    description: t("description"),
    keywords: t("keywords")
      .split(",")
      .map((k) => k.trim()),
    openGraph: {
      type: "website",
      locale: params.locale === "ar" ? "ar_SA" : "en_US",
      title: t("title"),
      description: t("description"),
      siteName: "Trax",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Ensure that the incoming `locale` is valid
  const { locale } = params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const t = await getTranslations({ namespace: "Navigation", locale });

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();
  const timeZone = "Asia/Riyadh";

  return (
    <div
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="relative"
      suppressHydrationWarning
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        {t("skipToContent")}
      </a>
      <NextIntlClientProvider
        locale={locale}
        messages={messages}
        timeZone={timeZone}
        now={new Date()}
      >
        <ThemeProvider attribute="class" forcedTheme="dark" enableSystem={false}>
          <QueryProvider>
            <AuthProvider>
              <RoleGate>
                <CompanySettingsLoader />
                <ErrorBoundary>
                  <MonitoringProvider>
                    <MotionProvider>
                      <SettingsApplier />
                      <PWARegistrar />
                      <AppPreloader />
                      <TopLoadingBar />
                      {children}
                      <CommandPalette />
                      <OfflineIndicator />
                      <OfflineSyncManager />
                      <NotificationManager />
                      <InstallPrompt />
                      <Toaster />
                    </MotionProvider>
                  </MonitoringProvider>
                </ErrorBoundary>
              </RoleGate>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </NextIntlClientProvider>
    </div>
  );
}
