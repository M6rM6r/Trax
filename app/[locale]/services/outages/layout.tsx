"use client";
import { LoadingProvider } from "@/contexts/LoadingContext";

export default function OutagesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <LoadingProvider>{children}</LoadingProvider>;
}
