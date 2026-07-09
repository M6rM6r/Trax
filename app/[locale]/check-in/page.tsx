"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import MainLayout from "@/components/shared/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Timer,
  QrCode,
  Camera,
  CheckCircle,
  XCircle,
  LogOut,
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
import { httpClient } from "@/lib/services/httpClient";
import Image from "next/image";

function LiveClock() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })
      );
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
      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400 font-medium uppercase tracking-widest mt-1 opacity-80">{date}</p>
    </div>
  );
}

export default function CheckInPage() {
  const {
    data: geofences = [],
    isLoading: geofencesLoading,
    isError: geofencesError,
  } = useGeofences();
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();
  const { user } = useAuthStore();
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [latestLocation, setLatestLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [latestLocationAccuracy, setLatestLocationAccuracy] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [nearestGeofence, setNearestGeofence] = useState<{
    geofence: Geofence;
    distance: number;
  } | null>(null);
  const [serverValidation, setServerValidation] = useState<{
    geofenceId: number | null;
    inside: boolean | null;
    distance: number | null;
    pending: boolean;
    verifiedAt: number | null;
  }>({ geofenceId: null, inside: null, distance: null, pending: false, verifiedAt: null });
  const [authResolved, setAuthResolved] = useState(false);
  const [linkedEmployeeId, setLinkedEmployeeId] = useState<number | null>(
    user?.employee_id ?? null
  );
  const [assignedGeofenceId, setAssignedGeofenceId] = useState<number | null>(
    user?.assigned_geofence_id ?? null
  );
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastServerValidationKeyRef = useRef<string | null>(null);

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

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("الموقع غير مدعوم");
      return;
    }

    const updateFromPosition = (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;
      setLocationError(null);
      setLatestLocation({ lat: latitude, lng: longitude });
      setLatestLocationAccuracy(accuracy);
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
    };

    const watchId = navigator.geolocation.watchPosition(updateFromPosition, () => setLocationError("تعذر الحصول على الموقع"), {
      enableHighAccuracy: true,
      timeout: 10000,
    });

    return () => navigator.geolocation.clearWatch(watchId);
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
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch { toastError("تعذر الوصول للكاميرا"); }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
  }, []);

  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    setSelfieImage(canvas.toDataURL("image/jpeg"));
    stopCamera();
  };

  const handleCheckIn = async () => {
    hapticTap();
    if (checkInStatus === "success" || checkInStatus === "loading" || !currentLocation) return;

    setCheckInStatus("loading");

    // Simple logic for speed on mobile
    const dist = nearestGeofence?.distance ?? 9999;
    const radius = nearestGeofence?.geofence.radius ?? 0;

    if (dist > radius + 50) {
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
      });

      const now = new Date();
      setCheckInTime(now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }));
      setCheckInTimestamp(now.getTime());
      setCheckInStatus("success");
      hapticSuccess();
      fireConfetti();
    } catch {
      setCheckInStatus("idle");
      toastError("فشل تسجيل الحضور");
    }
  };

  const handleCheckOut = async () => {
    setCheckOutStatus("loading");
    try {
      await checkOutMutation.mutateAsync({ employeeId: user?.employee_id ?? 0 });
      setCheckOutTime(new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }));
    } finally {
      setCheckOutStatus("idle");
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-4 max-w-md mx-auto">

        {/* Compact Hero Section */}
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-900 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500" />
          <CardContent className="pt-8 pb-6 px-4">
            <LiveClock />

            <div className="flex justify-center mt-8 relative">
              <AnimatePresence mode="wait">
                <motion.button
                  key={checkInStatus}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCheckIn}
                  disabled={checkInStatus === "success" || checkInStatus === "loading"}
                  className={cn(
                    "w-32 h-32 rounded-full flex flex-col items-center justify-center gap-1 shadow-xl transition-all border-4 border-white dark:border-slate-800",
                    checkInStatus === "success" ? "bg-green-500 text-white" :
                    checkInStatus === "outside" ? "bg-amber-500 text-white" : "bg-blue-600 text-white"
                  )}
                >
                  {checkInStatus === "loading" ? (
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  ) : checkInStatus === "success" ? (
                    <CheckCircle className="w-10 h-10" />
                  ) : (
                    <>
                      <CheckCircle className="w-10 h-10" />
                      <span className="text-sm font-bold">تسجيل</span>
                    </>
                  )}
                </motion.button>
              </AnimatePresence>
            </div>

            <div className="text-center mt-6">
              {locationError ? (
                <p className="text-xs text-red-500 font-medium">{locationError}</p>
              ) : nearestGeofence ? (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-slate-800 rounded-full">
                  <span className={cn("w-2 h-2 rounded-full", nearestGeofence.distance <= (nearestGeofence.geofence.radius + 50) ? "bg-green-500" : "bg-amber-500")} />
                  <span className="text-[10px] font-bold dark:text-slate-300">
                    {nearestGeofence.geofence.name} · {Math.round(nearestGeofence.distance)}م
                  </span>
                </div>
              ) : <p className="text-xs text-gray-400 animate-pulse">جاري تحديد الموقع...</p>}
            </div>
          </CardContent>
        </Card>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-0 shadow-md dark:bg-slate-900 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors" onClick={() => setShowQRScanner(true)}>
            <CardContent className="p-4 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <QrCode className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold dark:text-slate-200">QR Code</span>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md dark:bg-slate-900 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors" onClick={() => { setShowSelfieCapture(true); startCamera(); }}>
            <CardContent className="p-4 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Camera className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold dark:text-slate-200">سيلفي</span>
            </CardContent>
          </Card>
        </div>

        {/* Stats / Status Pill */}
        {(checkInTime || checkOutTime) && (
          <Card className="border-0 shadow-md dark:bg-slate-900">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs font-bold dark:text-slate-200">وقت الحضور</span>
                </div>
                <span className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400">{checkInTime}</span>
              </div>

              {checkOutTime ? (
                <div className="flex justify-between items-center border-t dark:border-slate-800 pt-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-xs font-bold dark:text-slate-200">وقت الانصراف</span>
                  </div>
                  <span className="text-sm font-mono font-bold text-red-500">{checkOutTime}</span>
                </div>
              ) : checkInStatus === "success" && (
                <div className="flex justify-center border-t dark:border-slate-800 pt-3">
                   <Button variant="ghost" size="sm" className="text-red-500 text-xs gap-2" onClick={handleCheckOut}>
                     <LogOut className="w-4 h-4" /> إنهاء الدوام ({elapsedTime})
                   </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Offline / Sync Status */}
        {!isOnline && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg border border-amber-100 dark:border-amber-900/30">
            <WifiOff className="w-4 h-4" />
            <span className="text-[10px] font-bold">تعمل بدون اتصال · سيتم المزامنة لاحقاً</span>
          </div>
        )}
      </div>

      {/* Modals are unchanged but remain for functionality */}
      <AnimatePresence>
        {showQRScanner && (
           <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-6" onClick={() => setShowQRScanner(false)}>
             <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-xs w-full text-center" onClick={e => e.stopPropagation()}>
                <QrCode className="w-24 h-24 mx-auto text-blue-500 mb-4" />
                <h3 className="font-bold mb-2 dark:text-white">امسح الكود</h3>
                <p className="text-xs text-gray-500 mb-6">وجه الكاميرا نحو رمز QR في مقر العمل</p>
                <Button className="w-full" onClick={() => setShowQRScanner(false)}>إغلاق</Button>
             </div>
           </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSelfieCapture && (
           <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4">
             <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden max-w-sm w-full">
                {selfieImage ? (
                  <div className="p-4 text-center">
                    <img src={selfieImage} className="w-full rounded-xl mb-4" alt="selfie" />
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => { setSelfieImage(null); startCamera(); }}>إعادة</Button>
                      <Button className="flex-1" onClick={() => setShowSelfieCapture(false)}>تأكيد</Button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <video ref={videoRef} autoPlay playsInline className="w-full aspect-square object-cover" />
                    <div className="absolute bottom-6 left-0 w-full flex justify-center gap-4">
                      <Button variant="secondary" onClick={() => { stopCamera(); setShowSelfieCapture(false); }}>إلغاء</Button>
                      <Button onClick={captureSelfie} className="rounded-full w-12 h-12 p-0"><Camera /></Button>
                    </div>
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                )}
             </div>
           </div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
}
