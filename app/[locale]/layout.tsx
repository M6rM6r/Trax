import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
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

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <div
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="relative"
      suppressHydrationWarning
    >
      <NextIntlClientProvider messages={messages}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <QueryProvider>
            <AuthProvider>
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
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </NextIntlClientProvider>
    </div>
  );
}
