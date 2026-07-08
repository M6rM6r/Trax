import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Cairo } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import AppPreloader from "@/components/shared/AppPreloader";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import OfflineIndicator from "@/components/shared/OfflineIndicator";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { PWARegistrar } from "@/components/shared/PWARegistrar";
import { ThemeProvider } from "next-themes";
import { TopLoadingBar } from "@/components/shared/TopLoadingBar";
import { MonitoringProvider } from "@/components/providers/MonitoringProvider";
import SettingsApplier from "@/components/providers/SettingsApplier";
import { CommandPalette } from "@/components/shared/CommandPalette";

const cairo = Cairo({
  subsets: ["latin"],
  weight: ["400", "600", "700"], // Load only essential weights for better performance
  display: "swap", // Prevent layout shift when font loads
});
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
      className={`${cairo.className} relative`}
      suppressHydrationWarning
    >
      <NextIntlClientProvider messages={messages}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <QueryProvider>
            <ErrorBoundary>
              <MonitoringProvider>
                <SettingsApplier />
                <PWARegistrar />
                <AppPreloader />
                <TopLoadingBar />
                {children}
                <CommandPalette />
                <OfflineIndicator />
                <Toaster />
              </MonitoringProvider>
            </ErrorBoundary>
          </QueryProvider>
        </ThemeProvider>
      </NextIntlClientProvider>
    </div>
  );
}
