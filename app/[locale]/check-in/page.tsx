"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { CheckCircle, LogOut, WifiOff, RefreshCw, MapPin, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "@/components/shared/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCheckInPage } from "@/hooks/useCheckInPage";
import { cn } from "@/lib/utils";

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
  const t = useTranslations("CheckIn");
  const {
    employeeName,
    companyName,
    isOnline,
    isLocating,
    canCheckIn,
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
    nearestGeofence,
  } = useCheckInPage();

  const StatusIcon = statusMeta.icon;

  return (
    <MainLayout bare>
      <div className="flex flex-col gap-4 max-w-md mx-auto px-4 pt-[env(safe-area-inset-top)] pb-8 min-h-screen justify-center">
        {/* Header */}
        <Card className="relative overflow-hidden border border-border/50 bg-card shadow-md">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardContent className="relative p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {t("welcome")}
                </p>
                <h2 className="text-xl font-bold text-foreground truncate">{employeeName}</h2>
                <p className="text-xs text-primary font-medium truncate">{companyName || "—"}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span
                  className={cn(
                    "shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold",
                    statusMeta.color
                  )}
                >
                  <StatusIcon className="w-3 h-3" />
                  {statusMeta.label}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={handleSignOut}
                  aria-label={t("signOut")}
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
                  key={String(checkedIn) + String(dayComplete) + String(isCheckInPending)}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
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
                    "w-44 h-44 rounded-full flex flex-col items-center justify-center gap-2 shadow-2xl transition-all border-4 active:scale-95",
                    dayComplete
                      ? "bg-card text-muted-foreground/70 border-border shadow-muted/20"
                      : checkedIn
                        ? "bg-primary text-primary-foreground border-primary/20 shadow-primary/30"
                        : !canCheckIn
                          ? "bg-[hsl(48_96%_53%)] text-primary-foreground border-[hsl(48_96%_53%/0.3)] shadow-amber-500/30"
                          : "bg-primary text-primary-foreground border-primary/20 shadow-primary/30"
                  )}
                >
                  {isCheckInPending ? (
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  ) : dayComplete ? (
                    <>
                      <CheckCircle className="w-10 h-10" />
                      <span className="text-sm font-bold">{t("doneLabel")}</span>
                    </>
                  ) : checkedIn ? (
                    <>
                      <CheckCircle className="w-10 h-10" />
                      <span className="text-sm font-bold">{t("checkedInLabel")}</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-10 h-10" />
                      <span className="text-sm font-bold">{t("checkIn")}</span>
                    </>
                  )}
                </motion.button>
              </AnimatePresence>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2">
              {dayComplete ? (
                <>
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-muted-foreground">
                    {t("shiftDoneStatus")}
                  </span>
                </>
              ) : checkedIn ? (
                <>
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">
                    {t("checkedInWithTime", { time: checkInTime })}
                  </span>
                </>
              ) : canCheckIn ? (
                <>
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">{t("readyToCheckIn")}</span>
                </>
              ) : isLocating || isLoadingGeofences ? (
                <>
                  <RefreshCw className="w-4 h-4 text-muted-foreground animate-spin" />
                  <span className="text-sm font-semibold text-muted-foreground">
                    {t("locating")}
                  </span>
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-semibold text-amber-500">
                    {t("outsideGeofenceShort")}
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="border border-border/50 bg-card">
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              {t("todayRecord")}
            </h3>

            <div className="relative flex flex-col gap-3">
              <div className="absolute right-[17px] top-2 bottom-2 w-0.5 bg-border" />

              <div className="relative flex items-start gap-3">
                <div
                  className={cn(
                    "z-10 w-3.5 h-3.5 rounded-full mt-1 ring-2 ring-card",
                    checkInTime ? "bg-primary" : "bg-muted"
                  )}
                />
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">{t("checkInLabel")}</p>
                  <p className="text-xs text-muted-foreground">{checkInTime || "--:--"}</p>
                </div>
              </div>

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
                  <p className="text-sm font-bold text-foreground">{t("checkOutLabel")}</p>
                  <p className="text-xs text-muted-foreground">
                    {checkOutTime || (checkedIn ? t("ongoing") : "--:--")}
                  </p>
                </div>
                {checkedIn && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive text-xs gap-1 px-2 py-1 h-auto hover:bg-destructive/10"
                    onClick={handleCheckOutClick}
                    disabled={isCheckOutPending}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    {isCheckOutPending ? t("processing") : t("endShift")}
                  </Button>
                )}
              </div>
            </div>

            {checkedIn && (
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t("shiftDuration")}</span>
                <span className="text-base font-mono font-bold text-primary">{elapsedTime}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Offline Banner */}
        {!isOnline && (
          <div className="flex items-center gap-2 px-4 py-3 bg-[hsl(48_96%_53%/0.1)] text-[hsl(48_96%_53%)] rounded-xl border border-[hsl(48_96%_53%/0.2)]">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span className="text-[11px] font-bold">{t("offlineBanner")}</span>
          </div>
        )}
      </div>

      {/* Checkout Confirmation */}
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
              <h3 className="text-lg font-bold text-foreground text-center">{t("checkOut")}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("checkInLabel")}</span>
                  <span className="font-medium text-foreground">{checkInTime || "--:--"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("shiftDuration")}</span>
                  <span className="font-mono font-bold text-primary">{elapsedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("location")}</span>
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
                  {t("cancel")}
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 bg-primary hover:bg-primary/90"
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
