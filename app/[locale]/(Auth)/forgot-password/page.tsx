"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { MapPin, Mail, ArrowRight, CheckCircle2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import CustomInput from "@/components/shared/form/CustomInput";
import { toastSuccess, toastError } from "@/hooks/use-toast";
import { Form, Formik } from "formik";
import * as Yup from "yup";
import { httpClient } from "@/lib/services/httpClient";
import loginBG from "@/public/images/loginBg.png";

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
    try {
      await httpClient.post("auth/forgot-password", { email: values.email });
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
    <section className="w-screen h-screen flex items-center justify-center relative bg-primaryColor dark:bg-slate-950">
      <Image
        src={loginBG}
        alt="bg"
        fill
        className="object-cover object-center z-0 dark:opacity-30"
        priority
        quality={85}
      />

      <div className="absolute left-1/2 -translate-x-1/2 top-6 z-20 flex items-center gap-2">
        <MapPin className="w-8 h-8 text-white" />
        <span className="text-2xl font-bold text-white">Trax</span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 m-5 w-full max-w-[460px]"
      >
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 rounded-2xl p-6 shadow-[0_32px_64px_rgba(0,0,0,0.3)]">
          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 mb-5 mx-auto">
                  <KeyRound className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                </div>
                <h1 className="text-xl font-bold text-center text-gray-900 dark:text-slate-100 mb-1">
                  نسيت كلمة المرور؟
                </h1>
                <p className="text-sm text-center text-gray-500 dark:text-slate-400 mb-6">
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
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        )}
                        <Mail className="w-4 h-4" />
                        إرسال رابط الاستعادة
                      </Button>
                    </Form>
                  )}
                </Formik>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-5 mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">
                  تم الإرسال!
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">
                  تم إرسال رابط إعادة التعيين إلى
                </p>
                <p
                  dir="ltr"
                  lang="en"
                  style={{ unicodeBidi: "plaintext" }}
                  className="text-sm text-left font-semibold text-blue-600 dark:text-blue-400 mb-6 break-all"
                >
                  {sentTo}
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-6">
                  لم يصلك البريد؟ تحقق من مجلد البريد غير المرغوب فيه
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              العودة إلى تسجيل الدخول
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
