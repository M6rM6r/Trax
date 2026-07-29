"use client";

import { useState, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useRouter, Link } from "@/i18n/navigation";
import { Lock, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import CustomInput from "@/components/shared/form/CustomInput";
import { toastSuccess, toastError } from "@/hooks/use-toast";
import { Form, Formik } from "formik";
import * as Yup from "yup";
import { auth } from "@/lib/config/firebase";
import { confirmPasswordReset } from "firebase/auth";
import { useTranslations } from "next-intl";

function ResetPasswordForm() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const params = useSearchParams();
  const oobCode = params.get("oobCode") ?? "";
  const [done, setDone] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const schema = Yup.object({
    password: Yup.string().min(8, t("passwordMin")).required(t("passwordRequired")),
    confirm_password: Yup.string()
      .oneOf([Yup.ref("password")], t("passwordsMismatch"))
      .required(t("confirmPasswordRequired")),
  });

  const handleSubmit = async (
    values: { password: string; confirm_password: string },
    { setSubmitting }: { setSubmitting: (b: boolean) => void }
  ) => {
    try {
      if (!auth) throw new Error("Firebase Auth is not configured");
      await confirmPasswordReset(auth, oobCode, values.password);
      setDone(true);
      toastSuccess(t("passwordChanged"));
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      toastError(t("linkExpired"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!oobCode) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive font-medium">{t("invalidOrExpiredLink")}</p>
        <Link
          href="/forgot-password"
          className="mt-3 inline-block text-sm text-primary hover:underline"
        >
          {t("requestNewLink")}
        </Link>
      </div>
    );
  }

  return (
    <div>
      {!done ? (
        <div>
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4 mx-auto">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-center text-foreground mb-1">
            {t("resetPasswordTitle")}
          </h1>
          <p className="text-sm text-center text-muted-foreground mb-6">
            {t("resetPasswordDescription")}
          </p>

          <Formik
            initialValues={{ password: "", confirm_password: "" }}
            validationSchema={schema}
            onSubmit={handleSubmit}
          >
            {(props) => (
              <Form className="space-y-4">
                <div className="relative">
                  <CustomInput
                    name="password"
                    type={showPwd ? "text" : "password"}
                    label={t("newPassword")}
                    placeholder={t("passwordMin")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute left-3 top-9 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="relative">
                  <CustomInput
                    name="confirm_password"
                    type={showConfirm ? "text" : "password"}
                    label={t("confirmPassword")}
                    placeholder={t("confirmPasswordPlaceholder")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute left-3 top-9 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={props.isSubmitting}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {props.isSubmitting && (
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  )}
                  {t("reset")}
                </Button>
              </Form>
            )}
          </Formik>
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4 mx-auto">
            <CheckCircle2 className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">{t("resetSuccess")}</h2>
          <p className="text-sm text-muted-foreground">{t("redirectingToLogin")}</p>
        </div>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  const t = useTranslations("Auth");
  return (
    <section className="w-screen h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-[400px] px-6 flex flex-col items-center gap-8">
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

        <div className="w-full">
          <div className="bg-card border border-border rounded-lg p-6">
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
                  <span className="w-5 h-5 border-2 border-muted-foreground border-t-primary rounded-full animate-spin" />
                  {t("loading")}
                </div>
              }
            >
              <ResetPasswordForm />
            </Suspense>

            <div className="mt-4 pt-4 border-t border-border">
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {t("backToLogin")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
