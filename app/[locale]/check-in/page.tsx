"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { CheckCircle2, LogOut, WifiOff, RefreshCw, MapPin, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "@/components/shared/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCheckInPage } from "@/hooks/useCheckInPage";
import { useCompanySettingsStore } from "@/stores/useCompanySettingsStore";
import { DEFAULT_COMPANY_TIMEZONE } from "@/lib/utils/companyDate";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRouter } from "@/i18n/navigation";
import { homePathForRole, isEmployeeRole } from "@/lib/utils/roleAccess";

function LiveClock() {
  const locale = useLocale();
  const timeLocale = locale === "ar" ? "ar-SA-u-nu-latn" : "en-US";
  const timezone = useCompanySettingsStore((s) => s.timezone) || DEFAULT_COMPANY_TIMEZONE;
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString(timeLocale, {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: timezone,
        })
      );
      setDate(
        now.toLocaleDateString(timeLocale, {
          weekday: "long",
          month: "short",
          day: "numeric",
          timeZone: timezone,
        })
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [timeLocale, timezone]);

  return (
    <div className="text-center space-y-1.5" dir="ltr">
      <p className="text-5xl sm:text-6xl font-bold tracking-tight tabular-nums text-foreground leading-none">
        {time || "--:--"}
      </p>
      <p className="text-sm text-muted-foreground font-medium" dir="auto">
        {date}
      </p>
    </div>
  );
}

