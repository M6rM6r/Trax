"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi } from "lucide-react";

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [showRestored, setShowRestored] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsOnline(navigator.onLine);

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestored(false);
    };

    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);
      setTimeout(() => setShowRestored(false), 3000);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {(!isOnline || showRestored) && (
        <motion.div
          key={isOnline ? "online" : "offline"}
          initial={{ y: -56, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -56, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className={`fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-primary-foreground shadow-lg ${
            isOnline ? "bg-primary" : "bg-destructive"
          }`}
          role="alert"
          aria-live="assertive"
        >
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4" />
              <span>تمت استعادة الاتصال بالإنترنت</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 animate-pulse" />
              <span>لا يوجد اتصال بالإنترنت — يعمل في وضع عدم الاتصال</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
