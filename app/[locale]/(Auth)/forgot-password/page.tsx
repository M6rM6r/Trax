"use client";

import { useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Mail, ArrowRight, CheckCircle2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import CustomInput from "@/components/shared/form/CustomInput";
import { toastSuccess, toastError } from "@/hooks/use-toast";
import { Form, Formik } from "formik";
import * as Yup from "yup";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/config/firebase";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [sentTo, setSentTo] = useState("");

  const schema = Yup.object({
    email: Yup.string().email("البريد غير صحيح").required("البريد الإلكتروني مطلوب"),
  });

  const handleSubmit = async (
    values: { email: string },
    { setSubmitting }: { setSubmitting: (b: boolean) => void }
  ) => {
    if (!auth) {
      toastError("Firebase غير مكون. تواصل مع الإدارة.");
      setSubmitting(false);
      return;
    }
    try {
      await sendPasswordResetEmail(auth, values.email);
      setSentTo(values.email);
      setSent(true);
      toastSuccess("تم إرسال رابط إعادة التعيين");
    } catch {
      toastError("البريد الإلكتروني غير مسجل في النظام");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="w-screen h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-[400px] px-6 flex flex-col items-center gap-8">
        <div className="relative h-10 w-40">
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
            {!sent ? (
              <div>
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4 mx-auto">
                  <KeyRound className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-xl font-bold text-center text-foreground mb-1">
                  نسيت كلمة المرور؟
                </h1>
                <p className="text-sm text-center text-muted-foreground mb-6">
                  أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين
                </p>

                <Formik
                  initialValues={{ email: "" }}
                  validationSchema={schema}
                  onSubmit={handleSubmit}
                >
                  {(props) => (
                    <Form className="space-y-4">
                      <CustomInput
                        name="email"
                        type="email"
                        label="البريد الإلكتروني"
                        placeholder="example@company.com"
                        className="text-left [direction:ltr] [unicode-bidi:plaintext]"
                      />
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={props.isSubmitting}
                        className="w-full flex items-center justify-center gap-2"
                      >
                        {props.isSubmitting && (
                          <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        )}
                        <Mail className="w-4 h-4" />
                        إرسال رابط الاستعادة
                      </Button>
                    </Form>
                  )}
                </Formik>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4 mx-auto">
                  <CheckCircle2 className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">تم الإرسال!</h2>
                <p className="text-sm text-muted-foreground mb-1">
                  تم إرسال رابط إعادة التعيين إلى
                </p>
                <p
                  dir="ltr"
                  lang="en"
                  style={{ unicodeBidi: "plaintext" }}
                  className="text-sm text-left font-semibold text-primary mb-6 break-all"
                >
                  {sentTo}
                </p>
                <p className="text-xs text-muted-foreground mb-6">
                  لم يصلك البريد؟ تحقق من مجلد البريد غير المرغوب فيه
                </p>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-border">
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                العودة إلى تسجيل الدخول
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
