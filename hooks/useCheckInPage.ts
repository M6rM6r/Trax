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
import { myAttendanceQueryKey, toApiDate } from "@/hooks/api/queryKeys";
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
  type QueuedCheckIn,
  type QueuedCheckOut,
} from "@/lib/utils/offlineQueue";
import type { AttendanceRecord } from "@/lib/types/trackingTypes";
import { type CompanySettings, defaultCompanySettings } from "@/lib/types/companySettings";
import {
  assertClientAssignedCheckInAllowed,
  isInsideAssignedGeofence,
  resolveAssignedGeofenceId,
} from "@/lib/utils/assignedGeofence";
import {
  companyWallClockToUtcMs,
  DEFAULT_COMPANY_TIMEZONE,
  formatCompanyDate,
} from "@/lib/utils/companyDate";

const AUTO_CHECKIN_DEBOUNCE_MS = 1500;
const LOCATION_MAX_AGE_MS = 8_000;
const BURST_DURATION_MS = 600;

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
  const settingsTimezone = useCompanySettingsStore((s) => s.timezone);
  const [today, setToday] = useState(
    () =>
      toApiDate(new Date(), settingsTimezone || DEFAULT_COMPANY_TIMEZONE) ??
      formatCompanyDate(new Date(), settingsTimezone || DEFAULT_COMPANY_TIMEZONE)
  );
  // Recompute company "today" so SPA sessions past midnight don't stick on yesterday.
  useEffect(() => {
    const refresh = () => {
      const tz = settingsTimezone || DEFAULT_COMPANY_TIMEZONE;
      const next = toApiDate(new Date(), tz) ?? formatCompanyDate(new Date(), tz);
      setToday((prev) => (prev === next ? prev : next));
    };
    refresh();
    const id = setInterval(refresh, 60_000);
    const onVis = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [settingsTimezone]);

  const companyId = useAuthStore((state) => state.companyId);
  const companyName = useAuthStore((state) => state.companyName);
  const clearUser = useAuthStore((state) => state.clearUser);
  const employeeId = useAuthStore((state) => state.user?.employee_id ?? null);
  const employeeNameFromAuth = useAuthStore((state) => state.user?.name ?? "");
  const authAssignedGeofenceId = useAuthStore((state) => state.user?.assigned_geofence_id ?? null);

  const settingsState = useCompanySettingsStore();
  const companySettings = useMemo<Partial<CompanySettings>>(
    () => ({
      workStartTime: settingsState.workStartTime,
      workEndTime: settingsState.workEndTime,
      gracePeriodMinutes: settingsState.gracePeriodMinutes,
      lateThresholdMinutes: settingsState.lateThresholdMinutes,
      attendanceMode: settingsState.attendanceMode,
      defaultShift: settingsState.defaultShift,
      morningShift: settingsState.morningShift,
      eveningShift: settingsState.eveningShift,
      seasonalAttendanceEnabled: settingsState.seasonalAttendanceEnabled,
      seasonalMonths: settingsState.seasonalMonths,
      seasonalShift: settingsState.seasonalShift,
      autoCheckInEnabled: settingsState.autoCheckInEnabled,
      autoCheckInRadiusOffset: settingsState.autoCheckInRadiusOffset,
      requireGeofenceForCheckIn: settingsState.requireGeofenceForCheckIn,
      allowCheckInOutsideGeofence: settingsState.allowCheckInOutsideGeofence,
      checkoutTimeRangeEnabled: settingsState.checkoutTimeRangeEnabled,
      checkoutStartTime: settingsState.checkoutStartTime,
      checkoutEndTime: settingsState.checkoutEndTime,
      notificationsEnabled: settingsState.notificationsEnabled,
      lateAlertsEnabled: settingsState.lateAlertsEnabled,
      attendanceAlertsEnabled: settingsState.attendanceAlertsEnabled,
      checkoutAlertsEnabled: settingsState.checkoutAlertsEnabled,
      pushNotificationsEnabled: settingsState.pushNotificationsEnabled,
      emailNotificationsEnabled: settingsState.emailNotificationsEnabled,
      checkInReminderEnabled: settingsState.checkInReminderEnabled,
      checkInReminderTime: settingsState.checkInReminderTime,
      weekendDays: settingsState.weekendDays,
      companyName: settingsState.companyName,
      timezone: settingsState.timezone,
      language: settingsState.language,
      sessionTimeoutMinutes: settingsState.sessionTimeoutMinutes,
      autoSignOutEnabled: settingsState.autoSignOutEnabled,
      autoSignOutTime: settingsState.autoSignOutTime,
      geofenceBreachAlertsEnabled: settingsState.geofenceBreachAlertsEnabled,
      anomalyAlertsEnabled: settingsState.anomalyAlertsEnabled,
    }),
    [settingsState]
  );

  // Merge with defaults to ensure complete CompanySettings for shift resolution
  const effectiveCompanySettings = useMemo(
    () => ({ ...defaultCompanySettings, ...companySettings }) as CompanySettings,
    [companySettings]
  );

  const { data: currentEmployee, isLoading: employeeLoading } = useEmployee(
    employeeId ? String(employeeId) : null
  );
  const geofencesQuery = useGeofences();
  const geofences = useMemo(() => geofencesQuery.data ?? [], [geofencesQuery.data]);
  // Employees may only check in at their assigned location — never company-wide geofences.
  // Prefer employee doc; fall back to auth profile assignment when employee row lags.
  const assignedGeofenceId = useMemo(
    () => resolveAssignedGeofenceId(currentEmployee?.geofenceId ?? null, authAssignedGeofenceId),
    [currentEmployee?.geofenceId, authAssignedGeofenceId]
  );
  const assignedGeofence = useMemo(
    () =>
      assignedGeofenceId
        ? (geofences.find((g) => String(g.id) === String(assignedGeofenceId)) ?? null)
        : null,
    [geofences, assignedGeofenceId]
  );
  const allowedGeofences = useMemo(
    () =>
      assignedGeofenceId
        ? geofences.filter((g) => String(g.id) === String(assignedGeofenceId))
        : [],
    [geofences, assignedGeofenceId]
  );
  // Don't treat background refetch as "not ready" — that flickers the check-in gate.
  const geofencesLoading = !!(
    employeeLoading ||
    (geofencesQuery.isLoading && !geofencesQuery.data)
  );
  const geofencesReady = !geofencesLoading;
  const {
    data: todayRecords = [],
    isLoading: attendanceLoading,
    isFetching: attendanceFetching,
  } = useMyAttendance(employeeId ? String(employeeId) : null);
  // Prefer open session if duplicate legacy rows; else latest by check-in time.
  const todayRecord = useMemo(() => {
    if (!todayRecords.length) return null;
    const open = todayRecords.find((r) => r.checkInTime && !r.checkOutTime);
    if (open) return open;
    return [...todayRecords].sort((a, b) => {
      const at = a.checkInTime ?? "";
      const bt = b.checkInTime ?? "";
      return bt.localeCompare(at);
    })[0];
  }, [todayRecords]);
  const attendancePending = attendanceLoading || (attendanceFetching && !todayRecord);

  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  const employeeForApi = useMemo(
    () =>
      currentEmployee
        ? {
            attendanceMode: currentEmployee.attendanceMode,
            shiftOverride: currentEmployee.shiftOverride,
            geofenceId: currentEmployee.geofenceId ?? null,
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
  } = useGeolocation({ geofences: allowedGeofences, enabled: true });

  const [isOnline, setIsOnline] = useState(true);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);

  const autoCheckInTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const burstTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkInGuardRef = useRef(false);
  const checkOutGuardRef = useRef(false);
  const autoCheckInAttempted = useRef(false);
  /** Last time GPS position object changed — used to reject stale auto check-in. */
  const lastLocationAtRef = useRef<number>(0);

  useEffect(() => {
    if (currentLocation) {
      lastLocationAtRef.current = Date.now();
    }
  }, [currentLocation]);

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

  // Worked-time ticker — parse company wall clock, not browser-local Date.
  const checkInTimestamp = useMemo(() => {
    if (!todayRecord?.checkInTime || !todayRecord?.date) return null;
    const tz =
      (effectiveCompanySettings as { timezone?: string }).timezone || DEFAULT_COMPANY_TIMEZONE;
    return companyWallClockToUtcMs(todayRecord.date, todayRecord.checkInTime, tz);
  }, [todayRecord?.checkInTime, todayRecord?.date, effectiveCompanySettings]);

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

  // Do not trust isWithinRange while assignment/geofences are still loading.
  const trustedIsWithinRange = geofencesReady ? isWithinRange : false;

  // Hard rule: assigned location only. Company "allow outside" does not waive assignment.
  const canCheckIn = useMemo(() => {
    if (!geofencesReady || attendancePending) return false;
    if (todayRecord?.checkInTime || todayRecord?.checkOutTime) return false;
    const gate = assertClientAssignedCheckInAllowed({
      assignedGeofenceId,
      allowedGeofencesCount: allowedGeofences.length,
      isWithinAssignedGeofence: trustedIsWithinRange,
      hasLocation: Boolean(currentLocation),
    });
    return gate.ok;
  }, [
    geofencesReady,
    attendancePending,
    todayRecord?.checkInTime,
    todayRecord?.checkOutTime,
    currentLocation,
    trustedIsWithinRange,
    assignedGeofenceId,
    allowedGeofences.length,
  ]);

  const checkInBlockReason = useMemo(():
    | "loading"
    | "no_assignment"
    | "no_location"
    | "permission"
    | "outside"
    | null => {
    if (checkedIn || dayComplete || canCheckIn) return null;
    if (!geofencesReady || isLocating || attendancePending) return "loading";
    if (locationPermissionDenied) return "permission";
    if (!assignedGeofenceId || allowedGeofences.length === 0) return "no_assignment";
    if (!currentLocation) return "no_location";
    return "outside";
  }, [
    checkedIn,
    dayComplete,
    canCheckIn,
    geofencesReady,
    isLocating,
    attendancePending,
    locationPermissionDenied,
    assignedGeofenceId,
    allowedGeofences.length,
    currentLocation,
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
    () => myAttendanceQueryKey(companyId, employeeId, today),
    [companyId, employeeId, today]
  );

  // Keep local "today" aligned with company TZ used by useMyAttendance query key.
  useEffect(() => {
    const tz = settingsTimezone || DEFAULT_COMPANY_TIMEZONE;
    const next = toApiDate(new Date(), tz) ?? formatCompanyDate(new Date(), tz);
    setToday((prev) => (prev === next ? prev : next));
  }, [settingsTimezone]);

  // Offline queue sync is handled globally by OfflineSyncManager component

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
      accuracy: location.accuracy,
      geofenceId: geofence?.id ?? null,
      geofenceName: geofence?.name ?? null,
      timestamp,
      settings: effectiveCompanySettings,
      employeeSnapshot: employeeForApi,
    }),
    [employeeId, employeeName, effectiveCompanySettings, employeeForApi]
  );

  const createOfflineCheckOutRecord = useCallback(
    (timestamp: number): QueuedCheckOut => ({
      id: buildOfflineCheckOutId(),
      employeeId: String(employeeId),
      timestamp,
      settings: effectiveCompanySettings,
    }),
    [employeeId, effectiveCompanySettings]
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
      // Auto path: require a fresh fix so debounce doesn't punch with edge-stale GPS.
      if (source === "auto" && Date.now() - lastLocationAtRef.current > LOCATION_MAX_AGE_MS) {
        return;
      }
      // Wait for today's attendance so we don't double-submit against an open session.
      if (attendancePending) return;
      // Terminal day after any check-in (open or checked out).
      if (todayRecord?.checkInTime || todayRecord?.checkOutTime) return;
      if (checkInMutation.isPending) return;
      if (checkInGuardRef.current) return;
      checkInGuardRef.current = true;

      // Only the assigned geofence is valid — ignore any other nearby zones.
      const geofence =
        allowedGeofences.find((g) => String(g.id) === String(assignedGeofenceId)) ??
        (nearestGeofence?.geofence &&
        String(nearestGeofence.geofence.id) === String(assignedGeofenceId)
          ? nearestGeofence.geofence
          : null);

      const gate = assertClientAssignedCheckInAllowed({
        assignedGeofenceId,
        allowedGeofencesCount: allowedGeofences.length,
        isWithinAssignedGeofence: Boolean(
          trustedIsWithinRange && geofence && String(geofence.id) === String(assignedGeofenceId)
        ),
        hasLocation: Boolean(currentLocation),
      });

      if (!gate.ok) {
        checkInGuardRef.current = false;
        hapticError();
        if (gate.reason === "no_assignment") {
          toastError(t("noGeofenceDescription"));
        } else if (gate.reason === "no_location") {
          toastError(t("locationNotDetermined"));
        } else {
          toastError(t("outsideGeofence"));
        }
        return;
      }

      const nowDate = new Date();
      const timestamp = nowDate.getTime();
      const { formatCompanyTime, formatCompanyDate, DEFAULT_COMPANY_TIMEZONE } =
        await import("@/lib/utils/companyDate");
      const tz =
        (effectiveCompanySettings as { timezone?: string }).timezone || DEFAULT_COMPANY_TIMEZONE;
      const checkInTime = formatCompanyTime(nowDate, tz);
      // Keep offline synthetic date aligned with server company day.
      const companyToday = formatCompanyDate(nowDate, tz);

      const { mode, shift, slot } = resolveEmployeeShift(
        employeeForApi ?? {},
        effectiveCompanySettings,
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
          date: companyToday,
          checkInTime,
          checkOutTime: null,
          status,
          checkInLat: currentLocation.lat,
          checkInLng: currentLocation.lng,
          geofenceId: geofence?.id ?? assignedGeofenceId,
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
          geofenceId: assignedGeofenceId,
          companySettings: effectiveCompanySettings as unknown as Record<string, unknown>,
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
        } else if (errMsg === "EMPLOYEE_HAS_NO_ASSIGNED_GEOFENCE") {
          toastError(t("noGeofenceDescription"));
        } else if (
          errMsg === "ASSIGNED_GEOFENCE_NOT_FOUND_OR_INACTIVE" ||
          errMsg === "CHECK_IN_GEOFENCE_MISMATCH" ||
          errMsg.includes("outside the assigned geofence")
        ) {
          toastError(t("outsideGeofence"));
        } else if (errMsg === "ALREADY_CHECKED_OUT") {
          toastError(t("shiftDoneStatus"));
        } else if (
          errMsg.includes("Missing or insufficient permissions") ||
          errMsg.includes("permission-denied")
        ) {
          // Usually company_id type mismatch or rules — not "unlinked account".
          toastError(t("checkInPermissionDenied"));
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
      trustedIsWithinRange,
      nearestGeofence,
      assignedGeofenceId,
      allowedGeofences,
      todayRecord?.checkInTime,
      todayRecord?.checkOutTime,
      attendancePending,
      checkInMutation,
      effectiveCompanySettings,
      qc,
      todayCacheKey,
      t,
      createOfflineCheckInRecord,
    ]
  );

  // Auto check-in only at the assigned geofence
  useEffect(() => {
    if (!companySettings.autoCheckInEnabled) return;
    if (autoCheckInAttempted.current) return;
    if (todayRecord?.checkInTime || todayRecord?.checkOutTime) return;
    if (!currentLocation || !nearestGeofence?.geofence || !assignedGeofenceId) return;
    if (String(nearestGeofence.geofence.id) !== String(assignedGeofenceId)) return;
    if (!canCheckIn) return;

    const accuracy =
      currentLocation.accuracy && Number.isFinite(currentLocation.accuracy)
        ? currentLocation.accuracy
        : 0;
    const offset = companySettings.autoCheckInRadiusOffset ?? 0;
    // Same inside rule as manual/server (+ optional auto radius offset).
    const isWithinAutoRange = isInsideAssignedGeofence(
      currentLocation.lat,
      currentLocation.lng,
      {
        lat: nearestGeofence.geofence.lat,
        lng: nearestGeofence.geofence.lng,
        radius: nearestGeofence.geofence.radius + offset,
      },
      accuracy
    );

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
    todayRecord?.checkOutTime,
    currentLocation,
    nearestGeofence,
    assignedGeofenceId,
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
    const timestamp = nowDate.getTime();
    const { formatCompanyTime, DEFAULT_COMPANY_TIMEZONE } = await import("@/lib/utils/companyDate");
    const tz =
      (effectiveCompanySettings as { timezone?: string }).timezone || DEFAULT_COMPANY_TIMEZONE;
    const checkOutTime = formatCompanyTime(nowDate, tz);

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
        toastError(t("checkOutPermissionDenied"));
      } else if (errMsg === "No open attendance record") {
        toastError(t("noCheckInToday"));
      } else if (errMsg === "ALREADY_CHECKED_OUT") {
        toastError(t("shiftDoneStatus"));
        void qc.invalidateQueries({ queryKey: todayCacheKey });
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
    effectiveCompanySettings,
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
    assignedGeofenceId,
    assignedGeofence,
    checkInBlockReason,
    canCheckIn,
    isLoadingGeofences: geofencesLoading,
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
