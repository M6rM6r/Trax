import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Cairo } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import AppPreloader from "@/components/shared/AppPreloader";
import ErrorBoundary from "@/components/shared/ErrorBoundary";

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
  params: Promise<{ locale: string }>;
}) {
  // Ensure that the incoming `locale` is valid
  const { locale } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <body className={`${cairo.className} relative`}>
        <NextIntlClientProvider messages={messages}>
          <ErrorBoundary>
            <AppPreloader />
            {children}
            <Toaster />
          </ErrorBoundary>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
