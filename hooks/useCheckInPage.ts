"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Briefcase, CheckCircle, Clock, type LucideIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCheckIn,
  useCheckOut,
  useGeofences,
  useEmployee,
  useMyAttendance,
} from "@/hooks/useApi";
import { queryKeys, toApiDate } from "@/hooks/api/queryKeys";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCompanySettingsStore } from "@/stores/useCompanySettingsStore";
import { useGeolocation } from "@/hooks/useGeolocation";
import { calculateWorkedHours, resolveEmployeeShift, evaluateCheckIn } from "@/lib/utils/shifts";
import { hapticSuccess, hapticError, hapticTap } from "@/lib/utils/haptics";
import { toastSuccess, toastError } from "@/hooks/use-toast";
import { fireConfetti } from "@/lib/utils/confetti";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/config/firebase";
import {
  addToOfflineQueue,
  addToOfflineCheckOutQueue,
  processOfflineQueue,
  hasOfflineQueue,
  hasOfflineCheckOutQueue,
  type QueuedCheckIn,
  type QueuedCheckOut,
} from "@/lib/utils/offlineQueue";
import type { AttendanceRecord } from "@/lib/types/trackingTypes";
import type { CompanySettings } from "@/lib/types/companySettings";

const AUTO_CHECKIN_DEBOUNCE_MS = 1500;
const BURST_DURATION_MS = 600;

function buildTodayCacheKey(
  companyId: string | null,
  employeeId: string | number | null,
  today: string
) {
  return [
    ...queryKeys.attendance,
    "my",
    companyId ?? "unassigned",
    employeeId ?? "none",
    today,
  ] as const;
}

