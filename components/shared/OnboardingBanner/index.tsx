"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, MapPin, Check, X, Rocket, ArrowLeft, CheckCircle } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { hapticTap } from "@/lib/utils/haptics";

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
      title: "أضف موظفيك",
      description: "أضف أول موظف لبدء تتبع الحضور",
      href: "/employees",
      cta: "إضافة موظف",
      color: "primary",
    },
    {
      id: "geofences",
      done: hasGeofences,
      icon: MapPin,
      title: "حدد موقع العمل",
      description: "أنشئ نطاقاً جغرافياً لموقع العمل",
      href: "/geofences",
      cta: "إضافة موقع",
      color: "indigo",
    },
    {
      id: "attendance",
      done: attendanceDone,
      icon: CheckCircle,
      title: "اطلب تسجيل الحضور",
      description: "اطلب من موظفيك تسجيل الحضور عبر التطبيق",
      href: "/check-in",
      cta: "صفحة الحضور",
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
          className="relative rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 shadow-lg"
        >
          <div className="relative p-5">
            {/* Header row */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <Rocket className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-slate-100 text-base">
                    مرحباً بك في Trax
                    {companyName && (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {" "}
                        — {companyName}
                      </span>
                    )}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    أكمل الخطوات التالية لبدء تتبع فريقك
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors shrink-0"
                aria-label="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="mb-5">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 mb-1.5">
                <span>
                  {completedCount} من {steps.length} خطوات مكتملة
                </span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-emerald-500"
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
                        ? "border-green-200 dark:border-green-800/40 bg-green-50/60 dark:bg-green-900/10"
                        : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon / check */}
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          step.done
                            ? "bg-green-100 dark:bg-green-900/30"
                            : step.color === "primary"
                              ? "bg-emerald-100 dark:bg-emerald-900/30"
                              : "bg-indigo-100 dark:bg-indigo-900/30"
                        }`}
                      >
                        {step.done ? (
                          <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <Icon
                            className={`w-5 h-5 ${step.color === "primary" ? "text-emerald-600 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-400"}`}
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-semibold ${step.done ? "text-green-700 dark:text-green-400 line-through opacity-75" : "text-gray-900 dark:text-slate-100"}`}
                        >
                          {step.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                          {step.description}
                        </p>
                        {!step.done && (
                          <button
                            onClick={() => {
                              hapticTap();
                              router.push(step.href);
                            }}
                            className={`inline-flex items-center gap-1 mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                              step.color === "primary"
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/30"
                                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/30"
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
                className="mt-4 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                    رائع! كل شيء جاهز
                  </p>
                  <p className="text-xs text-green-600/80 dark:text-green-500">
                    يمكن لموظفيك الآن تسجيل الحضور
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
