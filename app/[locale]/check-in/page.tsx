"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  Clock,
  Briefcase,
  RotateCcw,
} from "lucide-react";
import { useCheckIn, useCheckOut, useGeofences, useEmployees, useAttendance } from "@/hooks/useApi";
import { hapticSuccess, hapticError, hapticTap } from "@/lib/utils/haptics";
import { fireConfetti } from "@/lib/utils/confetti";
import { toastSuccess, toastError } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import type { Geofence } from "@/lib/types/trackingTypes";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCompanySettingsStore } from "@/stores/useCompanySettingsStore";
import { cn } from "@/lib/utils";
import { addToOfflineQueue, addToOfflineCheckOutQueue } from "@/lib/utils/offlineQueue";
import { calculateDistance, GEOFENCE_DISTANCE_BUFFER_METERS } from "@/lib/utils/geo";

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
      <p className="text-4xl sm:text-5xl font-extrabold tracking-tighter tabular-nums text-foreground">
        {time}
      </p>
      <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1 opacity-80">
        {date}
      </p>
    </div>
  );
}

export default function CheckInPage() {
  const {
    data: geofences = [],
    isLoading: geofencesLoading,
    isError: geofencesError,
  } = useGeofences();
  const { data: employees = [] } = useEmployees();
  const { data: attendanceRecords = [] } = useAttendance();
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();
  const { user, companyName } = useAuthStore();
  const companySettings = useCompanySettingsStore();
  const todayStr = new Date().toLocaleDateString("sv-SE");
  const todayRecord = attendanceRecords.find(
    (r) => r.date === todayStr && String(r.employeeId) === String(user?.employee_id)
  );

  const currentEmployee = employees.find((e) => String(e.id) === String(user?.employee_id));
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
  const [showBurst, setShowBurst] = useState(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [elapsedTime, setElapsedTime] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const autoCheckInTriggered = useRef(false);
  const burstTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Restore check-in state from today's attendance record (survives page refresh)
  useEffect(() => {
    if (!todayRecord) return;
    if (todayRecord.checkInTime) {
      setCheckInTime(todayRecord.checkInTime);
      const checkInDate = new Date(`${todayRecord.date}T${todayRecord.checkInTime}`);
      if (!isNaN(checkInDate.getTime())) {
        setCheckInTimestamp(checkInDate.getTime());
      }
      setCheckInStatus("success");
      autoCheckInTriggered.current = true;
    }
    if (todayRecord.checkOutTime) {
      setCheckOutTime(todayRecord.checkOutTime);
    }
  }, [todayRecord]);

  const geofencesRef = useRef(geofences);
  geofencesRef.current = geofences;

  const updateFromPosition = useCallback((position: GeolocationPosition) => {
    const { latitude, longitude } = position.coords;
    setLocationError(null);
    setCurrentLocation({ lat: latitude, lng: longitude });

    let closest: { geofence: Geofence; distance: number } | null = null;
    geofencesRef.current.forEach((geo) => {
      const dist = calculateDistance(latitude, longitude, geo.lat, geo.lng);
      if (!closest || dist < closest.distance) {
        closest = { geofence: geo, distance: dist };
      }
    });
    setNearestGeofence(closest);
  }, []);

  const handleLocationError = useCallback((err: GeolocationPositionError) => {
    let message = "تعذر الحصول على الموقع";
    if (err.code === err.PERMISSION_DENIED) {
      message = "تم رفض إذن الموقع — يرجى السماح بالوصول للموقع في إعدادات المتصفح";
    } else if (err.code === err.POSITION_UNAVAILABLE) {
      message = "تعذر تحديد الموقع — تأكد من تفعيل GPS";
    } else if (err.code === err.TIMEOUT) {
      message = "انتهت مهلة تحديد الموقع — حاول مرة أخرى";
    }
    console.warn("[geolocation] error:", err.code, err.message);
    setLocationError(message);
  }, []);

  const refreshLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("الموقع غير مدعوم على هذا الجهاز");
      return;
    }
    navigator.geolocation.getCurrentPosition(updateFromPosition, handleLocationError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000,
    });
  }, [updateFromPosition, handleLocationError]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("الموقع غير مدعوم على هذا الجهاز");
      return;
    }
    refreshLocation();
    const id = navigator.geolocation.watchPosition(updateFromPosition, handleLocationError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000,
    });
    return () => navigator.geolocation.clearWatch(id);
  }, [updateFromPosition, refreshLocation, handleLocationError]);

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

  // Auto check-in when entering geofence (if enabled by company settings)

  useEffect(() => {
    return () => {
      if (burstTimeoutRef.current) clearTimeout(burstTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!companySettings.autoCheckInEnabled) return;
    if (checkInStatus === "success" || checkInStatus === "loading") return;
    if (!currentLocation || !user?.employee_id) return;
    if (autoCheckInTriggered.current) return;

    const isWithinAutoRange = nearestGeofence
      ? nearestGeofence.distance <=
        nearestGeofence.geofence.radius + companySettings.autoCheckInRadiusOffset
      : false;

    if (isWithinAutoRange) {
      autoCheckInTriggered.current = true;
      // Trigger check-in automatically
      (async () => {
        if (!navigator.onLine) {
          addToOfflineQueue({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            employeeId: user.employee_id!,
            employeeName: user.name,
            lat: currentLocation.lat,
            lng: currentLocation.lng,
            geofenceId: nearestGeofence?.geofence ? nearestGeofence.geofence.id : null,
            timestamp: Date.now(),
            requireGeofenceForCheckIn: companySettings.requireGeofenceForCheckIn,
            allowCheckInOutsideGeofence: companySettings.allowCheckInOutsideGeofence,
          });
          const now = new Date();
          setCheckInTime(now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }));
          setCheckInTimestamp(now.getTime());
          setCheckInStatus("success");
          setShowBurst(true);
          if (burstTimeoutRef.current) clearTimeout(burstTimeoutRef.current);
          burstTimeoutRef.current = setTimeout(() => setShowBurst(false), 600);
          hapticSuccess();
          toastSuccess("تم تسجيل الحضور تلقائياً (بدون اتصال)");
          return;
        }
        setCheckInStatus("loading");
        try {
          await checkInMutation.mutateAsync({
            employeeId: user.employee_id!,
            employeeName: user.name,
            lat: currentLocation.lat,
            lng: currentLocation.lng,
            ...(nearestGeofence?.geofence ? { geofenceId: nearestGeofence.geofence.id } : {}),
            companySettings: {
              workStartTime: companySettings.workStartTime,
              workEndTime: companySettings.workEndTime,
              gracePeriodMinutes: companySettings.gracePeriodMinutes,
              lateThresholdMinutes: companySettings.lateThresholdMinutes,
              attendanceMode: companySettings.attendanceMode,
              defaultShift: companySettings.defaultShift,
              morningShift: companySettings.morningShift,
              eveningShift: companySettings.eveningShift,
              seasonalAttendanceEnabled: companySettings.seasonalAttendanceEnabled,
              seasonalMonths: companySettings.seasonalMonths,
              seasonalShift: companySettings.seasonalShift,
              autoCheckInEnabled: companySettings.autoCheckInEnabled,
              autoCheckInRadiusOffset: companySettings.autoCheckInRadiusOffset,
              notificationsEnabled: companySettings.notificationsEnabled,
              lateAlertsEnabled: companySettings.lateAlertsEnabled,
              attendanceAlertsEnabled: companySettings.attendanceAlertsEnabled,
              geofenceBreachAlertsEnabled: companySettings.geofenceBreachAlertsEnabled,
              anomalyAlertsEnabled: companySettings.anomalyAlertsEnabled,
              emailNotificationsEnabled: companySettings.emailNotificationsEnabled,
              pushNotificationsEnabled: companySettings.pushNotificationsEnabled,
              checkInReminderEnabled: companySettings.checkInReminderEnabled,
              checkInReminderTime: companySettings.checkInReminderTime,
              sessionTimeoutMinutes: companySettings.sessionTimeoutMinutes,
              autoSignOutEnabled: companySettings.autoSignOutEnabled,
              autoSignOutTime: companySettings.autoSignOutTime,
              requireGeofenceForCheckIn: companySettings.requireGeofenceForCheckIn,
              allowCheckInOutsideGeofence: companySettings.allowCheckInOutsideGeofence,
              companyName: companySettings.companyName,
              timezone: companySettings.timezone,
              weekendDays: companySettings.weekendDays,
            },
            employee: currentEmployee ?? null,
          });
          const now = new Date();
          setCheckInTime(now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }));
          setCheckInTimestamp(now.getTime());
          setCheckInStatus("success");
          setShowBurst(true);
          if (burstTimeoutRef.current) clearTimeout(burstTimeoutRef.current);
          burstTimeoutRef.current = setTimeout(() => setShowBurst(false), 600);
          hapticSuccess();
          fireConfetti();
          toastSuccess("تم تسجيل الحضور تلقائياً");
        } catch (err) {
          console.error("[auto-check-in] failed:", err);
          setCheckInStatus("idle");
          autoCheckInTriggered.current = false;
        }
      })();
    }
  }, [
    companySettings,
    companySettings.autoCheckInEnabled,
    companySettings.autoCheckInRadiusOffset,
    checkInStatus,
    currentLocation,
    nearestGeofence,
    user,
    checkInMutation,
    currentEmployee,
  ]);

  // Physical relation to the closest geofence (only for UI / feedback)
  const isWithinRange = nearestGeofence
    ? nearestGeofence.distance <= nearestGeofence.geofence.radius + GEOFENCE_DISTANCE_BUFFER_METERS
    : false;

  const geofencesLoaded = !geofencesLoading && !geofencesError;
  const noGeofencesConfigured = geofencesLoaded && geofences.length === 0;

  // Permission to check in based on location + company policy
  const canCheckIn =
    isWithinRange ||
    companySettings.allowCheckInOutsideGeofence ||
    !companySettings.requireGeofenceForCheckIn ||
    noGeofencesConfigured;

  const handleCheckIn = async () => {
    hapticTap();
    if (checkInStatus === "success" || checkInStatus === "loading" || !currentLocation) return;

    setCheckInStatus("loading");

    if (!canCheckIn) {
      setCheckInStatus("outside");
      hapticError();
      toastError("أنت خارج النطاق الجغرافي — الحضور خارج النطاق غير مسموح");
      return;
    }

    if (!user?.employee_id) {
      setCheckInStatus("idle");
      hapticError();
      toastError("لا يوجد معرف موظف مرتبط بحسابك — يرجى التواصل مع الإدارة");
      return;
    }

    // Offline check-in: queue locally and show success
    if (!navigator.onLine) {
      addToOfflineQueue({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        employeeId: user.employee_id,
        employeeName: user.name,
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        geofenceId: nearestGeofence?.geofence ? nearestGeofence.geofence.id : null,
        timestamp: Date.now(),
        requireGeofenceForCheckIn: companySettings.requireGeofenceForCheckIn,
        allowCheckInOutsideGeofence: companySettings.allowCheckInOutsideGeofence,
      });
      const nowOffline = new Date();
      setCheckInTime(
        nowOffline.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })
      );
      setCheckInTimestamp(nowOffline.getTime());
      setCheckInStatus("success");
      setShowBurst(true);
      if (burstTimeoutRef.current) clearTimeout(burstTimeoutRef.current);
      burstTimeoutRef.current = setTimeout(() => setShowBurst(false), 600);
      hapticSuccess();
      toastSuccess("تم تسجيل الحضور بدون اتصال — سيتم المزامنة عند عودة الإنترنت");
      return;
    }

    try {
      await checkInMutation.mutateAsync({
        employeeId: user.employee_id,
        employeeName: user.name,
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        ...(nearestGeofence?.geofence ? { geofenceId: nearestGeofence.geofence.id } : {}),
        companySettings: {
          workStartTime: companySettings.workStartTime,
          workEndTime: companySettings.workEndTime,
          gracePeriodMinutes: companySettings.gracePeriodMinutes,
          lateThresholdMinutes: companySettings.lateThresholdMinutes,
          attendanceMode: companySettings.attendanceMode,
          defaultShift: companySettings.defaultShift,
          morningShift: companySettings.morningShift,
          eveningShift: companySettings.eveningShift,
          seasonalAttendanceEnabled: companySettings.seasonalAttendanceEnabled,
          seasonalMonths: companySettings.seasonalMonths,
          seasonalShift: companySettings.seasonalShift,
          autoCheckInEnabled: companySettings.autoCheckInEnabled,
          autoCheckInRadiusOffset: companySettings.autoCheckInRadiusOffset,
          notificationsEnabled: companySettings.notificationsEnabled,
          lateAlertsEnabled: companySettings.lateAlertsEnabled,
          attendanceAlertsEnabled: companySettings.attendanceAlertsEnabled,
          geofenceBreachAlertsEnabled: companySettings.geofenceBreachAlertsEnabled,
          anomalyAlertsEnabled: companySettings.anomalyAlertsEnabled,
          emailNotificationsEnabled: companySettings.emailNotificationsEnabled,
          pushNotificationsEnabled: companySettings.pushNotificationsEnabled,
          checkInReminderEnabled: companySettings.checkInReminderEnabled,
          checkInReminderTime: companySettings.checkInReminderTime,
          sessionTimeoutMinutes: companySettings.sessionTimeoutMinutes,
          autoSignOutEnabled: companySettings.autoSignOutEnabled,
          autoSignOutTime: companySettings.autoSignOutTime,
          requireGeofenceForCheckIn: companySettings.requireGeofenceForCheckIn,
          allowCheckInOutsideGeofence: companySettings.allowCheckInOutsideGeofence,
          companyName: companySettings.companyName,
          timezone: companySettings.timezone,
          weekendDays: companySettings.weekendDays,
        },
        employee: currentEmployee ?? null,
      });

      const now = new Date();
      setCheckInTime(now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }));
      setCheckInTimestamp(now.getTime());
      setCheckInStatus("success");
      setShowBurst(true);
      if (burstTimeoutRef.current) clearTimeout(burstTimeoutRef.current);
      burstTimeoutRef.current = setTimeout(() => setShowBurst(false), 600);
      hapticSuccess();
      fireConfetti();
      toastSuccess("تم تسجيل الحضور بنجاح");
    } catch (err) {
      console.error("[check-in] failed:", err);
      setCheckInStatus("idle");
      const errMsg = err instanceof Error ? err.message : String(err);
      if (
        errMsg === "AUTH_EXPIRED" ||
        errMsg.includes("permission") ||
        errMsg.includes("PERMISSION")
      ) {
        toastError("انتهت الجلسة — يرجى تسجيل الدخول مرة أخرى");
        setTimeout(() => {
          if (typeof window !== "undefined") {
            const pathParts = window.location.pathname.split("/");
            const detectedLocale = pathParts[1] === "en" ? "en" : "ar";
            window.location.href = `/${detectedLocale}/login?reason=session_expired`;
          }
        }, 1500);
      } else {
        toastError("فشل تسجيل الحضور — تأكد من اتصال الإنترنت وحاول مرة أخرى");
      }
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
      if (!user?.employee_id) {
        hapticError();
        toastError("لا يوجد معرف موظف مرتبط بحسابك");
        setCheckOutStatus("idle");
        return;
      }

      // Offline check-out: queue locally and show success
      if (!navigator.onLine) {
        addToOfflineCheckOutQueue({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          employeeId: user.employee_id,
          timestamp: Date.now(),
        });
        setCheckOutTime(
          new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })
        );
        autoCheckInTriggered.current = false;
        hapticSuccess();
        toastSuccess("تم تسجيل الانصراف بدون اتصال — سيتم المزامنة عند عودة الإنترنت");
        return;
      }

      await checkOutMutation.mutateAsync({ employeeId: user.employee_id });
      setCheckOutTime(
        new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })
      );
      autoCheckInTriggered.current = false;
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
        color: "bg-muted text-muted-foreground/50 bg-card text-muted-foreground",
        icon: Briefcase,
      }
    : checkedIn
      ? {
          label: "مسجل حضور",
          color: "bg-primary/10 text-primary bg-primary/10 text-primary",
          icon: CheckCircle,
        }
      : {
          label: "لم يُسجل اليوم",
          color: "bg-[hsl(48_96%_53%/0.15)] text-[hsl(48_96%_53%)] ",
          icon: Clock,
        };

  return (
    <MainLayout>
      <div className="flex flex-col gap-4 max-w-md mx-auto pb-8">
        {/* Employee Welcome Header */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-primary to-primary/80 text-primary-foreground overflow-hidden">
          <CardContent className="p-4 flex items-center gap-3">
            <UserAvatar user={avatarUser} size="lg" className="border-2 border-background/30" />
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold truncate">{user?.name || "موظف"}</h2>
              <p className="text-[10px] text-primary/80 truncate opacity-80">
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
        <Card className="border-0 shadow-xl bg-background overflow-hidden relative">
          <div
            className={cn(
              "absolute top-0 left-0 w-full h-1.5",
              checkedIn ? "bg-primary" : dayComplete ? "bg-muted-foreground/50" : "bg-primary"
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
                          className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-primary pointer-events-none"
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
                    "w-40 h-40 rounded-full flex flex-col items-center justify-center gap-2 shadow-2xl shadow-primary/20 transition-all border-4",
                    dayComplete
                      ? "bg-muted-foreground/30 text-muted-foreground/50 border-border bg-card text-muted-foreground/70 border-border"
                      : checkInStatus === "success"
                        ? "bg-primary text-primary-foreground border-primary/20 border-primary/20"
                        : checkInStatus === "outside"
                          ? "bg-[hsl(48_96%_53%/0.1)]0 text-primary-foreground border-[hsl(48_96%_53%/0.2)] border-[hsl(48_96%_53%/0.2)]"
                          : "bg-primary text-primary-foreground border-primary/20 border-primary/20"
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
                      <MapPin className="w-10 h-10" />
                      <span className="text-sm font-bold">تسجيل</span>
                    </>
                  )}
                </motion.button>
              </AnimatePresence>
            </div>

            <p className="mt-5 text-xs font-medium text-muted-foreground">
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
        <Card className="border-0 shadow-md bg-background">
          <CardContent className="p-4">
            <h3 className="text-xs font-bold text-foreground mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              سجل اليوم
            </h3>

            <div className="relative flex flex-col gap-0">
              <div className="absolute right-[15px] top-2 bottom-2 w-0.5 bg-muted" />

              {/* Check-in entry */}
              <div className="relative flex items-start gap-3 py-2">
                <div
                  className={cn(
                    "z-10 w-3 h-3 rounded-full mt-1.5 ring-2 ring-background dark:ring-slate-900",
                    checkInTime ? "bg-primary" : "bg-muted-foreground/30 bg-muted"
                  )}
                />
                <div className="flex-1">
                  <p className="text-xs font-bold text-foreground">الحضور</p>
                  <p className="text-[10px] text-muted-foreground">
                    {checkInTime || "--:--"}
                  </p>
                </div>
              </div>

              {/* Check-out entry */}
              <div className="relative flex items-start gap-3 py-2">
                <div
                  className={cn(
                    "z-10 w-3 h-3 rounded-full mt-1.5 ring-2 ring-background dark:ring-slate-900",
                    checkOutTime
                      ? "bg-destructive"
                      : checkedIn
                        ? "bg-muted-foreground/30 bg-muted animate-pulse"
                        : "bg-muted-foreground/30 bg-muted"
                  )}
                />
                <div className="flex-1">
                  <p className="text-xs font-bold text-foreground">الانصراف</p>
                  <p className="text-[10px] text-muted-foreground">
                    {checkOutTime || (checkedIn ? "جاري الدوام" : "--:--")}
                  </p>
                </div>
                {checkedIn && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive text-[10px] gap-1 px-2 py-1 h-auto"
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
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">مدة الدوام</span>
                <span className="text-sm font-mono font-bold text-primary text-primary">
                  {elapsedTime}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compact Location Status */}
        <div
          className={cn(
            "flex items-center justify-between gap-3 px-4 py-3 rounded-xl border shadow-sm",
            locationError
              ? "bg-destructive/5 border-destructive/20 bg-destructive/10 border-destructive/20"
              : isWithinRange
                ? "bg-primary/5 border-primary/20 bg-primary/10 border-primary/20"
                : "bg-[hsl(48_96%_53%/0.1)] border-[hsl(48_96%_53%/0.2)] dark:bg-[hsl(48_96%_53%/0.1)] border-[hsl(48_96%_53%/0.2)]"
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <MapPin
              className={cn(
                "w-4 h-4 shrink-0",
                locationError
                  ? "text-destructive"
                  : isWithinRange
                    ? "text-primary"
                    : "text-[hsl(48_96%_53%)]"
              )}
            />
            <span className="text-xs font-medium truncate text-foreground">
              {locationError
                ? "تعذر تحديد الموقع"
                : nearestGeofence
                  ? nearestGeofence.geofence.name
                  : "جاري تحديد الموقع..."}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!locationError && nearestGeofence && (
              <span
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full font-medium",
                  isWithinRange
                    ? "bg-primary/10 text-primary bg-primary/10 text-primary"
                    : "bg-[hsl(48_96%_53%/0.15)] text-[hsl(48_96%_53%)] "
                )}
              >
                {isWithinRange ? "جاهز" : "اقترب"}
              </span>
            )}
            <button
              onClick={refreshLocation}
              className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-background/10 text-muted-foreground"
              aria-label="تحديث الموقع"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Offline Banner */}
        {!isOnline && (
          <div className="flex items-center gap-2 px-4 py-3 bg-[hsl(48_96%_53%/0.1)] text-[hsl(48_96%_53%)] rounded-xl border border-[hsl(48_96%_53%/0.2)] border-[hsl(48_96%_53%/0.2)]">
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
              className="w-full max-w-sm bg-background rounded-2xl shadow-2xl p-6 space-y-4"
            >
              <h3 className="text-lg font-bold text-foreground text-primary-foreground text-center">
                تأكيد الانصراف
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">وقت الحضور</span>
                  <span className="font-medium text-foreground">{checkInTime || "--:--"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">مدة الدوام</span>
                  <span className="font-mono font-bold text-primary text-primary">
                    {elapsedTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الموقع</span>
                  <span className="font-medium text-foreground">
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
                  className="flex-1 bg-primary hover:bg-primary/90"
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
