import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Trax — نظام تتبع الموظفين",
    template: "%s | Trax",
  },
  description:
    "نظام تتبع الموظفين وإدارة الحضور في الوقت الفعلي مع الموقع الجغرافي والمناطق الجغرافية",
  keywords: ["trax", "حضور", "موظفين", "تتبع", "geofence", "attendance", "employee tracking"],
  authors: [{ name: "Trax" }],
  creator: "Trax",
  publisher: "Trax",
  applicationName: "Trax",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/images/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/images/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/images/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    title: "Trax",
    statusBarStyle: "default",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  openGraph: {
    type: "website",
    locale: "ar_SA",
    title: "Trax — نظام تتبع الموظفين",
    description: "نظام تتبع الموظفين وإدارة الحضور في الوقت الفعلي",
    siteName: "Trax",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trax — نظام تتبع الموظفين",
    description: "نظام تتبع الموظفين وإدارة الحضور في الوقت الفعلي",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#3C7EE7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
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
              description: "Employee tracking and attendance management system",
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