function buildOfflineCheckInId() {
  return `ci-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildOfflineCheckOutId() {
  return `co-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useCheckInPage() {
  const t = useTranslations("CheckIn");
  const locale = useLocale();
  const qc = useQueryClient();
  const today = useMemo(() => toApiDate(new Date()) ?? new Date().toISOString().split("T")[0], []);

  const companyId = useAuthStore((state) => state.companyId);
  const companyName = useAuthStore((state) => state.companyName);
  const clearUser = useAuthStore((state) => state.clearUser);
  const employeeId = useAuthStore((state) => state.user?.employee_id ?? null);
  const employeeNameFromAuth = useAuthStore((state) => state.user?.name ?? "");

  const autoCheckInEnabled = useCompanySettingsStore((s) => s.autoCheckInEnabled);
  const autoCheckInRadiusOffset = useCompanySettingsStore((s) => s.autoCheckInRadiusOffset);
  const requireGeofenceForCheckIn = useCompanySettingsStore((s) => s.requireGeofenceForCheckIn);
  const allowCheckInOutsideGeofence = useCompanySettingsStore((s) => s.allowCheckInOutsideGeofence);
  const attendanceMode = useCompanySettingsStore((s) => s.attendanceMode);
  const defaultShift = useCompanySettingsStore((s) => s.defaultShift);
  const morningShift = useCompanySettingsStore((s) => s.morningShift);
  const eveningShift = useCompanySettingsStore((s) => s.eveningShift);
  const seasonalAttendanceEnabled = useCompanySettingsStore((s) => s.seasonalAttendanceEnabled);
  const seasonalMonths = useCompanySettingsStore((s) => s.seasonalMonths);
  const seasonalShift = useCompanySettingsStore((s) => s.seasonalShift);
  const checkoutTimeRangeEnabled = useCompanySettingsStore((s) => s.checkoutTimeRangeEnabled);
  const checkoutStartTime = useCompanySettingsStore((s) => s.checkoutStartTime);

  const companySettings = useMemo<Partial<CompanySettings>>(
    () => ({
      autoCheckInEnabled,
      autoCheckInRadiusOffset,
      requireGeofenceForCheckIn,
      allowCheckInOutsideGeofence,
      attendanceMode,
      defaultShift,
      morningShift,
      eveningShift,
      seasonalAttendanceEnabled,
      seasonalMonths,
      seasonalShift,
      checkoutTimeRangeEnabled,
      checkoutStartTime,
    }),
    [
      autoCheckInEnabled,
      autoCheckInRadiusOffset,
      requireGeofenceForCheckIn,
      allowCheckInOutsideGeofence,
      attendanceMode,
      defaultShift,
      morningShift,
      eveningShift,
      seasonalAttendanceEnabled,
      seasonalMonths,
      seasonalShift,
      checkoutTimeRangeEnabled,
      checkoutStartTime,
    ]
  );

  const { data: currentEmployee } = useEmployee(employeeId ? String(employeeId) : null);
  const { data: geofences = [] } = useGeofences();
  const { data: todayRecords = [] } = useMyAttendance(employeeId ? String(employeeId) : null);
  const todayRecord = todayRecords[0] ?? null;

  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  const employeeForApi = useMemo(
    () =>
      currentEmployee
        ? {
            attendanceMode: currentEmployee.attendanceMode,
            shiftOverride: currentEmployee.shiftOverride,
          }
        : null,
    [currentEmployee]
  );

  const employeeName = useMemo(
    () => currentEmployee?.name || employeeNameFromAuth || t("employee"),
    [currentEmployee?.name, employeeNameFromAuth, t]
  );

  const {
    position: currentLocation,
    nearestGeofence,
    isWithinRange,
    isLocating,
    error: locationError,
  } = useGeolocation({ geofences, enabled: true });

  const [isOnline, setIsOnline] = useState(true);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);

  const autoCheckInTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const offlineSyncInProgress = useRef(false);
  const burstTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkInGuardRef = useRef(false);
  const checkOutGuardRef = useRef(false);
  const autoCheckInAttempted = useRef(false);

  useEffect(() => {
    if (locationError?.code === GeolocationPositionError.PERMISSION_DENIED) {
      setLocationPermissionDenied(true);
    }
  }, [locationError]);

  // Online / offline detection
  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);

  // Worked-time ticker
  const checkInTimestamp = useMemo(() => {
    if (!todayRecord?.checkInTime || !todayRecord?.date) return null;
    const d = new Date(`${todayRecord.date}T${todayRecord.checkInTime}`);
    return isNaN(d.getTime()) ? null : d.getTime();
  }, [todayRecord?.checkInTime, todayRecord?.date]);

  useEffect(() => {
    if (!checkInTimestamp || todayRecord?.checkOutTime) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [checkInTimestamp, todayRecord?.checkOutTime]);

  const elapsedTime = useMemo(() => {
    if (!checkInTimestamp) return "";
    const elapsed = now - checkInTimestamp;
    const h = Math.floor(elapsed / 3600000);
    const m = Math.floor((elapsed % 3600000) / 60000);
    const s = Math.floor((elapsed % 60000) / 1000);
    return t("elapsed", { h, m, s });
  }, [checkInTimestamp, now, t]);

  // Derived day state
  const dayComplete = useMemo(
    () => Boolean(todayRecord?.checkOutTime),
    [todayRecord?.checkOutTime]
  );
  const checkedIn = useMemo(
    () => Boolean(todayRecord?.checkInTime && !todayRecord?.checkOutTime),
    [todayRecord?.checkInTime, todayRecord?.checkOutTime]
  );

  const canCheckIn = useMemo(() => {
    if (!currentLocation) return false;
    const noGeofencesConfigured = geofences.length === 0;
    return Boolean(
      isWithinRange ||
      companySettings.allowCheckInOutsideGeofence ||
      !companySettings.requireGeofenceForCheckIn ||
      noGeofencesConfigured
    );
  }, [
    currentLocation,
    isWithinRange,
    companySettings.allowCheckInOutsideGeofence,
    companySettings.requireGeofenceForCheckIn,
    geofences.length,
  ]);

  const statusMeta = useMemo(() => {
    if (dayComplete)
      return {
        label: t("shiftDone"),
        color: "bg-muted-foreground text-primary-foreground",
        icon: Briefcase as LucideIcon,
      };
    if (checkedIn)
      return {
        label: t("checkedIn"),
        color: "bg-primary text-primary-foreground",
        icon: CheckCircle as LucideIcon,
      };
    return {
      label: t("notCheckedIn"),
      color: "bg-amber-500 text-primary-foreground",
      icon: Clock as LucideIcon,
    };
  }, [dayComplete, checkedIn, t]);

  // Burst animation timeout
  useEffect(() => {
    if (!showBurst) return;
    if (burstTimeoutRef.current) clearTimeout(burstTimeoutRef.current);
    burstTimeoutRef.current = setTimeout(() => setShowBurst(false), BURST_DURATION_MS);
    return () => {
      if (burstTimeoutRef.current) clearTimeout(burstTimeoutRef.current);
    };
  }, [showBurst]);

  const todayCacheKey = useMemo(
    () => buildTodayCacheKey(companyId, employeeId, today),
    [companyId, employeeId, today]
  );

  // Sync any pending offline records when back online
  useEffect(() => {
    if (!isOnline || (!hasOfflineQueue() && !hasOfflineCheckOutQueue())) return;
    if (offlineSyncInProgress.current) return;
    offlineSyncInProgress.current = true;

    processOfflineQueue()
      .then(({ processed, failed }) => {
        offlineSyncInProgress.current = false;
        qc.invalidateQueries({ queryKey: queryKeys.attendance });
        if (processed > 0) toastSuccess(t("synced", { count: processed }));
        if (failed > 0) toastError(t("syncFailed", { count: failed }));
      })
      .catch(() => {
        offlineSyncInProgress.current = false;
      });
  }, [isOnline, qc, t]);

  const createOfflineCheckInRecord = useCallback(
    (
      location: { lat: number; lng: number; accuracy: number },
      geofence: { id: string; name: string } | null,
      timestamp: number
    ): QueuedCheckIn => ({
      id: buildOfflineCheckInId(),
      employeeId: String(employeeId),
      employeeName,
      lat: location.lat,
      lng: location.lng,
      geofenceId: geofence?.id ?? null,
      geofenceName: geofence?.name ?? null,
      timestamp,
      settings: companySettings as CompanySettings,
      employeeSnapshot: employeeForApi,
    }),
    [employeeId, employeeName, companySettings, employeeForApi]
  );

  const createOfflineCheckOutRecord = useCallback(
    (timestamp: number): QueuedCheckOut => ({
      id: buildOfflineCheckOutId(),
      employeeId: String(employeeId),
      timestamp,
      settings: companySettings,
    }),
    [employeeId, companySettings]
  );

  const handleCheckIn = useCallback(
    async (source: "manual" | "auto" = "manual") => {
      if (!employeeId) {
        hapticError();
        toastError(t("noEmployeeId"));
        return;
      }
      if (!currentLocation) {
        hapticError();
        toastError(t("locationNotDetermined"));
        return;
      }
      if (todayRecord?.checkInTime) return;
      if (checkInMutation.isPending) return;
      if (checkInGuardRef.current) return;
      checkInGuardRef.current = true;

      const geofence = nearestGeofence?.geofence ?? null;
      const allowed =
        isWithinRange ||
        companySettings.allowCheckInOutsideGeofence ||
        !companySettings.requireGeofenceForCheckIn ||
        geofences.length === 0;

      if (!allowed) {
        checkInGuardRef.current = false;
        hapticError();
        toastError(t("outsideGeofence"));
        return;
      }

      const nowDate = new Date();
      const checkInTime = nowDate.toTimeString().slice(0, 5);
      const timestamp = nowDate.getTime();

      const { mode, shift, slot } = resolveEmployeeShift(
        employeeForApi ?? {},
        companySettings as CompanySettings,
        nowDate,
        null,
        geofence?.shifts ?? null
      );
      const { status, lateMinutes } = evaluateCheckIn(checkInTime, shift);

      if (!navigator.onLine) {
        const queued = createOfflineCheckInRecord(
          currentLocation,
          geofence ? { id: geofence.id, name: geofence.name } : null,
          timestamp
        );
        addToOfflineQueue(queued);

        const synthetic: AttendanceRecord = {
          id: queued.id,
          employeeId: String(employeeId),
          employeeName,
          date: today,
          checkInTime,
          checkOutTime: null,
          status,
          checkInLat: currentLocation.lat,
          checkInLng: currentLocation.lng,
          geofenceId: geofence?.id ?? null,
          geofenceName: geofence?.name ?? null,
          lateMinutes,
          workedHours: 0,
          attendanceMode: mode,
          appliedShift: shift,
          shiftSlot: slot,
        };
        qc.setQueryData(todayCacheKey, [synthetic]);
        setShowBurst(true);
        hapticSuccess();
        toastSuccess(t("checkInOffline"));
        checkInGuardRef.current = false;
        return;
      }

      try {
        const record = await checkInMutation.mutateAsync({
          employeeId: String(employeeId),
          employeeName,
          lat: currentLocation.lat,
          lng: currentLocation.lng,
          accuracy: currentLocation.accuracy,
          geofenceId: geofence?.id ?? null,
          companySettings: companySettings as Record<string, unknown>,
          employee: employeeForApi,
        });

        qc.setQueryData(todayCacheKey, [record]);
        setShowBurst(true);
        hapticSuccess();
        fireConfetti();
        toastSuccess(source === "auto" ? t("autoCheckIn") : t("checkInSuccess"));
      } catch (err) {
        console.error("[check-in] failed:", err);
        const errMsg = err instanceof Error ? err.message : String(err);
        if (errMsg === "AUTH_EXPIRED") {
          toastError(t("sessionExpired"));
          setTimeout(() => {
            if (typeof window !== "undefined") {
              const pathParts = window.location.pathname.split("/");
              const detectedLocale = pathParts[1] === "en" ? "en" : "ar";
              window.location.href = `/${detectedLocale}/login?reason=session_expired`;
            }
          }, 1500);
        } else if (errMsg === "NO_COMPANY") {
          toastError(t("noCompany"));
        } else if (
          errMsg.includes("Missing or insufficient permissions") ||
          errMsg.includes("permission-denied")
        ) {
          toastError(t("noPermission"));
        } else {
          toastError(t("checkInFailed"));
        }
      } finally {
        checkInGuardRef.current = false;
      }
    },
    [
      employeeId,
      employeeName,
      employeeForApi,
      currentLocation,
      isWithinRange,
      nearestGeofence,
      todayRecord?.checkInTime,
      checkInMutation,
      companySettings,
      geofences.length,
      today,
      qc,
      todayCacheKey,
      t,
      createOfflineCheckInRecord,
    ]
  );

  // Auto check-in when entering geofence
  useEffect(() => {
    if (!companySettings.autoCheckInEnabled) return;
    if (autoCheckInAttempted.current) return;
    if (todayRecord?.checkInTime) return;
    if (!currentLocation || !nearestGeofence?.geofence) return;
    if (!canCheckIn) return;

    const isWithinAutoRange =
      nearestGeofence.distance <=
      nearestGeofence.geofence.radius + (companySettings.autoCheckInRadiusOffset ?? 0);

    if (isWithinAutoRange) {
      if (autoCheckInTimerRef.current) return;
      autoCheckInTimerRef.current = setTimeout(() => {
        autoCheckInAttempted.current = true;
        void handleCheckIn("auto");
        autoCheckInTimerRef.current = null;
      }, AUTO_CHECKIN_DEBOUNCE_MS);
    } else {
      if (autoCheckInTimerRef.current) {
        clearTimeout(autoCheckInTimerRef.current);
        autoCheckInTimerRef.current = null;
      }
    }

    return () => {
      if (autoCheckInTimerRef.current) {
        clearTimeout(autoCheckInTimerRef.current);
        autoCheckInTimerRef.current = null;
      }
    };
  }, [
    companySettings.autoCheckInEnabled,
    companySettings.autoCheckInRadiusOffset,
    todayRecord?.checkInTime,
    currentLocation,
    nearestGeofence,
    canCheckIn,
    handleCheckIn,
  ]);

  const handleCheckOutClick = useCallback(() => {
    if (dayComplete || checkOutMutation.isPending || !checkedIn) return;
    hapticTap();
    setShowCheckoutConfirm(true);
  }, [dayComplete, checkOutMutation.isPending, checkedIn]);

  const confirmCheckOut = useCallback(async () => {
    setShowCheckoutConfirm(false);
    if (dayComplete || checkOutMutation.isPending || !checkedIn || !employeeId) return;
    if (checkOutGuardRef.current) return;
    checkOutGuardRef.current = true;

    const nowDate = new Date();
    const checkOutTime = nowDate.toTimeString().slice(0, 5);
    const timestamp = nowDate.getTime();

    if (!navigator.onLine) {
      const queued = createOfflineCheckOutRecord(timestamp);
      addToOfflineCheckOutQueue(queued);
      if (todayRecord) {
        const worked = todayRecord.checkInTime
          ? calculateWorkedHours(todayRecord.checkInTime, checkOutTime)
          : 0;
        const updated: AttendanceRecord = {
          ...todayRecord,
          checkOutTime,
          status: "checked_out",
          checkOutStatus: "present",
          workedHours: worked,
        };
        qc.setQueryData(todayCacheKey, [updated]);
      }
      hapticSuccess();
      toastSuccess(t("checkOutOffline"));
      checkOutGuardRef.current = false;
      return;
    }

    try {
      const record = await checkOutMutation.mutateAsync({
        employeeId: String(employeeId),
      });
      qc.setQueryData(todayCacheKey, [record]);
      hapticSuccess();
      toastSuccess(t("checkOutSuccess"));
    } catch (err) {
      console.error("[check-out] failed:", err);
      hapticError();
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg === "AUTH_EXPIRED") {
        toastError(t("sessionExpired"));
      } else if (errMsg === "NO_COMPANY") {
        toastError(t("noCompany"));
      } else if (
        errMsg.includes("Missing or insufficient permissions") ||
        errMsg.includes("permission-denied")
      ) {
        toastError(t("noPermission"));
      } else if (errMsg === "No open attendance record") {
        toastError(t("noCheckInToday"));
      } else {
        toastError(t("checkOutFailed"));
      }
    } finally {
      checkOutGuardRef.current = false;
    }
  }, [
    dayComplete,
    checkOutMutation,
    checkedIn,
    employeeId,
    todayRecord,
    todayCacheKey,
    qc,
    t,
    createOfflineCheckOutRecord,
  ]);

  const handleSignOut = useCallback(async () => {
    if (auth) {
      try {
        await signOut(auth);
      } catch {
        // ignore sign-out errors
      }
    }
    clearUser();
    if (typeof window !== "undefined") {
      window.location.assign(`/${locale}/login`);
    }
  }, [clearUser, locale]);

  return {
    employeeName,
    companyName,
    isOnline,
    isLocating,
    hasLocation: Boolean(currentLocation),
    locationPermissionDenied,
    nearestGeofence,
    canCheckIn,
    dayComplete,
    checkedIn,
    checkInTime: todayRecord?.checkInTime ?? null,
    checkOutTime: todayRecord?.checkOutTime ?? null,
    elapsedTime,
    statusMeta,
    isCheckInPending: checkInMutation.isPending,
    isCheckOutPending: checkOutMutation.isPending,
    showCheckoutConfirm,
    setShowCheckoutConfirm,
    handleCheckIn,
    handleCheckOutClick,
    confirmCheckOut,
    handleSignOut,
    showBurst,
  };
}