export default function CheckInPage() {
  const t = useTranslations("CheckIn");
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  // Only the employee role uses check-in. Company + MasterMind never do.
  const allowed = isEmployeeRole(role);

  useEffect(() => {
    if (role && !allowed) {
      router.replace(homePathForRole(role));
    }
  }, [allowed, role, router]);

  const checkIn = useCheckInPage();
  const {
    employeeSessionActive,
    employeeName,
    companyName,
    isOnline,
    isLocating,
    canCheckIn,
    checkInBlockReason,
    assignedGeofence,
    isLoadingGeofences,
    dayComplete,
    checkedIn,
    checkInTime,
    checkOutTime,
    elapsedTime,
    statusMeta,
    isCheckInPending,
    isCheckOutPending,
    showCheckoutConfirm,
    setShowCheckoutConfirm,
    handleCheckIn,
    handleCheckOutClick,
    confirmCheckOut,
    handleSignOut,
    showBurst,
  } = checkIn;

  if (role && !allowed) {
    return (
      <MainLayout>
        <div className="flex min-h-[50vh] items-center justify-center p-6 text-sm text-muted-foreground">
          {t("companyAccountNoCheckIn")}
        </div>
      </MainLayout>
    );
  }

  // Employee role without staff linkage cannot punch — block before GPS UI.
  if (role === "employee" && !employeeSessionActive) {
    return (
      <MainLayout bare>
        <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-sm font-medium text-foreground">{t("noEmployeeId")}</p>
          <Button variant="outline" onClick={handleSignOut}>
            {t("signOut")}
          </Button>
        </div>
      </MainLayout>
    );
  }

  const isBusyLoading = checkInBlockReason === "loading" || isLocating || isLoadingGeofences;

  const blockMessage = (() => {
    switch (checkInBlockReason) {
      case "loading":
        return t("locating");
      case "permission":
        return t("locationPermissionDenied");
      case "no_assignment":
        return t("noAssignedLocation");
      case "no_location":
        return t("locationUnavailable");
      case "outside":
        return assignedGeofence?.name
          ? t("outsideAssignedLocation", { name: assignedGeofence.name })
          : t("outsideGeofenceShort");
      default:
        return null;
    }
  })();

  const StatusIcon = statusMeta.icon;

  const statusTone = dayComplete
    ? "border-border bg-muted/40 text-muted-foreground"
    : checkedIn
      ? "border-primary/20 bg-primary/10 text-primary"
      : canCheckIn
        ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
        : isBusyLoading
          ? "border-border bg-muted/50 text-muted-foreground"
          : "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400";

  const ringTone = dayComplete
    ? "bg-muted text-muted-foreground border-border shadow-none"
    : checkedIn
      ? "bg-primary text-primary-foreground border-primary/30 shadow-primary/25"
      : canCheckIn
        ? "bg-primary text-primary-foreground border-primary/30 shadow-primary/30"
        : "bg-muted text-muted-foreground border-border shadow-none";

  return (
    <MainLayout bare>
      <div className="min-h-[100dvh] bg-gradient-to-b from-muted/40 via-background to-background">
        <div className="mx-auto flex w-full max-w-md flex-col gap-3 px-4 pb-10 pt-[max(0.75rem,env(safe-area-inset-top))]">
          {!isOnline && (
            <div
              role="status"
              className="flex items-center gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-amber-800 dark:text-amber-200"
            >
              <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
              <p className="text-xs font-semibold leading-snug">{t("offlineBanner")}</p>
            </div>
          )}

          <header className="rounded-2xl border border-border/60 bg-card/90 px-4 py-3.5 shadow-sm backdrop-blur-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-[11px] font-medium text-muted-foreground">{t("welcome")}</p>
                <h1 className="truncate text-xl font-bold leading-tight text-foreground">
                  {employeeName}
                </h1>
                <p className="truncate text-sm font-medium text-muted-foreground">
                  {companyName || "—"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                onClick={handleSignOut}
                aria-label={t("signOut")}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                  statusMeta.color
                )}
              >
                <StatusIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {statusMeta.label}
              </span>
              {assignedGeofence?.name ? (
                <span className="inline-flex max-w-full items-center gap-1 truncate rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                  <span className="truncate">{assignedGeofence.name}</span>
                </span>
              ) : null}
            </div>
          </header>

          <Card className="overflow-hidden border-border/60 bg-card shadow-md">
            <CardContent className="flex flex-col items-center gap-6 px-5 pb-6 pt-7">
              <LiveClock />

              <div className="relative flex h-48 w-48 items-center justify-center">
                <AnimatePresence>
                  {showBurst &&
                    Array.from({ length: 10 }).map((_, i) => {
                      const angle = (i / 10) * Math.PI * 2;
                      return (
                        <motion.div
                          key={i}
                          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                          animate={{
                            x: Math.cos(angle) * 88,
                            y: Math.sin(angle) * 88,
                            opacity: 0,
                            scale: 0.2,
                          }}
                          transition={{ duration: 0.55, ease: "easeOut" }}
                          className="pointer-events-none absolute h-2 w-2 rounded-full bg-primary"
                          style={{ left: "50%", top: "50%", marginLeft: -4, marginTop: -4 }}
                        />
                      );
                    })}
                </AnimatePresence>

                <div
                  className={cn(
                    "absolute inset-2 rounded-full border-2 opacity-40",
                    canCheckIn && !checkedIn && !dayComplete
                      ? "border-primary animate-pulse"
                      : "border-border"
                  )}
                  aria-hidden
                />

                <motion.button
                  type="button"
                  whileTap={
                    !checkedIn && !dayComplete && canCheckIn && !isCheckInPending
                      ? { scale: 0.96 }
                      : undefined
                  }
                  onClick={() => handleCheckIn("manual")}
                  disabled={checkedIn || dayComplete || isCheckInPending || !canCheckIn}
                  aria-label={
                    dayComplete
                      ? t("shiftDoneStatus")
                      : checkedIn
                        ? t("checkedInStatus")
                        : isCheckInPending
                          ? t("checkingIn")
                          : t("checkIn")
                  }
                  className={cn(
                    "relative z-10 flex h-40 w-40 flex-col items-center justify-center gap-2 rounded-full border-4 shadow-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed",
                    ringTone
                  )}
                >
                  {isCheckInPending ? (
                    <RefreshCw className="h-9 w-9 animate-spin" aria-hidden />
                  ) : dayComplete ? (
                    <>
                      <CheckCircle2 className="h-10 w-10" aria-hidden />
                      <span className="text-sm font-bold tracking-wide">{t("doneLabel")}</span>
                    </>
                  ) : checkedIn ? (
                    <>
                      <CheckCircle2 className="h-10 w-10" aria-hidden />
                      <span className="text-sm font-bold tracking-wide">{t("checkedInLabel")}</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="h-10 w-10" aria-hidden />
                      <span className="text-sm font-bold tracking-wide">{t("checkIn")}</span>
                    </>
                  )}
                </motion.button>
              </div>

              <div
                className={cn(
                  "flex w-full items-start gap-2.5 rounded-xl border px-3.5 py-3 text-start",
                  statusTone
                )}
                role="status"
              >
                {dayComplete || checkedIn || canCheckIn ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                ) : isBusyLoading ? (
                  <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 animate-spin" aria-hidden />
                ) : (
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                )}
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-sm font-semibold leading-snug">
                    {dayComplete
                      ? t("shiftDoneStatus")
                      : checkedIn
                        ? t("checkedInWithTime", { time: checkInTime ?? "--:--" })
                        : canCheckIn
                          ? assignedGeofence?.name
                            ? t("readyAtLocation", { name: assignedGeofence.name })
                            : t("readyToCheckIn")
                          : isBusyLoading
                            ? t("locating")
                            : (blockMessage ?? t("outsideGeofenceShort"))}
                  </p>
                  {assignedGeofence?.name && !dayComplete && (canCheckIn || checkedIn) && (
                    <p className="flex items-center gap-1 text-xs opacity-80">
                      <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                      <span className="truncate">{assignedGeofence.name}</span>
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card shadow-sm">
            <CardContent className="space-y-4 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <Clock className="h-4 w-4 text-primary" aria-hidden />
                  {t("todayRecord")}
                </h2>
                {checkedIn && elapsedTime ? (
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-xs font-bold text-primary">
                    {elapsedTime}
                  </span>
                ) : null}
              </div>

              <ol className="relative ms-2 space-y-0 border-s-2 border-border ps-5">
                <li className="relative pb-5">
                  <span
                    className={cn(
                      "absolute -start-[1.4rem] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-4 ring-card",
                      checkInTime ? "bg-primary" : "bg-muted-foreground/30"
                    )}
                    aria-hidden
                  />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t("checkInLabel")}</p>
                      <p className="mt-0.5 font-mono text-base font-bold tabular-nums text-foreground">
                        {checkInTime || "--:--"}
                      </p>
                    </div>
                  </div>
                </li>

                <li className="relative">
                  <span
                    className={cn(
                      "absolute -start-[1.4rem] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-4 ring-card",
                      checkOutTime
                        ? "bg-foreground"
                        : checkedIn
                          ? "bg-primary/40 animate-pulse"
                          : "bg-muted-foreground/30"
                    )}
                    aria-hidden
                  />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t("checkOutLabel")}</p>
                      <p className="mt-0.5 font-mono text-base font-bold tabular-nums text-foreground">
                        {checkOutTime || (checkedIn ? t("ongoing") : "--:--")}
                      </p>
                    </div>
                  </div>
                </li>
              </ol>

              {checkedIn && (
                <div className="space-y-3 border-t border-border pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("shiftDuration")}</span>
                    <span className="font-mono text-base font-bold text-primary">
                      {elapsedTime}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    className="h-11 w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={handleCheckOutClick}
                    disabled={isCheckOutPending}
                  >
                    {isCheckOutPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="h-4 w-4" />
                    )}
                    {isCheckOutPending ? t("processing") : t("endShift")}
                  </Button>
                </div>
              )}

              {dayComplete && (
                <div className="rounded-xl border border-border bg-muted/40 px-3.5 py-3 text-center text-sm font-medium text-muted-foreground">
                  {t("shiftDoneStatus")}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AnimatePresence>
        {showCheckoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCheckoutConfirm(false)}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          >
            <motion.div
              initial={{ y: 48, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 48, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-t-3xl border border-border bg-background p-5 shadow-2xl sm:rounded-3xl sm:p-6"
              role="dialog"
              aria-modal="true"
              aria-labelledby="checkout-title"
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted sm:hidden" aria-hidden />
              <h3 id="checkout-title" className="text-center text-lg font-bold text-foreground">
                {t("checkOut")}
              </h3>

              <dl className="mt-5 space-y-3 rounded-2xl border border-border bg-muted/30 p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">{t("checkInLabel")}</dt>
                  <dd className="font-mono font-semibold tabular-nums text-foreground">
                    {checkInTime || "--:--"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">{t("shiftDuration")}</dt>
                  <dd className="font-mono font-bold tabular-nums text-primary">{elapsedTime}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">{t("location")}</dt>
                  <dd className="max-w-[55%] truncate text-end font-medium text-foreground">
                    {assignedGeofence?.name || "\u2014"}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <Button
                  variant="ghost"
                  className="h-11"
                  onClick={() => setShowCheckoutConfirm(false)}
                >
                  {t("cancel")}
                </Button>
                <Button
                  variant="primary"
                  className="h-11 bg-primary hover:bg-primary/90"
                  onClick={confirmCheckOut}
                  disabled={isCheckOutPending}
                >
                  {isCheckOutPending ? t("processing") : t("confirm")}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
}
