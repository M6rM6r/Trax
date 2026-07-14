"use client";

import { useState, useEffect, useCallback } from "react";
import MainLayout from "@/components/shared/MainLayout";
import UserAvatar from "@/components/shared/Avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  LogOut,
  WifiOff,
  RefreshCw,
  MapPin,
  Navigation,
  Clock,
  Briefcase,
  RotateCcw,
} from "lucide-react";
import { useCheckIn, useCheckOut, useGeofences } from "@/hooks/useApi";
import { hapticSuccess, hapticError, hapticTap } from "@/lib/utils/haptics";
import { fireConfetti } from "@/lib/utils/confetti";
import { toastSuccess, toastError } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import type { Geofence } from "@/lib/types/trackingTypes";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/utils";

function LiveClock() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }));
      setDate(
        now.toLocaleDateString("ar-SA", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="text-center">
      <p className="text-4xl sm:text-5xl font-extrabold tracking-tighter tabular-nums text-gray-900 dark:text-slate-100">
        {time}
      </p>
      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400 font-medium uppercase tracking-widest mt-1 opacity-80">
        {date}
      </p>
    </div>
  );
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function CheckInPage() {
  const { data: geofences = [] } = useGeofences();
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();
  const { user, companyName } = useAuthStore();
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [nearestGeofence, setNearestGeofence] = useState<{
    geofence: Geofence;
    distance: number;
  } | null>(null);
  const [checkInStatus, setCheckInStatus] = useState<"idle" | "success" | "outside" | "loading">(
    "idle"
  );
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [checkInTimestamp, setCheckInTimestamp] = useState<number | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null);
  const [checkOutStatus, setCheckOutStatus] = useState<"idle" | "loading">("idle");
  const [showBurst, setShowBurst] = useState(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [elapsedTime, setElapsedTime] = useState("");
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const updateFromPosition = useCallback(
    (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;
      setLocationError(null);
      setCurrentLocation({ lat: latitude, lng: longitude });
      setLocationAccuracy(accuracy);

      let closest: { geofence: Geofence; distance: number } | null = null;
      geofences.forEach((geo) => {
        const dist = calculateDistance(latitude, longitude, geo.lat, geo.lng);
        if (!closest || dist < closest.distance) {
          closest = { geofence: geo, distance: dist };
        }
      });
      setNearestGeofence(closest);
    },
    [geofences]
  );

  const refreshLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("الموقع غير مدعوم");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      updateFromPosition,
      () => setLocationError("تعذر الحصول على الموقع"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [updateFromPosition]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("الموقع غير مدعوم");
      return;
    }
    refreshLocation();
    const id = navigator.geolocation.watchPosition(
      updateFromPosition,
      () => setLocationError("تعذر الحصول على الموقع"),
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [updateFromPosition, refreshLocation]);

  useEffect(() => {
    if (checkInStatus !== "success" || checkOutTime || !checkInTimestamp) return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - checkInTimestamp;
      const hours = Math.floor(elapsed / 3600000);
      const minutes = Math.floor((elapsed % 3600000) / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      setElapsedTime(`${hours}س ${minutes}د ${seconds}ث`);
    }, 1000);
    return () => clearInterval(interval);
  }, [checkInStatus, checkOutTime, checkInTimestamp]);

  const isWithinRange = nearestGeofence
    ? nearestGeofence.distance <= nearestGeofence.geofence.radius + 50
    : geofences.length === 0;

  const handleCheckIn = async () => {
    hapticTap();
    if (checkInStatus === "success" || checkInStatus === "loading" || !currentLocation) return;

    setCheckInStatus("loading");

    if (!isWithinRange) {
      setCheckInStatus("outside");
      hapticError();
      toastError("أنت خارج النطاق الجغرافي");
      return;
    }

    try {
      await checkInMutation.mutateAsync({
        employeeId: user?.employee_id ?? 0,
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        geofenceId: nearestGeofence?.geofence.id ?? 0,
      } as { employeeId: string | number; lat: number; lng: number; geofenceId: string | number });

      const now = new Date();
      setCheckInTime(now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }));
      setCheckInTimestamp(now.getTime());
      setCheckInStatus("success");
      setShowBurst(true);
      setTimeout(() => setShowBurst(false), 600);
      hapticSuccess();
      fireConfetti();
      toastSuccess("تم تسجيل الحضور بنجاح");
    } catch {
      setCheckInStatus("idle");
      toastError("فشل تسجيل الحضور");
    }
  };

  const handleCheckOutClick = () => {
    if (checkOutTime || checkOutStatus === "loading" || checkInStatus !== "success") return;
    hapticTap();
    setShowCheckoutConfirm(true);
  };

  const confirmCheckOut = async () => {
    setShowCheckoutConfirm(false);
    if (checkOutTime || checkOutStatus === "loading") return;
    setCheckOutStatus("loading");
    try {
      await checkOutMutation.mutateAsync({ employeeId: user?.employee_id ?? 0 } as { employeeId: string | number });
      setCheckOutTime(
        new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })
      );
      hapticSuccess();
      toastSuccess("تم تسجيل انصرافك بنجاح");
    } catch {
      hapticError();
      toastError("لا يوجد تسجيل حضور لإنهائه اليوم");
    } finally {
      setCheckOutStatus("idle");
    }
  };

  const avatarUser = user
    ? { id: user.id, name: user.name, email: user.email, avatar: user.profile_image || null }
    : null;

  const dayComplete = !!checkOutTime;
  const checkedIn = checkInStatus === "success" && !dayComplete;

  const statusMeta = dayComplete
    ? {
        label: "انتهى الدوام",
        color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
        icon: Briefcase,
      }
    : checkedIn
      ? {
          label: "مسجل حضور",
          color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
          icon: CheckCircle,
        }
      : {
          label: "لم يُسجل اليوم",
          color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
          icon: Clock,
        };

  return (
    <MainLayout>
      <div className="flex flex-col gap-4 max-w-md mx-auto pb-8">
        {/* Employee Welcome Header */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-600 to-emerald-800 text-white overflow-hidden">
          <CardContent className="p-4 flex items-center gap-3">
            <UserAvatar user={avatarUser} size="lg" className="border-2 border-white/30" />
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold truncate">{user?.name || "موظف"}</h2>
              <p className="text-[10px] text-emerald-100 truncate opacity-80">
                {companyName || user?.email}
              </p>
            </div>
            <Badge
              className={cn("text-[10px] px-2 py-0.5 rounded-full border-0", statusMeta.color)}
            >
              <statusMeta.icon className="w-3 h-3 ms-1" />
              {statusMeta.label}
            </Badge>
          </CardContent>
        </Card>

        {/* Main Check-In Card */}
        <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 overflow-hidden relative">
          <div
            className={cn(
              "absolute top-0 left-0 w-full h-1.5",
              checkedIn ? "bg-emerald-500" : dayComplete ? "bg-slate-400" : "bg-emerald-500"
            )}
          />
          <CardContent className="pt-6 pb-6 px-4 text-center">
            <LiveClock />

            <div className="flex justify-center mt-8 relative">
              <AnimatePresence>
                {showBurst && (
                  <>
                    {Array.from({ length: 12 }).map((_, i) => {
                      const angle = (i / 12) * Math.PI * 2;
                      return (
                        <motion.div
                          key={i}
                          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                          animate={{
                            x: Math.cos(angle) * 80,
                            y: Math.sin(angle) * 80,
                            opacity: 0,
                            scale: 0,
                          }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-green-400 pointer-events-none"
                        />
                      );
                    })}
                  </>
                )}
              </AnimatePresence>
              <AnimatePresence mode="wait">
                <motion.button
                  key={checkInStatus + (dayComplete ? "-done" : "")}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCheckIn}
                  disabled={
                    checkInStatus === "success" || checkInStatus === "loading" || dayComplete
                  }
                  aria-label={
                    dayComplete
                      ? "تم انتهاء الدوام"
                      : checkInStatus === "success"
                        ? "تم تسجيل الحضور"
                        : checkInStatus === "loading"
                          ? "جاري تسجيل الحضور"
                          : "تسجيل الحضور"
                  }
                  className={cn(
                    "w-40 h-40 rounded-full flex flex-col items-center justify-center gap-2 shadow-2xl shadow-emerald-500/20 transition-all border-4",
                    dayComplete
                      ? "bg-slate-300 text-slate-600 border-slate-100 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-900"
                      : checkInStatus === "success"
                        ? "bg-emerald-500 text-white border-emerald-100 dark:border-emerald-900/30"
                        : checkInStatus === "outside"
                          ? "bg-amber-500 text-white border-amber-100 dark:border-amber-900/30"
                          : "bg-emerald-500 text-white border-emerald-100 dark:border-emerald-900/30"
                  )}
                >
                  {checkInStatus === "loading" ? (
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  ) : dayComplete ? (
                    <>
                      <CheckCircle className="w-10 h-10" />
                      <span className="text-sm font-bold">انتهى</span>
                    </>
                  ) : checkInStatus === "success" ? (
                    <>
                      <CheckCircle className="w-10 h-10" />
                      <span className="text-sm font-bold">تم</span>
                    </>
                  ) : (
                    <>
                      <Navigation className="w-10 h-10" />
                      <span className="text-sm font-bold">تسجيل</span>
                    </>
                  )}
                </motion.button>
              </AnimatePresence>
            </div>

            <p className="mt-5 text-xs font-medium text-gray-500 dark:text-slate-400">
              {dayComplete
                ? "انتهى"
                : checkedIn
                  ? checkInTime
                  : isWithinRange
                    ? "جاهز"
                    : "خارج النطاق"}
            </p>
          </CardContent>
        </Card>

        {/* Today Timeline */}
        <Card className="border-0 shadow-md dark:bg-slate-900">
          <CardContent className="p-4">
            <h3 className="text-xs font-bold text-gray-700 dark:text-slate-200 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              سجل اليوم
            </h3>

            <div className="relative flex flex-col gap-0">
              <div className="absolute right-[15px] top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-slate-700" />

              {/* Check-in entry */}
              <div className="relative flex items-start gap-3 py-2">
                <div
                  className={cn(
                    "z-10 w-3 h-3 rounded-full mt-1.5 ring-2 ring-white dark:ring-slate-900",
                    checkInTime ? "bg-green-500" : "bg-gray-300 dark:bg-slate-600"
                  )}
                />
                <div className="flex-1">
                  <p className="text-xs font-bold dark:text-slate-200">الحضور</p>
                  <p className="text-[10px] text-gray-500 dark:text-slate-400">
                    {checkInTime || "--:--"}
                  </p>
                </div>
              </div>

              {/* Check-out entry */}
              <div className="relative flex items-start gap-3 py-2">
                <div
                  className={cn(
                    "z-10 w-3 h-3 rounded-full mt-1.5 ring-2 ring-white dark:ring-slate-900",
                    checkOutTime
                      ? "bg-red-500"
                      : checkedIn
                        ? "bg-gray-300 dark:bg-slate-600 animate-pulse"
                        : "bg-gray-300 dark:bg-slate-600"
                  )}
                />
                <div className="flex-1">
                  <p className="text-xs font-bold dark:text-slate-200">الانصراف</p>
                  <p className="text-[10px] text-gray-500 dark:text-slate-400">
                    {checkOutTime || (checkedIn ? "جاري الدوام" : "--:--")}
                  </p>
                </div>
                {checkedIn && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 text-[10px] gap-1 px-2 py-1 h-auto"
                    onClick={handleCheckOutClick}
                    disabled={checkOutStatus === "loading"}
                  >
                    <LogOut className="w-3 h-3" />
                    {checkOutStatus === "loading" ? "جاري..." : "إنهاء"}
                  </Button>
                )}
              </div>
            </div>

            {checkedIn && (
              <div className="mt-3 pt-3 border-t dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-gray-500 dark:text-slate-400">مدة الدوام</span>
                <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {elapsedTime}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location Card */}
        <Card
          className={cn(
            "border-0 shadow-md dark:bg-slate-900 overflow-hidden",
            locationError
              ? "bg-red-50 dark:bg-red-900/10"
              : isWithinRange
                ? "bg-emerald-50/60 dark:bg-emerald-900/10"
                : "bg-amber-50/60 dark:bg-amber-900/10"
          )}
        >
          <div
            className={cn(
              "h-1 w-full",
              locationError ? "bg-red-500" : isWithinRange ? "bg-emerald-500" : "bg-amber-500"
            )}
          />
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                  locationError
                    ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                    : isWithinRange
                      ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                )}
              >
                <MapPin className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold dark:text-slate-200 truncate">
                  {locationError
                    ? "تعذر تحديد الموقع"
                    : nearestGeofence
                      ? nearestGeofence.geofence.name
                      : "جاري تحديد الموقع..."}
                </p>
                {nearestGeofence && !locationError && (
                  <p className="text-[10px] text-gray-500 dark:text-slate-400">
                    {Math.round(nearestGeofence.distance)}م من مركز النطاق
                    {locationAccuracy !== null && ` · دقة ±${Math.round(locationAccuracy)}م`}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-gray-500 dark:text-slate-400 shrink-0"
                onClick={refreshLocation}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            {locationError ? (
              <p className="mt-3 text-[11px] text-red-600 dark:text-red-400 font-medium">
                {locationError}
              </p>
            ) : (
              nearestGeofence && (
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "text-[11px] font-medium",
                      isWithinRange
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-amber-700 dark:text-amber-400"
                    )}
                  >
                    {isWithinRange
                      ? "داخل النطاق"
                      : `اقترب ${Math.max(0, Math.round(nearestGeofence.distance - nearestGeofence.geofence.radius))}م للتسجيل`}
                  </span>
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      isWithinRange ? "bg-emerald-500" : "bg-amber-500"
                    )}
                  />
                </div>
              )
            )}
          </CardContent>
        </Card>

        {/* Offline Banner */}
        {!isOnline && (
          <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-xl border border-amber-100 dark:border-amber-900/30">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span className="text-[11px] font-bold">تعمل بدون اتصال · سيتم المزامنة لاحقاً</span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCheckoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCheckoutConfirm(false)}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 space-y-4"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center">
                تأكيد الانصراف
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-slate-400">وقت الحضور</span>
                  <span className="font-medium dark:text-slate-200">{checkInTime || "--:--"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-slate-400">مدة الدوام</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {elapsedTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-slate-400">الموقع</span>
                  <span className="font-medium dark:text-slate-200">
                    {nearestGeofence?.geofence.name || "—"}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setShowCheckoutConfirm(false)}
                >
                  إلغاء
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={confirmCheckOut}
                >
                  تأكيد
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
}
