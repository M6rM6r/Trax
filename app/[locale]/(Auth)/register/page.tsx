"use client";

import { useState, useMemo } from "react";
import { Form, Formik, FormikHelpers } from "formik";
import * as Yup from "yup";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "@/i18n/navigation";
import {
  browserSessionPersistence,
  setPersistence,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/config/firebase";
import { Building2, User, Briefcase, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import CustomInput from "@/components/shared/form/CustomInput";
import { toastSuccess, toastError } from "@/hooks/use-toast";
import { hapticSuccess, hapticError } from "@/lib/utils/haptics";
import { useAuthStore, UserRole } from "@/stores/useAuthStore";
import { firebaseData } from "@/lib/services/firebaseData";
import { useTranslations } from "next-intl";
import {
  getCompanyOnboardingCopy,
  shouldAllowCompanySelfRegistration,
} from "@/lib/utils/onboardingRules";
import loginBG from "@/public/images/loginBg.png";

interface RegisterValues {
  company_name: string;
  industry: string;
  admin_name: string;
  admin_email: string;
  admin_password: string;
  confirm_password: string;
}

function useTranslatedIndustries() {
  const t = useTranslations("Auth");
  return [
    t("industries.retail"),
    t("industries.hospitality"),
    t("industries.construction"),
    t("industries.manufacturing"),
    t("industries.healthcare"),
    t("industries.education"),
    t("industries.logistics"),
    t("industries.it"),
    t("industries.finance"),
    t("industries.other"),
  ];
}

function useTranslatedPlans() {
  const t = useTranslations("Auth");
  return [
    {
      key: "trial",
      name: t("plans.trial"),
      price: t("plans.trialPrice"),
      duration: t("plans.trialDuration"),
      employees: 10,
      color: "border-input",
      badge: "",
      features: [t("plans.trialFeature1"), t("plans.trialFeature2"), t("plans.trialFeature3")],
    },
    {
      key: "starter",
      name: t("plans.starter"),
      price: t("plans.starterPrice"),
      duration: t("plans.starterDuration"),
      employees: 25,
      color: "border-primary",
      badge: t("plans.starterBadge"),
      features: [
        t("plans.starterFeature1"),
        t("plans.starterFeature2"),
        t("plans.starterFeature3"),
      ],
    },
    {
      key: "pro",
      name: t("plans.pro"),
      price: t("plans.proPrice"),
      duration: t("plans.proDuration"),
      employees: 100,
      color: "border-purple-500",
      badge: "",
      features: [t("plans.proFeature1"), t("plans.proFeature2"), t("plans.proFeature3")],
    },
  ];
}

function useRegisterSchema(step: number) {
  const t = useTranslations("Auth");
  return [
    Yup.object({
      company_name: Yup.string()
        .required(t("companyNameRequired"))
        .min(2, t("companyNameTooShort")),
      industry: Yup.string().required(t("industryRequired")),
    }),
    Yup.object({
      admin_name: Yup.string().required(t("fullNameRequired")),
      admin_email: Yup.string().email(t("emailInvalid")).required(t("emailRequired")),
      admin_password: Yup.string().min(8, t("passwordMin")).required(t("passwordRequired")),
      confirm_password: Yup.string()
        .oneOf([Yup.ref("admin_password")], t("passwordsMismatch"))
        .required(t("confirmPasswordRequired")),
    }),
  ][step];
}

export default function RegisterPage() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [step, setStep] = useState(0);
  const INDUSTRIES = useTranslatedIndustries();
  const PLANS = useTranslatedPlans();
  const STEP_LABELS = [t("stepCompany"), t("stepAdmin"), t("stepPlan")];
  const currentStepSchema = useRegisterSchema(step);
  const onboardingCopy = getCompanyOnboardingCopy();
  const allowSelfRegistration = shouldAllowCompanySelfRegistration();
  const [selectedPlan] = useState("trial");
  const [registrationResult, setRegistrationResult] = useState<{
    companyName: string;
    adminEmail: string;
    adminPassword: string;
  } | null>(null);

  const getPasswordStrength = useMemo(
    () => (v: string) => {
      const score = [
        v.length >= 8,
        /[A-Z]/.test(v),
        /[0-9]/.test(v),
        /[^A-Za-z0-9]/.test(v),
      ].filter(Boolean).length;
      const colors = [
        "",
        "bg-destructive",
        "bg-[hsl(25_95%_53%)]",
        "bg-[hsl(48_96%_53%)]",
        "bg-primary",
      ] as const;
      const labels = [
        "",
        t("passwordStrength.weak"),
        t("passwordStrength.fair"),
        t("passwordStrength.good"),
        t("passwordStrength.excellent"),
      ] as const;
      return { score, color: colors[score] || "", label: labels[score] || "" };
    },
    [t]
  );

  const handleSubmit = async (
    values: RegisterValues,
    { setSubmitting }: FormikHelpers<RegisterValues>
  ) => {
    if (!allowSelfRegistration) {
      hapticError();
      toastError(onboardingCopy.description);
      setSubmitting(false);
      return;
    }

    if (step < 2) {
      setStep((s) => s + 1);
      setSubmitting(false);
      return;
    }
    try {
      if (auth) {
        await setPersistence(auth, browserSessionPersistence);

        const { companyId: newCompanyId } = await firebaseData.companies.register({
          company_name: values.company_name,
          industry: values.industry,
          admin_name: values.admin_name,
          admin_email: values.admin_email,
          admin_password: values.admin_password,
        });

        const credential = await signInWithEmailAndPassword(
          auth,
          values.admin_email,
          values.admin_password
        );
        const idToken = await credential.user.getIdToken();

        const role: UserRole = "company";
        setUser(
          {
            id: 0,
            name: values.admin_name,
            email: values.admin_email,
            role: "company",
            permissions: [],
            created_at: new Date().toISOString(),
            profile_image: "",
          },
          idToken,
          role,
          newCompanyId,
          values.company_name
        );

        hapticSuccess();
        toastSuccess(t("registerSuccess"));
        setRegistrationResult({
          companyName: values.company_name,
          adminEmail: values.admin_email,
          adminPassword: values.admin_password,
        });
        return;
      }

      throw new Error(t("firebaseNotConfiguredRegister"));
    } catch (err: unknown) {
      hapticError();
      const message = err instanceof Error ? err.message : t("accountCreationFailed");
      toastError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  const handleGoToDashboard = () => {
    router.push("/");
  };

  return (
    <section className="w-screen min-h-screen flex items-center justify-center relative bg-background py-8">
      <Image
        src={loginBG}
        alt="bg"
        fill
        className="object-cover object-center z-0 dark:opacity-30"
        priority
        quality={85}
      />

      <div className="absolute left-1/2 -translate-x-1/2 top-6 z-20">
        <div className="relative h-14 w-56">
          <Image
            src="/images/logo.png"
            alt="Trax"
            fill
            className="object-contain"
            unoptimized
            priority
          />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 m-5 w-full max-w-[580px] mt-16"
      >
        <div className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-[0_32px_64px_rgba(0,0,0,0.3)]">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {allowSelfRegistration ? t("registerTitle") : onboardingCopy.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {allowSelfRegistration ? t("trialSubtitle") : onboardingCopy.description}
            </p>
          </div>

          {!allowSelfRegistration ? (
            <div className="space-y-4 rounded-2xl border border-[hsl(48_96%_53%/0.2)] bg-[hsl(48_96%_53%/0.1)] p-5 text-sm text-[hsl(48_96%_53%)]">
              <div className="space-y-2">
                <p className="font-semibold">{onboardingCopy.title}</p>
                <p>{onboardingCopy.description}</p>
              </div>
              <div className="rounded-xl border border-[hsl(48_96%_53%/0.3)]/40 bg-background/50 p-3">
                <p className="font-medium">{onboardingCopy.cta}</p>
              </div>
              <Button
                type="button"
                variant="primary"
                onClick={() => router.push("/login")}
                className="w-full"
              >
                {t("backToLogin")}
              </Button>
            </div>
          ) : (
            <>
              {/* Stepper */}
              <div className="flex items-center gap-2 mb-8">
                {STEP_LABELS.map((label, i) => (
                  <div key={i} className="flex items-center gap-2 flex-1 last:flex-none">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          i < step
                            ? "bg-primary text-primary-foreground"
                            : i === step
                              ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                      </div>
                      <span
                        className={`text-xs font-medium hidden sm:block ${
                          i === step
                            ? "text-primary"
                            : i < step
                              ? "text-primary"
                              : "text-muted-foreground/70"
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                    {i < STEP_LABELS.length - 1 && (
                      <div
                        className={`flex-1 h-px transition-all ${i < step ? "bg-primary" : "bg-muted"}`}
                      />
                    )}
                  </div>
                ))}
              </div>

              <Formik
                initialValues={{
                  company_name: "",
                  industry: "",
                  admin_name: "",
                  admin_email: "",
                  admin_password: "",
                  confirm_password: "",
                }}
                validationSchema={step < 2 ? currentStepSchema : undefined}
                onSubmit={handleSubmit}
                validateOnChange={false}
                validateOnBlur={true}
              >
                {(props) => (
                  <Form>
                    <AnimatePresence mode="wait">
                      {/* Step 0 — Company Info */}
                      {step === 0 && (
                        <motion.div
                          key="step0"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4"
                        >
                          <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-primary/10 border border-primary/30">
                            <Building2 className="w-5 h-5 text-primary shrink-0" />
                            <p className="text-sm text-primary/70">{t("companyInfoHint")}</p>
                          </div>
                          <CustomInput
                            name="company_name"
                            type="text"
                            label={t("companyName")}
                            placeholder={t("companyNamePlaceholder")}
                          />
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-muted-foreground">
                              {t("industry")}
                            </label>
                            <select
                              name="industry"
                              value={props.values.industry}
                              onChange={props.handleChange}
                              onBlur={props.handleBlur}
                              className="w-full rounded-xl border border-border bg-card text-foreground px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                            >
                              <option value="">{t("selectIndustry")}</option>
                              {INDUSTRIES.map((ind) => (
                                <option key={ind} value={ind}>
                                  {ind}
                                </option>
                              ))}
                            </select>
                            {props.touched.industry && props.errors.industry && (
                              <p className="text-xs text-destructive">{props.errors.industry}</p>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {/* Step 1 — Admin Account */}
                      {step === 1 && (
                        <motion.div
                          key="step1"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4"
                        >
                          <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-accent/10 border border-purple-800/30">
                            <User className="w-5 h-5 text-accent-foreground shrink-0" />
                            <p className="text-sm text-accent-foreground">
                              {t("adminAccountHint")}
                            </p>
                          </div>
                          <CustomInput
                            name="admin_name"
                            type="text"
                            label={t("fullName")}
                            placeholder={t("fullNamePlaceholder")}
                          />
                          <CustomInput
                            name="admin_email"
                            type="email"
                            label={t("email")}
                            placeholder="admin@company.com"
                            className="text-left [direction:ltr] [unicode-bidi:plaintext]"
                          />
                          <div className="relative">
                            <CustomInput
                              name="admin_password"
                              type="password"
                              label={t("password")}
                              placeholder={t("passwordMin")}
                            />
                            {props.values.admin_password.length > 0 &&
                              (() => {
                                const ps = getPasswordStrength(props.values.admin_password);
                                return (
                                  <div className="mt-2 space-y-1">
                                    <div className="flex gap-1">
                                      {[1, 2, 3, 4].map((seg) => (
                                        <div
                                          key={seg}
                                          className={`h-1.5 flex-1 rounded-full transition-colors ${ps.score >= seg ? ps.color : "bg-muted"}`}
                                        />
                                      ))}
                                    </div>
                                    {ps.label && (
                                      <p
                                        className={`text-xs font-medium ${ps.score <= 1 ? "text-destructive" : ps.score === 2 ? "text-[hsl(25_95%_53%)]" : ps.score === 3 ? "text-[hsl(48_96%_53%)]" : "text-primary"}`}
                                      >
                                        {ps.label}
                                      </p>
                                    )}
                                  </div>
                                );
                              })()}
                          </div>
                          <CustomInput
                            name="confirm_password"
                            type="password"
                            label={t("confirmPassword")}
                            placeholder={t("confirmPasswordPlaceholder")}
                          />
                        </motion.div>
                      )}

                      {/* Step 2 — Plan Selection */}
                      {step === 2 && (
                        <motion.div
                          key="step2"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4"
                        >
                          <div className="flex items-center gap-2 mb-2 p-3 rounded-xl bg-primary/10 border border-primary/20">
                            <Briefcase className="w-5 h-5 text-primary shrink-0" />
                            <p className="text-sm text-primary/70">{t("planHint")}</p>
                          </div>
                          <div className="space-y-3">
                            {PLANS.map((plan) => (
                              <motion.div
                                key={plan.key}
                                className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all ${
                                  selectedPlan === plan.key
                                    ? "border-primary bg-primary/10 shadow-md scale-[1.02]"
                                    : `${plan.color} bg-card/60 hover:shadow-lg`
                                }`}
                              >
                                {plan.badge && (
                                  <motion.span
                                    animate={{ y: [0, -3, 0] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="absolute -top-2.5 left-4 text-xs font-bold bg-primary/50 text-primary-foreground px-2.5 py-0.5 rounded-full"
                                  >
                                    {plan.badge}
                                  </motion.span>
                                )}
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-foreground">{plan.name}</span>
                                      {selectedPlan === plan.key && (
                                        <Check className="w-4 h-4 text-primary" />
                                      )}
                                    </div>
                                    <div className="flex gap-3 mt-1.5">
                                      {plan.features.map((f) => (
                                        <span
                                          key={f}
                                          className="text-xs text-muted-foreground flex items-center gap-1"
                                        >
                                          <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                                          {f}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <div className="font-bold text-lg text-foreground">
                                      {plan.price}
                                    </div>
                                    <div className="text-xs text-muted-foreground/70">
                                      {plan.duration}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                          <p className="text-xs text-center text-muted-foreground mt-2">
                            {t("trialAutoActivate")}
                          </p>

                          {/* Summary */}
                          <div className="mt-4 p-4 rounded-xl bg-muted border border-border space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              {t("accountSummary")}
                            </p>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{t("company")}</span>
                              <span className="font-medium text-foreground">
                                {props.values.company_name || "—"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{t("admin")}</span>
                              <span
                                dir="ltr"
                                lang="en"
                                style={{ unicodeBidi: "plaintext" }}
                                className="font-medium text-left text-foreground"
                              >
                                {props.values.admin_email || "—"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{t("plan")}</span>
                              <span className="font-medium text-primary">{t("trialPlan")}</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Navigation */}
                    <div
                      className={`flex gap-3 mt-6 ${step > 0 ? "justify-between" : "justify-end"}`}
                    >
                      {step > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleBack}
                          className="flex items-center gap-2 px-4"
                        >
                          <ChevronRight className="w-4 h-4" />
                          {t("previous")}
                        </Button>
                      )}
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={props.isSubmitting}
                        className="flex items-center gap-2 px-6 flex-1 justify-center"
                      >
                        {props.isSubmitting && (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        )}
                        {step < 2 ? (
                          <>
                            {t("next")} <ChevronLeft className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            {t("createAccount")} <Check className="w-4 h-4" />
                          </>
                        )}
                      </Button>
                    </div>

                    <p className="text-center text-sm text-muted-foreground mt-4">
                      {t("hasAccount")}{" "}
                      <a href="/login" className="text-primary hover:underline font-medium">
                        {t("login")}
                      </a>
                    </p>
                  </Form>
                )}
              </Formik>
            </>
          )}
        </div>
      </motion.div>

      <Dialog
        open={!!registrationResult}
        onOpenChange={() => registrationResult && handleGoToDashboard()}
      >
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader className="text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Check className="w-7 h-7 text-primary" />
            </div>
            <DialogTitle className="text-xl">{t("registerSuccess")}</DialogTitle>
            <DialogDescription>
              {registrationResult && (
                <>
                  {t("welcomeTo")}{" "}
                  <span className="font-semibold text-foreground">
                    {registrationResult.companyName}
                  </span>
                  .
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {registrationResult && (
            <div className="space-y-3 my-4">
              <div className="rounded-xl bg-muted p-3 text-sm">
                <p className="text-muted-foreground mb-1">{t("adminEmail")}</p>
                <p className="font-medium text-foreground ltr" dir="ltr">
                  {registrationResult.adminEmail}
                </p>
              </div>
              <div className="rounded-xl bg-muted p-3 text-sm">
                <p className="text-muted-foreground mb-1">{t("temporaryPassword")}</p>
                <p className="font-medium text-foreground ltr" dir="ltr">
                  {registrationResult.adminPassword}
                </p>
              </div>
              <p className="text-xs text-[hsl(48_96%_53%)] bg-[hsl(48_96%_53%/0.1)] rounded-lg p-2">
                {t("saveCredentials")}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button onClick={handleGoToDashboard} className="w-full">
              {t("goToDashboard")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
