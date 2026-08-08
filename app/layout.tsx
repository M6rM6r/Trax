import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Trax — نظام تحضير الموظفين",
    template: "%s | Trax",
  },
  description: "نظام إدارة الحضور في الوقت الفعلي مع الموقع الجغرافي والمناطق الجغرافية",
  keywords: ["trax", "حضور", "موظفين", "تحضير", "geofence", "attendance", "smart attendance"],
  authors: [{ name: "Trax" }],
  creator: "Trax",
  publisher: "Trax",
  applicationName: "Trax",
  manifest: "/manifest.json?v=4",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/images/icon-192.png?v=3", sizes: "192x192", type: "image/png" },
      { url: "/images/icon-512.png?v=3", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/images/apple-touch-icon.png?v=3", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Trax",
    statusBarStyle: "black-translucent",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  openGraph: {
    type: "website",
    locale: "ar_SA",
    title: "Trax — نظام تحضير الموظفين",
    description: "نظام إدارة الحضور في الوقت الفعلي",
    siteName: "Trax",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trax — نظام تحضير الموظفين",
    description: "نظام إدارة الحضور في الوقت الفعلي",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#000000" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Trax",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web, Android, iOS",
              description: "Smart real-time employee attendance management system",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "SAR",
              },
            }),
          }}
        />
        {children}
      </body>
    </html>
  );
}
