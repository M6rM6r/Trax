"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import MainLayout from "@/components/shared/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Navigation,
  CheckCircle,
  XCircle,
  LogOut,
  Timer,
  QrCode,
  Camera,
  Wifi,
  WifiOff,
  CloudOff,
  RefreshCw,
  Upload,
} from "lucide-react";
import { useCheckIn, useCheckOut, useGeofences } from "@/hooks/useApi";
import { hapticSuccess, hapticError, hapticTap } from "@/lib/utils/haptics";
import { fireConfetti } from "@/lib/utils/confetti";
import { toastSuccess, toastError } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import type { Geofence } from "@/lib/types/trackingTypes";
import { useAuthStore } from "@/stores/useAuthStore";

function LiveClock() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
      setDate(
        now.toLocaleDateString("ar-SA", {
          weekday: "long",
          year: "numeric",
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
      <p className="text-3xl sm:text-5xl font-bold tracking-tight tabular-nums text-gray-900 dark:text-slate-100">
        {time}
      </p>
      <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">{date}</p>
    </div>
  );
}

export default function CheckInPage() {
  const { data: geofences = [] } = useGeofences();
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();
  const { user } = useAuthStore();
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
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
  const [elapsedTime, setElapsedTime] = useState("");
  const [checkInMethod, setCheckInMethod] = useState<"location" | "qr" | "selfie">("qr");
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showSelfieCapture, setShowSelfieCapture] = useState(false);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCheckIns, setPendingCheckIns] = useState<
    Array<{ type: string; time: string; location: string; selfie?: string }>
  >([]);
  const [attendanceMode, setAttendanceMode] = useState<"manual" | "auto_optional">("manual");
  const [autoAttempted, setAutoAttempted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const pendingCheckInsRef = useRef(pendingCheckIns);
  pendingCheckInsRef.current = pendingCheckIns;

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      const pending = pendingCheckInsRef.current;
      if (pending.length > 0) {
        toastSuccess(`تم مزامنة ${pending.length} سجل معلق`);
        setPendingCheckIns([]);
        localStorage.removeItem("trax_pending_checkins");
      }
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(navigator.onLine);
    const saved = localStorage.getItem("trax_pending_checkins");
    if (saved) setPendingCheckIns(JSON.parse(saved));
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem("trax_settings");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed.attendanceMode === "auto_optional" || parsed.attendanceMode === "manual") {
        setAttendanceMode(parsed.attendanceMode);
      }
    } catch {
      // ignore malformed settings
    }
  }, []);

  const savePendingCheckIn = (record: {
    type: string;
    time: string;
    location: string;
    selfie?: string;
  }) => {
    const updated = [...pendingCheckIns, record];
    setPendingCheckIns(updated);
    localStorage.setItem("trax_pending_checkins", JSON.stringify(updated));
  };

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      toastError("تعذر الوصول إلى الكاميرا");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      setSelfieImage(dataUrl);
      hapticSuccess();
    }
    stopCamera();
  };

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });

          let closest: { geofence: Geofence; distance: number } | null = null;
          geofences.forEach((geo) => {
            const dist = calculateDistance(latitude, longitude, geo.lat, geo.lng);
            if (!closest || dist < closest.distance) {
              closest = { geofence: geo, distance: dist };
            }
          });
          if (closest) {
            setNearestGeofence(closest);
          }
        },
        () => {
          setLocationError("تعذر الحصول على موقعك. يرجى تفعيل خدمة تحديد الموقع.");
        }
      );
    } else {
      setLocationError("متصفحك لا يدعم خدمة تحديد الموقع.");
    }
  }, [geofences]);

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

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const completeLocalCheckIn = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
    const locationName = nearestGeofence?.geofence.name || "موقع غير معروف";

    setCheckInTime(timeStr);
    setCheckInTimestamp(now.getTime());
    setCheckInStatus("success");
    hapticSuccess();
    fireConfetti();

    if (!isOnline) {
      savePendingCheckIn({
        type: checkInMethod,
        time: timeStr,
        location: locationName,
        selfie: selfieImage || undefined,
      });
      toastSuccess("تم حفظ الحضور محلياً - سيتم المزامنة عند عودة الاتصال");
    }
  };

  const handleCheckIn = async () => {
    hapticTap();
    if (checkInStatus === "success" || checkInStatus === "loading") return;

    if (!nearestGeofence || !currentLocation) {
      toastError("تعذر تسجيل الحضور قبل تحديد الموقع");
      return;
    }

    if (!isInside) {
      setCheckInStatus("outside");
      hapticError();
      toastError("أنت خارج النطاق الجغرافي المسموح لتسجيل الحضور");
      return;
    }

    setCheckInStatus("loading");

    if (isOnline && user?.id) {
      try {
        await checkInMutation.mutateAsync({
          employeeId: user.id,
          lat: currentLocation.lat,
          lng: currentLocation.lng,
          geofenceId: nearestGeofence.geofence.id,
        });
        completeLocalCheckIn();
        return;
      } catch {
        toastError("تعذر تسجيل الحضور عبر الخادم، سيتم الحفظ محلياً");
      }
    }

    setTimeout(() => completeLocalCheckIn(), 400);
  };

  const handleQRCheckIn = () => {
    hapticTap();
    setCheckInMethod("qr");
    setShowQRScanner(false);
    setCheckInStatus("loading");
    setTimeout(() => {
      const now = new Date();
      setCheckInTime(now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }));
      setCheckInTimestamp(now.getTime());
      setCheckInStatus("success");
      hapticSuccess();
      fireConfetti();
      if (!isOnline) {
        savePendingCheckIn({
          type: "qr",
          time: now.toLocaleTimeString("ar-SA"),
          location: "QR Check-in",
        });
      }
    }, 800);
  };

  const handleSelfieCheckIn = () => {
    if (!selfieImage) return;
    hapticTap();
    setCheckInMethod("selfie");
    setShowSelfieCapture(false);
    setCheckInStatus("loading");
    setTimeout(() => {
      const now = new Date();
      setCheckInTime(now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }));
      setCheckInTimestamp(now.getTime());
      setCheckInStatus("success");
      hapticSuccess();
      fireConfetti();
      if (!isOnline) {
        savePendingCheckIn({
          type: "selfie",
          time: now.toLocaleTimeString("ar-SA"),
          location: "Selfie Check-in",
          selfie: selfieImage,
        });
      }
    }, 800);
  };

  const handleCheckOut = async () => {
    if (!checkInTimestamp || checkOutStatus === "loading") return;
    hapticTap();
    setCheckOutStatus("loading");

    if (isOnline && user?.id) {
      try {
        await checkOutMutation.mutateAsync({ employeeId: user.id });
      } catch {
        toastError("تعذر مزامنة الانصراف مع الخادم");
      }
    }

    setTimeout(() => {
      const now = new Date();
      setCheckOutTime(now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }));
      setCheckOutStatus("idle");
      hapticSuccess();
    }, 500);
  };

  const isInside = nearestGeofence && nearestGeofence.distance <= nearestGeofence.geofence.radius;

  useEffect(() => {
    if (attendanceMode !== "auto_optional") return;
    if (!isInside) return;
    if (checkInStatus !== "idle") return;
    if (autoAttempted) return;

    setAutoAttempted(true);
    const timer = setTimeout(() => {
      void handleCheckIn();
    }, 2000);

    return () => clearTimeout(timer);
  }, [attendanceMode, isInside, checkInStatus, autoAttempted]);

  useEffect(() => {
    if (!isInside && checkInStatus === "idle") {
      setAutoAttempted(false);
    }
  }, [isInside, checkInStatus]);

  const sessionStatus = !checkInTime
    ? { label: "لم يتم تسجيل الحضور اليوم", color: "amber" }
    : checkInTime && !checkOutTime
      ? { label: "داخل الدوام", color: "green" }
      : { label: "اكتمل الدوام", color: "blue" };

  const totalWorkedHours =
    checkInTimestamp && checkOutTime
      ? (() => {
          const elapsed = Date.now() - checkInTimestamp;
          const hours = Math.floor(elapsed / 3600000);
          const minutes = Math.floor((elapsed % 3600000) / 60000);
          return `${hours}س ${minutes}د`;
        })()
      : null;

  return (
    <MainLayout>
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 min-h-screen">
        {/* Header bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-slate-100">
                تسجيل الحضور
              </h1>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400 hidden sm:block">
                سجل حضورك ضمن النطاق الجغرافي
              </p>
            </div>
          </div>
          <div
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium ${
              isOnline
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            }`}
          >
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isOnline ? "متصل" : "غير متصل"}
            {pendingCheckIns.length > 0 && (
              <span className="mr-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {pendingCheckIns.length}
              </span>
            )}
          </div>
        </div>

        <div className="max-w-2xl mx-auto space-y-4 sm:space-y-5">
          <Card className="border-0 shadow-md dark:bg-slate-800">
            <CardContent className="py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                  وضع الحضور: {attendanceMode === "auto_optional" ? "تلقائي + يدوي" : "يدوي فقط"}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  {attendanceMode === "auto_optional"
                    ? "سيتم محاولة تسجيل الحضور تلقائياً عند دخول النطاق، ويمكنك التسجيل يدوياً أيضاً."
                    : "التسجيل يتم يدوياً فقط عند الضغط على زر تسجيل الحضور."}
                </p>
              </div>
              {attendanceMode === "auto_optional" && checkInStatus === "idle" && isInside && (
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  محاولة تلقائية بعد ثانيتين
                </span>
              )}
            </CardContent>
          </Card>

          {/* Hero Clock + Radial Button */}
          <Card className="border-0 shadow-xl dark:bg-slate-800 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-indigo-600/5 pointer-events-none" />
            <CardContent className="pt-5 sm:pt-8 pb-5 sm:pb-8">
              <LiveClock />

              {/* Radial check-in button */}
              <div className="flex justify-center mt-6 sm:mt-8 mb-3 sm:mb-4">
                <div className="relative">
                  {/* Pulse rings — only when idle */}
                  {checkInStatus === "idle" && !checkInStatus.toString().includes("outside") && (
                    <>
                      <span className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
                      <span className="absolute inset-[-8px] rounded-full border-2 border-blue-300/40 dark:border-blue-700/40 animate-pulse" />
                    </>
                  )}

                  {checkInStatus === "success" && !checkOutTime && (
                    <span className="absolute inset-[-8px] rounded-full border-2 border-green-400/50 animate-pulse" />
                  )}

                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    whileHover={{ scale: 1.04 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    disabled={checkInStatus === "loading" || checkInStatus === "success"}
                    onClick={handleCheckIn}
                    className={`relative w-28 h-28 sm:w-36 sm:h-36 rounded-full flex flex-col items-center justify-center gap-1 shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      checkInStatus === "success"
                        ? "bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/30"
                        : checkInStatus === "outside"
                          ? "bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/30"
                          : "bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-600/40"
                    }`}
                  >
                    {checkInStatus === "loading" ? (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : checkInStatus === "success" ? (
                      <>
                        <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                        <span className="text-white text-[10px] sm:text-xs font-bold">
                          تم التسجيل
                        </span>
                      </>
                    ) : checkInStatus === "outside" ? (
                      <>
                        <XCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                        <span className="text-white text-[10px] sm:text-xs font-bold">
                          خارج النطاق
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                        <span className="text-white text-xs sm:text-sm font-bold">
                          تسجيل الحضور
                        </span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Check-out button */}
              <AnimatePresence>
                {checkInStatus === "success" && !checkOutTime && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex justify-center mt-2"
                  >
                    <button
                      onClick={handleCheckOut}
                      disabled={checkOutStatus === "loading"}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-gray-200 dark:border-slate-600 text-sm font-medium text-gray-700 dark:text-slate-300 hover:border-red-300 hover:text-red-600 dark:hover:text-red-400 transition-all disabled:opacity-50"
                    >
                      {checkOutStatus === "loading" ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <LogOut className="w-4 h-4" />
                      )}
                      تسجيل الانصراف
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Elapsed timer */}
              <AnimatePresence>
                {checkInStatus === "success" && !checkOutTime && elapsedTime && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-xs text-gray-500 dark:text-slate-400 mt-3 flex items-center justify-center gap-1"
                  >
                    <Timer className="w-3 h-3" />
                    الوقت المنقضي:{" "}
                    <span className="font-mono font-semibold text-green-600 dark:text-green-400">
                      {elapsedTime}
                    </span>
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Session timeline */}
              <AnimatePresence>
                {(checkInTime || checkOutTime) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 pt-5 border-t border-gray-100 dark:border-slate-700"
                  >
                    <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                      سجل اليوم
                    </p>
                    <div className="flex items-center gap-3">
                      {/* Check-in node */}
                      <div className="flex flex-col items-center">
                        <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                          تسجيل الحضور
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                          {nearestGeofence?.geofence.name || "—"}
                        </p>
                      </div>
                      <span className="text-sm font-bold tabular-nums text-gray-900 dark:text-slate-100">
                        {checkInTime}
                      </span>
                    </div>

                    {checkOutTime && (
                      <>
                        <div className="mr-4 w-px h-4 bg-gray-200 dark:bg-slate-600 my-1" />
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                            <LogOut className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                              تسجيل الانصراف
                            </p>
                            {totalWorkedHours && (
                              <p className="text-xs text-gray-500 dark:text-slate-400">
                                {totalWorkedHours}
                              </p>
                            )}
                          </div>
                          <span className="text-sm font-bold tabular-nums text-gray-900 dark:text-slate-100">
                            {checkOutTime}
                          </span>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
          {/* Offline Banner */}
          {!isOnline && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-0 shadow-lg bg-amber-50 dark:bg-amber-900/20">
                <CardContent className="flex items-center gap-3 py-4">
                  <CloudOff className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    أنت تعمل دون اتصال. سيتم حفظ سجلات الحضور محلياً ومزامنتها عند عودة الاتصال.
                    {pendingCheckIns.length > 0 && ` (${pendingCheckIns.length} سجل معلق)`}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Check-in Method Selector */}
          <Card className="border-0 shadow-lg dark:bg-slate-800">
            <CardContent className="pt-5 pb-5">
              <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                طريقة التسجيل
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
                الوضع الحالي: {attendanceMode === "auto_optional" ? "تلقائي + يدوي" : "يدوي فقط"}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "qr" as const, label: "QR Code", icon: QrCode },
                  { value: "selfie" as const, label: "سيلفي", icon: Camera },
                ].map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.value}
                      onClick={() => {
                        hapticTap();
                        setCheckInMethod(method.value);
                        if (method.value === "qr") setShowQRScanner(true);
                        if (method.value === "selfie") {
                          setShowSelfieCapture(true);
                          setSelfieImage(null);
                          startCamera();
                        }
                      }}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        checkInMethod === method.value
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm shadow-blue-500/10"
                          : "border-gray-100 dark:border-slate-600 hover:border-blue-200 dark:hover:border-slate-500"
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${checkInMethod === method.value ? "text-blue-600 dark:text-blue-400" : "text-gray-400"}`}
                      />
                      <span
                        className={`text-sm font-medium ${checkInMethod === method.value ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-slate-300"}`}
                      >
                        {method.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* QR Scanner Modal */}
          <AnimatePresence>
            {showQRScanner && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
                onClick={() => setShowQRScanner(false)}
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl"
                >
                  <div className="text-center space-y-4">
                    <div className="w-48 h-48 mx-auto border-4 border-blue-500 rounded-2xl flex items-center justify-center bg-gray-50 dark:bg-slate-900 relative overflow-hidden">
                      <QrCode className="w-24 h-24 text-gray-300 dark:text-slate-600" />
                      <div
                        className="absolute inset-x-0 h-1 bg-blue-500 animate-pulse"
                        style={{ top: "50%" }}
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                        مسح QR Code
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-slate-400">
                        وجه الكاميرا نحو رمز QR الخاص بالموقع
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowQRScanner(false)}
                      >
                        إلغاء
                      </Button>
                      <Button variant="primary" className="flex-1" onClick={handleQRCheckIn}>
                        محاكاة المسح
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Selfie Capture Modal */}
          <AnimatePresence>
            {showSelfieCapture && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
                onClick={() => {
                  setShowSelfieCapture(false);
                  stopCamera();
                }}
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl"
                >
                  <div className="text-center space-y-4">
                    {selfieImage ? (
                      <div className="space-y-4">
                        <img
                          src={selfieImage}
                          alt="Selfie"
                          className="w-48 h-48 mx-auto rounded-2xl object-cover"
                        />
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setSelfieImage(null);
                              startCamera();
                            }}
                          >
                            إعادة
                          </Button>
                          <Button
                            variant="primary"
                            className="flex-1"
                            onClick={handleSelfieCheckIn}
                          >
                            تأكيد الحضور
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <video ref={videoRef} autoPlay playsInline className="w-full rounded-2xl" />
                        <canvas ref={canvasRef} className="hidden" />
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                            التقاط سيلفي
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-slate-400">
                            التقط صورة لتأكيد هويتك
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setShowSelfieCapture(false);
                              stopCamera();
                            }}
                          >
                            إلغاء
                          </Button>
                          <Button variant="primary" className="flex-1" onClick={captureSelfie}>
                            <Camera className="w-4 h-4 ml-1" />
                            التقاط
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pending Sync Card */}
          {pendingCheckIns.length > 0 && (
            <Card className="border-0 shadow-lg bg-amber-50 dark:bg-amber-900/20">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-amber-900 dark:text-amber-300">
                  <Upload className="w-5 h-5" />
                  سجلات معلقة للمزامنة ({pendingCheckIns.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pendingCheckIns.map((record, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/50 dark:bg-slate-800/50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                        {record.type === "qr" ? "QR" : record.type === "selfie" ? "سيلفي" : "موقع"}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-slate-300">
                        {record.location}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-slate-400">{record.time}</span>
                  </div>
                ))}
                {isOnline && (
                  <Button
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => {
                      toastSuccess(`تم مزامنة ${pendingCheckIns.length} سجل`);
                      setPendingCheckIns([]);
                      localStorage.removeItem("trax_pending_checkins");
                    }}
                  >
                    <RefreshCw className="w-4 h-4 ml-2" />
                    مزامنة الآن
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Session Status pill */}
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${
              sessionStatus.color === "amber"
                ? "bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                : sessionStatus.color === "green"
                  ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800"
                  : "bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                sessionStatus.color === "amber"
                  ? "bg-amber-500"
                  : sessionStatus.color === "green"
                    ? "bg-green-500 animate-pulse"
                    : "bg-blue-500"
              }`}
            />
            {sessionStatus.label}
            {checkOutTime && totalWorkedHours && (
              <span className="mr-auto text-xs opacity-70">{totalWorkedHours}</span>
            )}
          </div>

          <Card className="border-0 shadow-lg dark:bg-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                <Navigation className="w-4 h-4" />
                الموقع الحالي
              </CardTitle>
            </CardHeader>
            <CardContent>
              {locationError ? (
                <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl">
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  <p className="text-sm text-red-700 dark:text-red-300">{locationError}</p>
                </div>
              ) : !currentLocation ? (
                <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
                  <div className="w-5 h-5 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">جاري تحديد موقعك...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 p-4 rounded-xl">
                    <MapPin className="w-6 h-6 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-sm font-medium text-green-900 dark:text-green-300">
                        تم تحديد موقعك
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                        خط العرض: {currentLocation.lat.toFixed(4)} | خط الطول:{" "}
                        {currentLocation.lng.toFixed(4)}
                      </p>
                    </div>
                  </div>

                  {nearestGeofence && (
                    <div
                      className={`p-4 rounded-xl ${
                        isInside
                          ? "bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800"
                          : "bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${nearestGeofence.geofence.color}20` }}
                        >
                          <MapPin
                            className="w-5 h-5"
                            style={{ color: nearestGeofence.geofence.color }}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900 dark:text-slate-100">
                            {nearestGeofence.geofence.name}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-slate-400">
                            {nearestGeofence.geofence.address}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                            المسافة: {Math.round(nearestGeofence.distance)} متر | النطاق:{" "}
                            {nearestGeofence.geofence.radius} متر
                          </p>
                        </div>
                        {isInside ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                          <XCircle className="w-6 h-6 text-amber-600" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Outside geofence warning */}
          <AnimatePresence>
            {checkInStatus === "outside" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Card className="border-0 shadow-lg border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                  <CardContent className="flex items-center gap-3 py-4">
                    <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
                      <XCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-amber-900 dark:text-amber-300">
                        أنت خارج النطاق الجغرافي
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                        المسافة الحالية: {Math.round(nearestGeofence?.distance || 0)} متر — النطاق
                        المطلوب: {nearestGeofence?.geofence.radius} متر
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MainLayout>
  );
}
