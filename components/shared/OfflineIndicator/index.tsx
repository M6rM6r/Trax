"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-red-600 text-white py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium animate-slide-up">
      <WifiOff className="w-4 h-4" />
      <span>لا يوجد اتصال بالإنترنت — يتم العمل في وضع عدم الاتصال</span>
    </div>
  );
}
