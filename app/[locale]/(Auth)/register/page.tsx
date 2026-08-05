"use client";

import { useMemo, useState } from "react";
import { Form, Formik, FormikHelpers } from "formik";
import * as Yup from "yup";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "@/i18n/navigation";
import {
  browserSessionPersistence,
  setPersistence,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/config/firebase";
import { Phone, Check } from "lucide-react";
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
  contact_phone: string;
  admin_email: string;
  admin_password: string;
}

function useRegisterSchema() {
  const t = useTranslations("Auth");
  return Yup.object({
    company_name: Yup.string().required(t("companyNameRequired")).min(2, t("companyNameTooShort")),
    contact_phone: Yup.string()
      .required(t("contactPhoneRequired"))
      .min(8, t("contactPhoneInvalid"))
      .matches(/^[+0-9\s()-]{8,20}$/, t("contactPhoneInvalid")),
    admin_email: Yup.string().email(t("emailInvalid")).required(t("emailRequired")),
    admin_password: Yup.string().min(8, t("passwordMin")).required(t("passwordRequired")),
  });
}

export default function RegisterPage() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const schema = useRegisterSchema();
  const onboardingCopy = getCompanyOnboardingCopy();
  const allowSelfRegistration = shouldAllowCompanySelfRegistration();
  const [registrationResult, setRegistrationResult] = useState<{
    companyName: string;
    adminEmail: string;
    contactPhone: string;
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

    try {
      if (!auth) throw new Error(t("firebaseNotConfiguredRegister"));

      await setPersistence(auth, browserSessionPersistence);

      const { companyId: newCompanyId } = await firebaseData.companies.register({
        company_name: values.company_name,
        contact_phone: values.contact_phone,
        admin_name: values.company_name,
        admin_email: values.admin_email,
        admin_password: values.admin_password,
      });

      const credential = await signInWithEmailAndPassword(
        auth,
        values.admin_email.trim().toLowerCase(),
        values.admin_password
      );
      const idToken = await credential.user.getIdToken();

      const role: UserRole = "company";
      setUser(
        {
          id: 0,
          name: values.company_name.trim(),
          email: values.admin_email.trim().toLowerCase(),
          role: "company",
          permissions: [],
          created_at: new Date().toISOString(),
          profile_image: "",
        },
        idToken,
        role,
        newCompanyId,
        values.company_name.trim()
      );

      hapticSuccess();
      toastSuccess(t("registerSuccess"));
      setRegistrationResult({
        companyName: values.company_name.trim(),
        adminEmail: values.admin_email.trim().toLowerCase(),
        contactPhone: values.contact_phone.trim(),
      });
    } catch (err: unknown) {
      hapticError();
      const code =
        typeof err === "object" && err !== null && "code" in err
          ? String((err as { code: string }).code)
          : "";
      let message = err instanceof Error ? err.message : t("accountCreationFailed");
      if (code === "auth/email-already-in-use") message = t("emailInUse");
      if (code === "auth/weak-password") message = t("weakPassword");
      toastError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="relative flex min-h-screen w-screen items-center justify-center bg-background py-8">
      <Image
        src={loginBG}
        alt=""
        fill
        className="z-0 object-cover object-center dark:opacity-30"
        priority
        quality={85}
      />

      <div className="absolute left-1/2 top-6 z-20 -translate-x-1/2">
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
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 m-4 mt-16 w-full max-w-md sm:m-5 sm:max-w-lg"
      >
        <div className="rounded-2xl border border-border/50 bg-background/85 p-5 shadow-[0_32px_64px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:p-6">
          <div className="mb-6">
            <h1 className="bg-gradient-to-r from-primary to-accent bg-clip-text text-2xl font-bold text-transparent">
              {allowSelfRegistration ? t("registerTitle") : onboardingCopy.title}
            </h1>
            {!allowSelfRegistration ? (
              <p className="mt-1 text-sm text-muted-foreground">{onboardingCopy.description}</p>
            ) : null}
          </div>

          {!allowSelfRegistration ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{onboardingCopy.cta}</p>
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
            <Formik
              initialValues={{
                company_name: "",
                contact_phone: "",
                admin_email: "",
                admin_password: "",
              }}
              validationSchema={schema}
              onSubmit={handleSubmit}
              validateOnChange={false}
              validateOnBlur
            >
              {(props) => (
                <Form className="space-y-4">
                  <CustomInput
                    name="company_name"
                    type="text"
                    label={t("companyName")}
                    placeholder={t("companyNamePlaceholder")}
                    autoComplete="organization"
                  />

                  <CustomInput
                    name="contact_phone"
                    type="tel"
                    label={t("contactPhone")}
                    placeholder={t("contactPhonePlaceholder")}
                    autoComplete="tel"
                    className="text-left [direction:ltr] [unicode-bidi:plaintext]"
                  />

                  <CustomInput
                    name="admin_email"
                    type="email"
                    label={t("email")}
                    placeholder="admin@company.com"
                    autoComplete="email"
                    className="text-left [direction:ltr] [unicode-bidi:plaintext]"
                  />

                  <div>
                    <CustomInput
                      name="admin_password"
                      type="password"
                      label={t("password")}
                      placeholder={t("passwordMin")}
                      autoComplete="new-password"
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
                                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                                    ps.score >= seg ? ps.color : "bg-muted"
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground">{ps.label}</p>
                          </div>
                        );
                      })()}
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={props.isSubmitting}
                    className="h-11 w-full font-semibold"
                  >
                    {props.isSubmitting ? t("loading") : t("createAccount")}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    {t("hasAccount")}{" "}
                    <button
                      type="button"
                      className="font-medium text-primary underline-offset-2 hover:underline"
                      onClick={() => router.push("/login")}
                    >
                      {t("login")}
                    </button>
                  </p>
                </Form>
              )}
            </Formik>
          )}
        </div>
      </motion.div>

      <Dialog open={!!registrationResult} onOpenChange={(o) => !o && router.push("/")}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15">
                <Check className="h-5 w-5 text-primary" />
              </span>
              {t("registerSuccess")}
            </DialogTitle>
            <DialogDescription>
              {t("welcomeTo")} {registrationResult?.companyName}
            </DialogDescription>
          </DialogHeader>
          {registrationResult && (
            <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-4 text-sm">
              <p>
                <span className="text-muted-foreground">{t("email")}: </span>
                <span dir="ltr" className="font-medium">
                  {registrationResult.adminEmail}
                </span>
              </p>
              <p className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                <span dir="ltr" className="font-medium">
                  {registrationResult.contactPhone}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">{t("selfSignupNextStep")}</p>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="primary"
              className="w-full"
              onClick={() => router.push("/")}
            >
              {t("goToDashboard")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
