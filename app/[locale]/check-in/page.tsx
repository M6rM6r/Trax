"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import MainLayout from "@/components/shared/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Timer,
  QrCode,
  Camera,
  CheckCircle,
  XCircle,
  LogOut,
  Navigation,
  MapPin,
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
import OlMap from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import OSM from "ol/source/OSM";
import Feature from "ol/Feature";
import { Point, Circle as CircleGeom } from "ol/geom";
import { fromLonLat } from "ol/proj";
import { Style, Fill, Stroke, Circle as CircleStyle } from "ol/style";
import "ol/ol.css";

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
  const [lastLocationFixAt, setLastLocationFixAt] = useState<number | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [latestLocationFixAt, setLatestLocationFixAt] = useState<number | null>(null);
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
  const [locationSync, setLocationSync] = useState<{
    pending: boolean;
    lastSuccessAt: number | null;
    lastErrorAt: number | null;
    pausedLowAccuracy: boolean;
  }>({ pending: false, lastSuccessAt: null, lastErrorAt: null, pausedLowAccuracy: false });
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
  const [attendanceMode, setAttendanceMode] = useState<"manual" | "auto_optional">("manual");
  const [autoAttempted, setAutoAttempted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastServerValidationKeyRef = useRef<string | null>(null);
  const handleCheckInRef = useRef<() => Promise<void>>(async () => {});
  const currentMiniMapRef = useRef<HTMLDivElement | null>(null);
  const currentMiniMapInstanceRef = useRef<OlMap | null>(null);
  const miniMapRef = useRef<HTMLDivElement | null>(null);
  const miniMapInstanceRef = useRef<OlMap | null>(null);

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

  useEffect(() => {
    setLinkedEmployeeId(user?.employee_id ?? null);
    setAssignedGeofenceId(user?.assigned_geofence_id ?? null);
  }, [user?.employee_id, user?.assigned_geofence_id]);

  useEffect(() => {
    if (authResolved) return;
    if (linkedEmployeeId && assignedGeofenceId !== null) {
      setAuthResolved(true);
      return;
    }

    let cancelled = false;

    const resolveMe = async () => {
      try {
        const resp = await httpClient.get<{
          success: boolean;
          data: {
            employee_id?: number | null;
            assigned_geofence_id?: number | null;
          };
        }>("auth/me");

        if (cancelled) return;
        setLinkedEmployeeId(resp.data.employee_id ?? null);
        setAssignedGeofenceId(resp.data.assigned_geofence_id ?? null);
      } catch {
        // keep fallback behavior if /auth/me is unavailable
      } finally {
        if (!cancelled) setAuthResolved(true);
      }
    };

    void resolveMe();

    return () => {
      cancelled = true;
    };
  }, [authResolved, linkedEmployeeId, assignedGeofenceId]);

  const savePendingCheckIn = useCallback(
    (record: { type: string; time: string; location: string; selfie?: string }) => {
      setPendingCheckIns((prev) => {
        const updated = [...prev, record];
        localStorage.setItem("trax_pending_checkins", JSON.stringify(updated));
        return updated;
      });
    },
    []
  );

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
    if (!navigator.geolocation) {
      setLocationError("متصفحك لا يدعم خدمة تحديد الموقع.");
      return;
    }

    const updateFromPosition = (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;
      const normalizedAccuracy = Number.isFinite(accuracy) ? accuracy : null;
      const now = Date.now();

      setLocationError(null);
      setLatestLocation({ lat: latitude, lng: longitude });
      setLatestLocationFixAt(now);
      setLatestLocationAccuracy(normalizedAccuracy);

      const TRUSTED_MAX_ACCURACY_METERS = 1000;
      const shouldTrustFix =
        normalizedAccuracy !== null && normalizedAccuracy <= TRUSTED_MAX_ACCURACY_METERS;

      if (shouldTrustFix) {
        setCurrentLocation({ lat: latitude, lng: longitude });
        setLastLocationFixAt(now);
        setLocationAccuracy(normalizedAccuracy);
      }

      let closest: { geofence: Geofence; distance: number } | null = null;
      geofences.forEach((geo) => {
        const dist = calculateDistance(latitude, longitude, geo.lat, geo.lng);
        if (!closest || dist < closest.distance) {
          closest = { geofence: geo, distance: dist };
        }
      });

      setNearestGeofence(closest);
    };

    const handleLocationError = (error: GeolocationPositionError) => {
      if (error.code === error.PERMISSION_DENIED) {
        setLocationError("تم رفض إذن الموقع. يرجى السماح بالوصول للموقع من إعدادات المتصفح.");
        return;
      }

      setLocationError("تعذر الحصول على موقعك بدقة. يرجى التأكد من تفعيل GPS والمحاولة مرة أخرى.");
    };

    const watchId = navigator.geolocation.watchPosition(updateFromPosition, handleLocationError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
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

  const assignedGeofence =
    assignedGeofenceId !== null
      ? (geofences.find((g) => g.id === assignedGeofenceId) ?? null)
      : null;

  const decisionLocation = currentLocation ?? latestLocation;

  const activeGeofenceContext = useMemo(
    () =>
      decisionLocation && assignedGeofence
        ? {
            geofence: assignedGeofence,
            distance: calculateDistance(
              decisionLocation.lat,
              decisionLocation.lng,
              assignedGeofence.lat,
              assignedGeofence.lng
            ),
            source: "assigned" as const,
          }
        : nearestGeofence
          ? { ...nearestGeofence, source: "nearest" as const }
          : null,
    [decisionLocation, assignedGeofence, nearestGeofence]
  );

  const completeLocalCheckIn = useCallback(() => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
    const locationName = activeGeofenceContext?.geofence.name || "موقع غير معروف";

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
  }, [activeGeofenceContext, isOnline, savePendingCheckIn, checkInMethod, selfieImage]);

  const handleCheckIn = async () => {
    hapticTap();
    if (checkInStatus === "success" || checkInStatus === "loading") return;

    if (!decisionLocation) {
      toastError("تعذر تسجيل الحضور قبل تحديد الموقع");
      return;
    }

    if (geofencesLoading || !authResolved) {
      toastError("جاري تحميل النطاقات الجغرافية، حاول بعد ثوانٍ");
      return;
    }

    if (geofencesError) {
      toastError("تعذر تحميل النطاقات الجغرافية");
      return;
    }

    if (geofences.length === 0) {
      toastError("لا توجد نطاقات جغرافية متاحة حالياً");
      return;
    }

    if (!activeGeofenceContext) {
      toastError("تعذر مطابقة موقعك مع أي نطاق جغرافي");
      return;
    }

    if (locationAccuracy === null && latestLocationAccuracy === null) {
      toastError("جاري تحسين دقة الموقع، حاول بعد ثوانٍ");
      return;
    }

    const canUseCoarseServerValidation =
      !isLocationReliable &&
      isOnline &&
      assignedGeofence !== null &&
      latestLocationAccuracy !== null &&
      latestLocationAccuracy <= 30000;
    const isCoarseFallbackMode = !isLocationReliable && canUseCoarseServerValidation;

    if (!isLocationReliable) {
      if (isAssignedGeofenceLikelyMismatch) {
        toastError(
          "يبدو أن النطاق المعيّن بعيد عن موقعك الحالي بشكل كبير. يرجى مراجعة تعيين النطاق مع الإدارة."
        );
        return;
      }

      if (!canUseCoarseServerValidation) {
        const gpsAccuracyText =
          latestLocationAccuracy !== null && latestLocationAccuracy > 5000
            ? "ضعيفة جدًا (أكثر من 5 كم)"
            : `ضعيفة (±${Math.round(latestLocationAccuracy ?? locationAccuracy ?? 0)}م)`;
        toastError(
          `دقة GPS الحالية ${gpsAccuracyText}. انتظر لتحسين الدقة أو استخدم جهازاً بموقع أدق.`
        );
        return;
      }
    }

    let insideDecision = statusInside;
    const isFreshServerDecision =
      serverValidation.verifiedAt !== null &&
      activeGeofenceContext &&
      serverValidation.geofenceId === activeGeofenceContext.geofence.id &&
      Date.now() - serverValidation.verifiedAt < 20000;

    if (isFreshServerDecision && serverValidation.inside !== null) {
      insideDecision = serverValidation.inside;
    } else if (isOnline) {
      try {
        const targetGeofenceId =
          isCoarseFallbackMode && assignedGeofence
            ? assignedGeofence.id
            : activeGeofenceContext.geofence.id;
        const verification = await verifyInsideFromServer(
          decisionLocation.lat,
          decisionLocation.lng,
          targetGeofenceId
        );
        if (verification) {
          if (isCoarseFallbackMode && !verification.inside) {
            setCheckInStatus("idle");
            hapticError();
            toastError(
              "دقة GPS الحالية لا تسمح بتأكيد أنك خارج النطاق. حاول مرة أخرى بعد تحسن الدقة أو انتقل لمنطقة مفتوحة."
            );
            return;
          }
          insideDecision = verification.inside;
        }
      } catch {
        if (isCoarseFallbackMode) {
          setCheckInStatus("idle");
          toastError("تعذر التحقق من الخادم مع دقة GPS منخفضة حالياً. حاول بعد ثوانٍ.");
          return;
        }
        // fallback to local decision if server-side validation is temporarily unavailable
      }
    }

    if (!insideDecision) {
      if (isCoarseFallbackMode) {
        setCheckInStatus("idle");
        toastError(
          "لا يمكن تأكيد الخروج من النطاق أثناء انخفاض دقة GPS. انتظر تحسن الدقة ثم أعد المحاولة."
        );
        return;
      }
      setCheckInStatus("outside");
      hapticError();
      toastError("أنت خارج النطاق الجغرافي المسموح لتسجيل الحضور");
      return;
    }

    setCheckInStatus("loading");

    if (isOnline && user?.id) {
      try {
        await checkInMutation.mutateAsync({
          employeeId: linkedEmployeeId ?? user.id,
          lat: decisionLocation.lat,
          lng: decisionLocation.lng,
          geofenceId:
            !isLocationReliable && assignedGeofence
              ? assignedGeofence.id
              : activeGeofenceContext.geofence.id,
        });
        completeLocalCheckIn();
        return;
      } catch {
        toastError("تعذر تسجيل الحضور عبر الخادم، سيتم الحفظ محلياً");
      }
    }

    setTimeout(() => completeLocalCheckIn(), 400);
  };

  handleCheckInRef.current = handleCheckIn;

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
        await checkOutMutation.mutateAsync({ employeeId: linkedEmployeeId ?? user.id });
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

  const effectiveRadius = activeGeofenceContext
    ? Number(activeGeofenceContext.geofence.radius) || 0
    : 0;

  const REQUIRED_ATTENDANCE_ACCURACY_METERS = 5;
  const maxReliableAccuracy = REQUIRED_ATTENDANCE_ACCURACY_METERS;

  const reliableFixAgeMs = lastLocationFixAt !== null ? Date.now() - lastLocationFixAt : null;
  const isReliableFixFresh = reliableFixAgeMs !== null && reliableFixAgeMs <= 120000;

  const isLocationReliable =
    locationAccuracy !== null && locationAccuracy <= maxReliableAccuracy && isReliableFixFresh;

  const locationAccuracyTolerance = locationAccuracy
    ? Math.max(1, Math.min(REQUIRED_ATTENDANCE_ACCURACY_METERS, Math.round(locationAccuracy)))
    : 0;

  const isInside =
    !!activeGeofenceContext &&
    isLocationReliable &&
    activeGeofenceContext.distance <= effectiveRadius + locationAccuracyTolerance;

  const statusInside =
    serverValidation.inside !== null &&
    isLocationReliable &&
    activeGeofenceContext &&
    serverValidation.geofenceId === activeGeofenceContext.geofence.id
      ? serverValidation.inside
      : isInside;

  const effectiveDistance =
    serverValidation.distance !== null &&
    activeGeofenceContext &&
    serverValidation.geofenceId === activeGeofenceContext.geofence.id
      ? serverValidation.distance
      : activeGeofenceContext?.distance || 0;

  const verifyInsideFromServer = useCallback(
    async (lat: number, lng: number, geofenceId: number) => {
      const response = await httpClient.post<{
        success: boolean;
        data: { inside: boolean; distance: number; geofence_radius: number };
      }>("/geofences/check-inside", {
        lat,
        lng,
        geofence_id: geofenceId,
      });

      const next = {
        geofenceId,
        inside: response.data.inside,
        distance: response.data.distance,
        pending: false,
        verifiedAt: Date.now(),
      };

      setServerValidation(next);
      return next;
    },
    []
  );

  const sendLocationHeartbeat = useCallback(
    async (lat: number, lng: number, employeeId: number) => {
      let batteryLevel: number | undefined;
      try {
        const nav = navigator as Navigator & {
          getBattery?: () => Promise<{ level: number }>;
        };
        if (nav.getBattery) {
          const battery = await nav.getBattery();
          batteryLevel = Math.max(0, Math.min(100, Math.round((battery.level ?? 0) * 100)));
        }
      } catch {
        // ignore battery read failures
      }

      await httpClient.post<{
        success: boolean;
        data: { lastSeen: string; serverTime: string };
      }>("/tracking/location", {
        employee_id: employeeId,
        lat,
        lng,
        accuracy: locationAccuracy,
        battery_level: batteryLevel,
        timestamp: new Date().toISOString(),
      });
    },
    [locationAccuracy]
  );

  useEffect(() => {
    if (attendanceMode !== "auto_optional") return;
    if (!isLocationReliable) return;
    if (!statusInside) return;
    if (checkInStatus !== "idle") return;
    if (autoAttempted) return;

    setAutoAttempted(true);
    const timer = setTimeout(() => {
      void handleCheckInRef.current();
    }, 2000);

    return () => clearTimeout(timer);
  }, [attendanceMode, statusInside, checkInStatus, autoAttempted, isLocationReliable]);

  useEffect(() => {
    if (!statusInside && checkInStatus === "idle") {
      setAutoAttempted(false);
    }
  }, [statusInside, checkInStatus]);

  useEffect(() => {
    if (!isOnline || !authResolved) return;
    if (!currentLocation || !activeGeofenceContext) return;
    if (!isLocationReliable) {
      setServerValidation((prev) => (prev.pending ? { ...prev, pending: false } : prev));
      return;
    }

    const validationKey = `${activeGeofenceContext.geofence.id}:${currentLocation.lat.toFixed(5)}:${currentLocation.lng.toFixed(5)}`;

    if (lastServerValidationKeyRef.current === validationKey) return;

    lastServerValidationKeyRef.current = validationKey;
    setServerValidation((prev) => ({ ...prev, pending: true }));

    let cancelled = false;
    const timer = setTimeout(() => {
      void verifyInsideFromServer(
        currentLocation.lat,
        currentLocation.lng,
        activeGeofenceContext.geofence.id
      ).catch(() => {
        if (!cancelled) {
          setServerValidation((prev) => ({ ...prev, pending: false }));
        }
      });
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    isOnline,
    authResolved,
    currentLocation,
    activeGeofenceContext,
    isLocationReliable,
    verifyInsideFromServer,
  ]);

  useEffect(() => {
    if (!isOnline || !authResolved) return;
    if (!currentLocation || !activeGeofenceContext) return;
    if (!isLocationReliable) {
      setServerValidation((prev) => (prev.pending ? { ...prev, pending: false } : prev));
      return;
    }

    const intervalId = setInterval(() => {
      setServerValidation((prev) => ({ ...prev, pending: true }));
      void verifyInsideFromServer(
        currentLocation.lat,
        currentLocation.lng,
        activeGeofenceContext.geofence.id
      ).catch(() => {
        setServerValidation((prev) => ({ ...prev, pending: false }));
      });
    }, 15000);

    return () => clearInterval(intervalId);
  }, [
    isOnline,
    authResolved,
    currentLocation,
    activeGeofenceContext,
    isLocationReliable,
    verifyInsideFromServer,
  ]);

  useEffect(() => {
    if (!isOnline || !authResolved) return;
    if (!currentLocation) return;
    if (!linkedEmployeeId) return;

    const TRACKING_MAX_ACCURACY_METERS = 1000;
    if (latestLocationAccuracy !== null && latestLocationAccuracy > TRACKING_MAX_ACCURACY_METERS) {
      setLocationSync((prev) => {
        if (prev.pending === false && prev.pausedLowAccuracy) {
          return prev;
        }

        return {
          ...prev,
          pending: false,
          pausedLowAccuracy: true,
        };
      });
      return;
    }

    let cancelled = false;

    const syncNow = () => {
      if (cancelled) return;
      setLocationSync((prev) => ({ ...prev, pending: true, pausedLowAccuracy: false }));
      void sendLocationHeartbeat(currentLocation.lat, currentLocation.lng, linkedEmployeeId)
        .then(() => {
          if (!cancelled) {
            setLocationSync({
              pending: false,
              lastSuccessAt: Date.now(),
              lastErrorAt: null,
              pausedLowAccuracy: false,
            });
          }
        })
        .catch(() => {
          if (!cancelled) {
            setLocationSync((prev) => ({
              ...prev,
              pending: false,
              lastErrorAt: Date.now(),
              pausedLowAccuracy: false,
            }));
          }
        });
    };

    syncNow();
    const intervalId = setInterval(syncNow, 8000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [
    isOnline,
    authResolved,
    currentLocation,
    linkedEmployeeId,
    sendLocationHeartbeat,
    latestLocationAccuracy,
  ]);

  const locationFixTimeText = lastLocationFixAt
    ? new Date(lastLocationFixAt).toLocaleTimeString("ar-SA", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  const latestLocationFixTimeText = latestLocationFixAt
    ? new Date(latestLocationFixAt).toLocaleTimeString("ar-SA", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  const serverVerifiedTimeText =
    serverValidation.verifiedAt &&
    activeGeofenceContext &&
    serverValidation.geofenceId === activeGeofenceContext.geofence.id
      ? new Date(serverValidation.verifiedAt).toLocaleTimeString("ar-SA", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : null;

  const locationSyncTimeText = locationSync.lastSuccessAt
    ? new Date(locationSync.lastSuccessAt).toLocaleTimeString("ar-SA", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  const displayLocation = latestLocation ?? currentLocation;
  const trustedFixAgeMinutes =
    reliableFixAgeMs !== null ? Math.floor(reliableFixAgeMs / 60000) : null;
  const isLatestAccuracyVeryWeak = latestLocationAccuracy !== null && latestLocationAccuracy > 5000;
  const isTrackingAccuracyWeak = latestLocationAccuracy !== null && latestLocationAccuracy > 1000;

  const locationSyncStatusText = (() => {
    if (!linkedEmployeeId) return "لا يوجد ربط موظف";
    if (!currentLocation) return "بانتظار قراءة صالحة";
    if (isTrackingAccuracyWeak || locationSync.pausedLowAccuracy)
      return "موقوف مؤقتاً (دقة GPS ضعيفة)";
    if (locationSync.pending) return "جاري الإرسال...";
    if (!locationSync.lastSuccessAt) return "بانتظار أول مزامنة";
    return "مزامن";
  })();

  const coarseServerFallbackEligible =
    !isLocationReliable &&
    isOnline &&
    assignedGeofence !== null &&
    latestLocationAccuracy !== null &&
    latestLocationAccuracy <= 30000;

  const assignedGeofenceDistance =
    activeGeofenceContext?.source === "assigned" ? activeGeofenceContext.distance : null;

  const formatDistanceReadable = (distanceMeters: number): string => {
    if (distanceMeters >= 1000) {
      const km = distanceMeters / 1000;
      return `${km >= 10 ? km.toFixed(0) : km.toFixed(1)} كم`;
    }

    return `${Math.round(distanceMeters)} متر`;
  };

  useEffect(() => {
    if (!currentMiniMapRef.current || !displayLocation) return;

    const center = fromLonLat([displayLocation.lng, displayLocation.lat]);
    const source = new VectorSource();

    const accuracyMeters =
      latestLocationAccuracy !== null && Number.isFinite(latestLocationAccuracy)
        ? Math.max(20, Math.min(latestLocationAccuracy, 8000))
        : 80;

    const accuracyCircle = new Feature({
      geometry: new CircleGeom(center, accuracyMeters),
    });
    accuracyCircle.setStyle(
      new Style({
        stroke: new Stroke({ color: "#3B82F6", width: 2 }),
        fill: new Fill({ color: "#3B82F633" }),
      })
    );
    source.addFeature(accuracyCircle);

    const marker = new Feature({
      geometry: new Point(center),
    });
    marker.setStyle(
      new Style({
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({ color: "#2563EB" }),
          stroke: new Stroke({ color: "#ffffff", width: 2 }),
        }),
      })
    );
    source.addFeature(marker);

    const vectorLayer = new VectorLayer({ source });

    if (!currentMiniMapInstanceRef.current) {
      currentMiniMapInstanceRef.current = new OlMap({
        target: currentMiniMapRef.current,
        layers: [new TileLayer({ source: new OSM() }), vectorLayer],
        view: new View({ center, zoom: 16 }),
      });
    } else {
      const map = currentMiniMapInstanceRef.current;
      map.getLayers().setAt(1, vectorLayer);
      map.getView().setCenter(center);
      map.getView().setZoom(16);
      map.updateSize();
    }

    return () => {
      currentMiniMapInstanceRef.current?.updateSize();
    };
  }, [displayLocation, latestLocationAccuracy]);

  useEffect(() => {
    if (!miniMapRef.current || !activeGeofenceContext) return;

    const { geofence } = activeGeofenceContext;
    const center = fromLonLat([geofence.lng, geofence.lat]);

    const source = new VectorSource();

    const geofenceCircle = new Feature({
      geometry: new CircleGeom(center, geofence.radius),
    });
    geofenceCircle.setStyle(
      new Style({
        stroke: new Stroke({ color: geofence.color, width: 2 }),
        fill: new Fill({ color: `${geofence.color}22` }),
      })
    );
    source.addFeature(geofenceCircle);

    const centerMarker = new Feature({
      geometry: new Point(center),
    });
    centerMarker.setStyle(
      new Style({
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({ color: geofence.color }),
          stroke: new Stroke({ color: "#ffffff", width: 2 }),
        }),
      })
    );
    source.addFeature(centerMarker);

    const vectorLayer = new VectorLayer({ source });

    if (!miniMapInstanceRef.current) {
      miniMapInstanceRef.current = new OlMap({
        target: miniMapRef.current,
        layers: [new TileLayer({ source: new OSM() }), vectorLayer],
        view: new View({
          center,
          zoom: 16,
        }),
      });
    } else {
      const map = miniMapInstanceRef.current;
      map.getLayers().setAt(1, vectorLayer);
      map.getView().setCenter(center);
      map.getView().setZoom(16);
      map.updateSize();
    }

    return () => {
      miniMapInstanceRef.current?.updateSize();
    };
  }, [activeGeofenceContext]);

  useEffect(() => {
    return () => {
      if (miniMapInstanceRef.current) {
        miniMapInstanceRef.current.setTarget(undefined);
        miniMapInstanceRef.current = null;
      }

      if (currentMiniMapInstanceRef.current) {
        currentMiniMapInstanceRef.current.setTarget(undefined);
        currentMiniMapInstanceRef.current = null;
      }
    };
  }, []);

  const assignedGeofenceDistanceText =
    assignedGeofenceDistance !== null ? formatDistanceReadable(assignedGeofenceDistance) : null;

  const assignedDistanceAfterAccuracyCompensation =
    assignedGeofenceDistance !== null
      ? assignedGeofenceDistance - (latestLocationAccuracy ?? 0)
      : null;

  const isAssignedGeofenceLikelyMismatch =
    !isLocationReliable &&
    assignedDistanceAfterAccuracyCompensation !== null &&
    assignedDistanceAfterAccuracyCompensation > 3000;

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
              {attendanceMode === "auto_optional" && checkInStatus === "idle" && statusInside && (
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
                    disabled={
                      checkInStatus === "loading" ||
                      checkInStatus === "success" ||
                      geofencesLoading ||
                      !authResolved
                    }
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
                    ) : geofencesLoading || !authResolved ? (
                      <>
                        <RefreshCw className="w-8 h-8 sm:w-10 sm:h-10 text-white animate-spin" />
                        <span className="text-white text-[10px] sm:text-xs font-bold">
                          تحميل النطاق
                        </span>
                      </>
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
                          {activeGeofenceContext?.geofence.name || "—"}
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
                      <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                        {isLocationReliable ? (
                          <>
                            المسافة: {Math.round(effectiveDistance)} متر | النطاق:{" "}
                            {Math.round(effectiveRadius)} متر
                            {locationAccuracyTolerance > 0 && (
                              <> | هامش دقة: +{locationAccuracyTolerance} متر</>
                            )}
                            {serverValidation.pending && <> | جاري التحقق من الخادم...</>}
                          </>
                        ) : (
                          <>
                            قياس المسافة معلق حتى تتوفر قراءة موثوقة (دقة ≤ {maxReliableAccuracy}م
                            وخلال آخر دقيقتين)
                          </>
                        )}
                      </p>
                      {isAssignedGeofenceLikelyMismatch && (
                        <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-red-300 bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          تعيين النطاق غير مطابق لموقعك الحالي
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
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
                        <Image
                          src={selfieImage}
                          alt="Selfie"
                          width={192}
                          height={192}
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
              ) : !latestLocation && !currentLocation ? (
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
                      {displayLocation && (
                        <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                          خط العرض: {displayLocation.lat.toFixed(4)} | خط الطول:{" "}
                          {displayLocation.lng.toFixed(4)}
                        </p>
                      )}
                      {latestLocationAccuracy !== null && (
                        <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                          أحدث قراءة GPS:{" "}
                          {isLatestAccuracyVeryWeak
                            ? "ضعيفة جدًا (أكثر من 5 كم)"
                            : `±${Math.round(latestLocationAccuracy)} متر`}
                          {latestLocationFixTimeText && (
                            <> | وقت القراءة: {latestLocationFixTimeText}</>
                          )}
                        </p>
                      )}
                      {displayLocation && (
                        <div className="mt-2 overflow-hidden rounded-lg border border-green-200 dark:border-green-800">
                          <div
                            ref={currentMiniMapRef}
                            className="h-28 w-full dark:[&_.ol-layer]:filter dark:[&_.ol-layer]:invert-[1] dark:[&_.ol-layer]:hue-rotate-180 dark:[&_.ol-layer]:brightness-[0.9] dark:[&_.ol-layer]:contrast-[0.9]"
                            aria-label="خريطة مصغرة للموقع الحالي"
                          />
                        </div>
                      )}
                      {locationAccuracy !== null && (
                        <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                          آخر قراءة موثوقة: ±{Math.round(locationAccuracy)} متر
                          {locationFixTimeText && <> | وقت القراءة: {locationFixTimeText}</>}
                          {!isReliableFixFresh && trustedFixAgeMinutes !== null && (
                            <> | قديمة منذ {trustedFixAgeMinutes} دقيقة</>
                          )}
                        </p>
                      )}
                      {locationAccuracy === null && (
                        <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                          لا توجد قراءة موثوقة بعد لاتخاذ قرار الحضور.
                        </p>
                      )}
                      <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                        مزامنة موقع الموظف: {locationSyncStatusText}
                        {locationSyncTimeText && <> | آخر مزامنة: {locationSyncTimeText}</>}
                      </p>
                    </div>
                  </div>

                  {geofencesLoading && (
                    <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
                      <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        جاري تحميل النطاقات الجغرافية...
                      </p>
                    </div>
                  )}

                  {!geofencesLoading && geofencesError && (
                    <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl">
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      <p className="text-sm text-red-700 dark:text-red-300">
                        تعذر تحميل النطاقات الجغرافية
                      </p>
                    </div>
                  )}

                  {!geofencesLoading && !geofencesError && geofences.length === 0 && (
                    <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl">
                      <XCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        لا توجد نطاقات جغرافية متاحة لهذا الحساب
                      </p>
                    </div>
                  )}

                  {activeGeofenceContext && (
                    <div
                      className={`p-4 rounded-xl ${
                        !isLocationReliable
                          ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800"
                          : statusInside
                            ? "bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800"
                            : "bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${activeGeofenceContext.geofence.color}20` }}
                        >
                          <MapPin
                            className="w-5 h-5"
                            style={{ color: activeGeofenceContext.geofence.color }}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900 dark:text-slate-100">
                            {activeGeofenceContext.geofence.name}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-slate-400">
                            {activeGeofenceContext.geofence.address}
                          </p>
                          <div className="mt-2 overflow-hidden rounded-lg border border-gray-200 dark:border-slate-700">
                            <div
                              ref={miniMapRef}
                              className="h-28 w-full dark:[&_.ol-layer]:filter dark:[&_.ol-layer]:invert-[1] dark:[&_.ol-layer]:hue-rotate-180 dark:[&_.ol-layer]:brightness-[0.9] dark:[&_.ol-layer]:contrast-[0.9]"
                              aria-label="خريطة مصغرة لموقع النطاق"
                            />
                          </div>
                          {activeGeofenceContext.source === "assigned" && (
                            <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5">
                              النطاق المعيّن لك
                            </p>
                          )}
                          {assignedGeofenceDistanceText && (
                            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                              البعد التقديري عن مركز النطاق: {assignedGeofenceDistanceText}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                            {isLocationReliable ? (
                              <>
                                المسافة: {Math.round(effectiveDistance)} متر | النطاق:{" "}
                                {Math.round(effectiveRadius)} متر
                                {locationAccuracyTolerance > 0 && (
                                  <> | هامش دقة: +{locationAccuracyTolerance} متر</>
                                )}
                                {serverValidation.pending && <> | جاري التحقق من الخادم...</>}
                              </>
                            ) : (
                              <>
                                قياس المسافة معلق حتى تتوفر قراءة موثوقة (دقة ≤{" "}
                                {maxReliableAccuracy}م وخلال آخر دقيقتين)
                              </>
                            )}
                          </p>
                          {isAssignedGeofenceLikelyMismatch && (
                            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-red-300 bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
                              <span className="w-2 h-2 rounded-full bg-red-500" />
                              تعيين النطاق غير مطابق لموقعك الحالي
                            </div>
                          )}
                          <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
                            مصدر القرار:{" "}
                            {isLocationReliable
                              ? serverVerifiedTimeText
                                ? "الخادم"
                                : "محلي"
                              : "معلق بسبب ضعف/قدم القراءة"}
                            {serverVerifiedTimeText && <> | آخر تحقق: {serverVerifiedTimeText}</>}
                          </p>
                        </div>
                        {statusInside ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : !isLocationReliable ? (
                          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                        ) : (
                          <XCircle className="w-6 h-6 text-amber-600" />
                        )}
                      </div>
                      {!isLocationReliable && latestLocationAccuracy !== null && (
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                          أحدث قراءة GPS غير مستقرة
                          {isLatestAccuracyVeryWeak
                            ? " (ضعيفة جدًا: أكثر من 5 كم)."
                            : ` (±${Math.round(latestLocationAccuracy)}م).`}{" "}
                          يلزم دقة ≤{maxReliableAccuracy}م مع قراءة حديثة لاتخاذ قرار حضور دقيق.
                          {isAssignedGeofenceLikelyMismatch ? (
                            <>
                              {" "}
                              كما يبدو أن النطاق المعيّن بعيد عن موقعك الحالي. يرجى التأكد من تعيين
                              النطاق الصحيح للموظف من صفحة الإدارة.
                              {assignedGeofenceDistanceText && (
                                <> (البعد الحالي: {assignedGeofenceDistanceText}).</>
                              )}
                            </>
                          ) : coarseServerFallbackEligible ? (
                            <>
                              {" "}
                              يمكنك الضغط على «تسجيل الحضور» لمحاولة تحقق خادمي باستخدام النطاق
                              المعيّن.
                            </>
                          ) : null}
                        </p>
                      )}
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
                        {!isLocationReliable ? (
                          <>
                            لا يمكن تأكيد الخروج من النطاق حالياً لأن قراءة الموقع غير موثوقة. انتظر
                            تحسن الإشارة أو تحرك لمنطقة مفتوحة.
                          </>
                        ) : (
                          <>
                            المسافة الحالية: {Math.round(effectiveDistance)} متر — النطاق المطلوب:{" "}
                            {Math.round(effectiveRadius)} متر
                            {locationAccuracyTolerance > 0 && (
                              <>
                                {" "}
                                (مع هامش الدقة:{" "}
                                {Math.round(effectiveRadius + locationAccuracyTolerance)} متر)
                              </>
                            )}
                          </>
                        )}
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
