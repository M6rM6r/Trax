import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zeem Dashboard",
  description: "Zeem Dashboard",
  icons: {
    icon: "/SVG/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
