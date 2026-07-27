"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { hapticTap, hapticSuccess } from "@/lib/utils/haptics";
import { toastSuccess } from "@/hooks/use-toast";

const ONBOARDED_KEY = "trax_onboarded";

interface TourStep {
  title: string;
  description: string;
  highlightSelector?: string;
  icon: React.ReactNode;
}

const tourSteps: TourStep[] = [
  {
    title: "مرحباً بك في Trax!",
    description: "دعنا نتعرف على النظام معاً. جولة سريعة لتكتشف كل الميزات.",
    icon: <span className="text-4xl">👋</span>,
  },
  {
    title: "القائمة الجانبية",
    description:
      "من هنا يمكنك التنقل بين جميع أقسام النظام بسهولة — لوحة التحكم، الموظفون، الحضور، والخريطة.",
    highlightSelector: "aside#logo-sidebar",
    icon: <span className="text-4xl">📋</span>,
  },
  {
    title: "بطاقات الإحصائيات",
    description:
      "هذه البطاقات تعرض أهم المؤشرات: عدد الموظفين، الحاضرون، المتأخرون، والغائبون. يمكنك سحبها لإعادة ترتيبها!",
    highlightSelector: ".grid.gap-6.sm\\:grid-cols-2.lg\\:grid-cols-3",
    icon: <span className="text-4xl">📊</span>,
  },
  {
    title: "لوحة الأوامر",
    description: "اضغط Ctrl+K (أو ⌘K على Mac) لفتح لوحة الأوامر والوصول السريع لأي قسم.",
    highlightSelector: "[aria-label='بحث']",
    icon: <span className="text-4xl">⌨️</span>,
  },
  {
    title: "الإشعارات",
    description: "ستجد إشعاراتك هنا — تنبيهات الحضور، تجاوز النطاقات، والذكاء الاصطناعي.",
    highlightSelector: "[aria-label*='الإشعارات']",
    icon: <span className="text-4xl">🔔</span>,
  },
];

export function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  const checkOnboarded = useCallback(() => {
    try {
      const onboarded = localStorage.getItem(ONBOARDED_KEY);
      if (!onboarded) {
        const timer = setTimeout(() => setIsOpen(true), 1500);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const cleanup = checkOnboarded();
    return cleanup;
  }, [checkOnboarded]);

  useEffect(() => {
    if (!isOpen || !tourSteps[currentStep]?.highlightSelector) {
      setHighlightRect(null);
      return;
    }

    const updateHighlight = () => {
      const el = document.querySelector(tourSteps[currentStep].highlightSelector!);
      if (el) {
        const rect = el.getBoundingClientRect();
        setHighlightRect(rect);
      } else {
        setHighlightRect(null);
      }
    };

    updateHighlight();
    window.addEventListener("resize", updateHighlight);
    window.addEventListener("scroll", updateHighlight, true);

    return () => {
      window.removeEventListener("resize", updateHighlight);
      window.removeEventListener("scroll", updateHighlight, true);
    };
  }, [isOpen, currentStep]);

  const handleNext = () => {
    hapticTap();
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    hapticTap();
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  const handleSkip = () => {
    hapticTap();
    setIsOpen(false);
    setCurrentStep(0);
  };

  const handleFinish = () => {
    hapticSuccess();
    try {
      localStorage.setItem(ONBOARDED_KEY, "true");
    } catch {}
    setIsOpen(false);
    setCurrentStep(0);
    toastSuccess("اكتملت الجولة التعريفية! مرحباً بك في Trax");
  };

  if (!isOpen) return null;

  const step = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleSkip} />

          {/* Highlight box */}
          {highlightRect && (
            <div
              className="absolute border-2 border-primary rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] transition-all duration-300 pointer-events-none"
              style={{
                top: highlightRect.top - 4,
                left: highlightRect.left - 4,
                width: highlightRect.width + 8,
                height: highlightRect.height + 8,
              }}
            />
          )}

          {/* Tour card */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="relative z-[101] bg-card rounded-2xl shadow-lg p-8 max-w-md w-full mx-4"
          >
            <button
              onClick={handleSkip}
              className="absolute top-4 left-4 p-1.5 rounded-lg hover:bg-muted transition-colors"
              aria-label="تخطي"
            >
              <X className="w-5 h-5 text-muted-foreground/70" />
            </button>

            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-4 shadow-lg">
                {step.icon}
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">{step.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {tourSteps.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === currentStep
                      ? "w-8 bg-primary/50"
                      : i < currentStep
                        ? "w-2 bg-primary/30"
                        : "w-2 bg-muted-foreground/30 bg-muted"
                  }`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handleSkip}
                className="text-sm text-muted-foreground hover:text-muted-foreground dark:hover:text-foreground transition-colors"
              >
                تخطي
              </button>
              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrev}
                    className="flex items-center gap-1"
                  >
                    <ChevronRight className="w-4 h-4" />
                    السابق
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleNext}
                  className="flex items-center gap-1"
                >
                  {isLastStep ? "إنهاء" : "التالي"}
                  {!isLastStep && <ChevronLeft className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function replayTour() {
  try {
    localStorage.removeItem(ONBOARDED_KEY);
  } catch {}
  window.dispatchEvent(new Event("storage"));
}
