"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, MapPin, Check, X, Rocket, ArrowLeft, CheckCircle } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { hapticTap } from "@/lib/utils/haptics";
import { useTranslations } from "next-intl";

interface OnboardingBannerProps {
  hasEmployees: boolean;
  hasGeofences: boolean;
  hasAttendanceToday?: boolean;
}

export default function OnboardingBanner({
  hasEmployees,
  hasGeofences,
  hasAttendanceToday,
}: OnboardingBannerProps) {
  const t = useTranslations("Onboarding");
  const router = useRouter();
  const { companyName, companyId } = useAuthStore();
  const [dismissed, setDismissed] = useState(true);

  const DISMISS_KEY = `trax_onboarding_dismissed_${companyId ?? "default"}`;

  useEffect(() => {
    const stored = localStorage.getItem(DISMISS_KEY);
    if (stored !== "true") setDismissed(false);
  }, [DISMISS_KEY]);

  const attendanceDone = hasAttendanceToday || !hasEmployees;
  const allDone = hasEmployees && hasGeofences && attendanceDone;

  useEffect(() => {
    if (allDone) {
      localStorage.setItem(DISMISS_KEY, "true");
      setDismissed(true);
    }
  }, [allDone, DISMISS_KEY]);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  };

  const steps = [
    {
      id: "employees",
      done: hasEmployees,
      icon: Users,
      title: t("addEmployeesTitle"),
      description: t("addEmployeesDescription"),
      href: "/employees",
      cta: t("addEmployeesCta"),
      color: "primary",
    },
    {
      id: "geofences",
      done: hasGeofences,
      icon: MapPin,
      title: t("defineWorkLocationTitle"),
      description: t("defineWorkLocationDescription"),
      href: "/geofences",
      cta: t("defineWorkLocationCta"),
      color: "indigo",
    },
    {
      id: "attendance",
      done: attendanceDone,
      icon: CheckCircle,
      title: t("requestCheckInTitle"),
      description: t("requestCheckInDescription"),
      href: "/check-in",
      cta: t("requestCheckInCta"),
      color: "green",
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const progress = (completedCount / steps.length) * 100;

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.98 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-2xl border border-border bg-card/80 shadow-sm"
        >
          <div className="relative p-5">
            {/* Header row */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md shadow-primary/20">
                  <Rocket className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground text-base" dir="rtl">
                    {t("welcomeToTrax")}
                    {companyName && (
                      <span className="text-primary">
                        {" — "}
                        <bdi>{companyName}</bdi>
                      </span>
                    )}
                  </h2>
                  <p className="text-sm text-muted-foreground">{t("completeSteps")}</p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-lg text-muted-foreground/70 hover:text-muted-foreground dark:hover:text-muted-foreground hover:bg-muted transition-colors shrink-0"
                aria-label={t("close")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="mb-5">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span>
                  {t("stepsCompleted", { completed: completedCount, total: steps.length })}
                </span>
                <span className="font-semibold text-primary">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
                />
              </div>
            </div>

            {/* Steps */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    className={`relative rounded-xl border p-4 transition-all ${
                      step.done
                        ? "border-primary/20 bg-primary/5"
                        : "border-border bg-card/60 hover:border-primary/30 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon / check */}
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          step.done
                            ? "bg-primary/10"
                            : step.color === "primary"
                              ? "bg-primary/10"
                              : "bg-primary/10"
                        }`}
                      >
                        {step.done ? (
                          <Check className="w-5 h-5 text-primary" />
                        ) : (
                          <Icon
                            className={`w-5 h-5 ${step.color === "primary" ? "text-primary" : "text-primary"}`}
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-semibold ${step.done ? "text-primary line-through opacity-75" : "text-foreground"}`}
                        >
                          {step.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                        {!step.done && (
                          <button
                            onClick={() => {
                              hapticTap();
                              router.push(step.href);
                            }}
                            className={`inline-flex items-center gap-1 mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                              step.color === "primary"
                                ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/30"
                                : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/30"
                            }`}
                          >
                            {step.cta}
                            <ArrowLeft className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* All done state */}
            {allDone && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/30/40 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary">{t("allSetTitle")}</p>
                  <p className="text-xs text-primary/80">{t("allSetDescription")}</p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
