"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useLocale } from "next-intl";
import MainLayout from "@/components/shared/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, LogOut, WifiOff, RefreshCw, MapPin, Clock, Briefcase } from "lucide-react";
import { useCheckIn, useCheckOut, useGeofences, useEmployees, useAttendance } from "@/hooks/useApi";
import { queryKeys } from "@/hooks/api/queryKeys";
import { useQueryClient } from "@tanstack/react-query";
import { hapticSuccess, hapticError, hapticTap } from "@/lib/utils/haptics";
import { fireConfetti } from "@/lib/utils/confetti";
import { toastSuccess, toastError } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import type { Geofence } from "@/lib/types/trackingTypes";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCompanySettingsStore } from "@/stores/useCompanySettingsStore";
import { cn } from "@/lib/utils";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/config/firebase";
import {
  addToOfflineQueue,
  addToOfflineCheckOutQueue,
  processOfflineQueue,
  hasOfflineQueue,
  hasOfflineCheckOutQueue,
} from "@/lib/utils/offlineQueue";
import { calculateDistance, GEOFENCE_DISTANCE_BUFFER_METERS } from "@/lib/utils/geo";

function LiveClock() {
  const locale = useLocale();
  const timeLocale = locale === "ar" ? "ar-SA-u-nu-latn" : "en-US";
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString(timeLocale, { hour: "2-digit", minute: "2-digit" }));
      setDate(
        now.toLocaleDateString(timeLocale, {
          weekday: "long",
          month: "long",
          day: "numeric",
        })
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [timeLocale]);
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
  const qc = useQueryClient();
  const { user, companyName, clearUser } = useAuthStore();
  const companySettings = useCompanySettingsStore();
  const locale = useLocale();
  const timeLocale = locale === "ar" ? "ar-SA-u-nu-latn" : "en-US";
  const todayStr = new Date().toLocaleDateString("sv-SE");
  const todayRecord = attendanceRecords.find(
    (r) => r.date === todayStr && String(r.employeeId) === String(user?.employee_id)
  );

  const currentEmployee = employees.find(
    (e) =>
      String(e.id) === String(user?.employee_id) ||
      (user?.email && e.email?.toLowerCase() === user.email.toLowerCase())
  );
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
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

  // Sync any pending offline check-in/check-out records when back online
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isOnline || (!hasOfflineQueue() && !hasOfflineCheckOutQueue())) return;
    let cancelled = false;
    processOfflineQueue().then(({ processed, failed }) => {
      if (cancelled) return;
      qc.invalidateQueries({ queryKey: queryKeys.attendance });
      if (processed > 0) toastSuccess(`تمت مزامنة ${processed} سجل حضور/انصراف`);
      if (failed > 0) toastError(`فشل مزامنة ${failed} سجل`);
    });
    return () => {
      cancelled = true;
    };
  }, [isOnline, qc]);

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
    console.warn("[geolocation] error:", err.code, err.message);
  }, []);

  const refreshLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(updateFromPosition, handleLocationError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000,
    });
  }, [updateFromPosition, handleLocationError]);

  useEffect(() => {
    if (!navigator.geolocation) return;
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
          setCheckInTime(
            now.toLocaleTimeString(timeLocale, { hour: "2-digit", minute: "2-digit" })
          );
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
          setCheckInTime(
            now.toLocaleTimeString(timeLocale, { hour: "2-digit", minute: "2-digit" })
          );
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
    timeLocale,
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
        nowOffline.toLocaleTimeString(timeLocale, { hour: "2-digit", minute: "2-digit" })
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
      setCheckInTime(now.toLocaleTimeString(timeLocale, { hour: "2-digit", minute: "2-digit" }));
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
      if (errMsg === "AUTH_EXPIRED") {
        toastError("انتهت الجلسة — يرجى تسجيل الدخول مرة أخرى");
        setTimeout(() => {
          if (typeof window !== "undefined") {
            const pathParts = window.location.pathname.split("/");
            const detectedLocale = pathParts[1] === "en" ? "en" : "ar";
            window.location.href = `/${detectedLocale}/login?reason=session_expired`;
          }
        }, 1500);
      } else if (errMsg === "NO_COMPANY") {
        toastError("تعذر تحديد الشركة — يرجى تسجيل الدخول مرة أخرى");
      } else if (
        errMsg.includes("Missing or insufficient permissions") ||
        errMsg.includes("permission-denied")
      ) {
        toastError("لا يوجد صلاحية لتسجيل الحضور — تأكد من ربط حسابك بالشركة");
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
          new Date().toLocaleTimeString(timeLocale, { hour: "2-digit", minute: "2-digit" })
        );
        autoCheckInTriggered.current = false;
        hapticSuccess();
        toastSuccess("تم تسجيل الانصراف بدون اتصال — سيتم المزامنة عند عودة الإنترنت");
        return;
      }

      await checkOutMutation.mutateAsync({ employeeId: user.employee_id });
      setCheckOutTime(
        new Date().toLocaleTimeString(timeLocale, { hour: "2-digit", minute: "2-digit" })
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

  const employeeName = currentEmployee?.name || user?.name || "موظف";

  const handleSignOut = async () => {
    if (auth) {
      try {
        await signOut(auth);
      } catch {
        // ignore sign-out errors
      }
    }
    clearUser();
    if (typeof window !== "undefined") {
      window.location.assign("/ar/login");
    }
  };

  const dayComplete = !!checkOutTime;
  const checkedIn = checkInStatus === "success" && !dayComplete;

  const statusMeta = dayComplete
    ? {
        label: "انتهى الدوام",
        color: "bg-muted-foreground text-primary-foreground",
        icon: Briefcase,
      }
    : checkedIn
      ? {
          label: "مسجل حضور",
          color: "bg-primary text-primary-foreground",
          icon: CheckCircle,
        }
      : {
          label: "لم يُسجل اليوم",
          color: "bg-amber-500 text-primary-foreground",
          icon: Clock,
        };

  return (
    <MainLayout bare>
      <div className="flex flex-col gap-4 max-w-md mx-auto px-4 pt-[env(safe-area-inset-top)] pb-8 min-h-screen justify-center">
        {/* Employee Welcome Header */}
        <Card className="relative overflow-hidden border border-border/50 bg-card shadow-md">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardContent className="relative p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">مرحباً</p>
                <h2 className="text-xl font-bold text-foreground truncate">{employeeName}</h2>
                <p className="text-xs text-primary font-medium truncate">
                  {companyName || currentEmployee?.department || user?.email}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span
                  className={cn(
                    "shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold",
                    statusMeta.color
                  )}
                >
                  <statusMeta.icon className="w-3 h-3" />
                  {statusMeta.label}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={handleSignOut}
                  aria-label="تسجيل الخروج"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
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
                    "w-44 h-44 rounded-full flex flex-col items-center justify-center gap-2 shadow-2xl transition-all border-4 active:scale-95",
                    dayComplete
                      ? "bg-card text-muted-foreground/70 border-border shadow-muted/20"
                      : checkInStatus === "success"
                        ? "bg-primary text-primary-foreground border-primary/20 shadow-primary/30"
                        : checkInStatus === "outside" || !canCheckIn
                          ? "bg-[hsl(48_96%_53%)] text-primary-foreground border-[hsl(48_96%_53%/0.3)] shadow-amber-500/30"
                          : "bg-primary text-primary-foreground border-primary/20 shadow-primary/30"
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

            <div className="mt-6 flex items-center justify-center gap-2">
              {dayComplete ? (
                <>
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-muted-foreground">انتهى الدوام</span>
                </>
              ) : checkedIn ? (
                <>
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">
                    مسجل حضور · {checkInTime}
                  </span>
                </>
              ) : canCheckIn ? (
                <>
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">جاهز للتسجيل</span>
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-semibold text-amber-500">خارج النطاق</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Today Timeline */}
        <Card className="border border-border/50 bg-card">
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              سجل اليوم
            </h3>

            <div className="relative flex flex-col gap-3">
              <div className="absolute right-[17px] top-2 bottom-2 w-0.5 bg-border" />

              {/* Check-in entry */}
              <div className="relative flex items-start gap-3">
                <div
                  className={cn(
                    "z-10 w-3.5 h-3.5 rounded-full mt-1 ring-2 ring-card",
                    checkInTime ? "bg-primary" : "bg-muted"
                  )}
                />
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">الحضور</p>
                  <p className="text-xs text-muted-foreground">{checkInTime || "--:--"}</p>
                </div>
              </div>

              {/* Check-out entry */}
              <div className="relative flex items-start gap-3">
                <div
                  className={cn(
                    "z-10 w-3.5 h-3.5 rounded-full mt-1 ring-2 ring-card",
                    checkOutTime
                      ? "bg-destructive"
                      : checkedIn
                        ? "bg-muted animate-pulse"
                        : "bg-muted"
                  )}
                />
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">الانصراف</p>
                  <p className="text-xs text-muted-foreground">
                    {checkOutTime || (checkedIn ? "جاري الدوام" : "--:--")}
                  </p>
                </div>
                {checkedIn && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive text-xs gap-1 px-2 py-1 h-auto hover:bg-destructive/10"
                    onClick={handleCheckOutClick}
                    disabled={checkOutStatus === "loading"}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    {checkOutStatus === "loading" ? "جاري..." : "إنهاء"}
                  </Button>
                )}
              </div>
            </div>

            {checkedIn && (
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">مدة الدوام</span>
                <span className="text-base font-mono font-bold text-primary">{elapsedTime}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Offline Banner */}
        {!isOnline && (
          <div className="flex items-center gap-2 px-4 py-3 bg-[hsl(48_96%_53%/0.1)] text-[hsl(48_96%_53%)] rounded-xl border border-[hsl(48_96%_53%/0.2)]">
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
              <h3 className="text-lg font-bold text-foreground text-center">تأكيد الانصراف</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">وقت الحضور</span>
                  <span className="font-medium text-foreground">{checkInTime || "--:--"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">مدة الدوام</span>
                  <span className="font-mono font-bold text-primary">{elapsedTime}</span>
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
