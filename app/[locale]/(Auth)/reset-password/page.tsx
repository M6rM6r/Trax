"use client";

import { useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useLocale } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { MapPin, Lock, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import CustomInput from "@/components/shared/form/CustomInput";
import { toastSuccess, toastError } from "@/hooks/use-toast";
import { Form, Formik } from "formik";
import * as Yup from "yup";
import { httpClient } from "@/lib/services/httpClient";
import loginBG from "@/public/images/loginBg.png";

function ResetPasswordForm() {
  const locale = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";
  const [done, setDone] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const schema = Yup.object({
    password: Yup.string().min(8, "8 أحرف على الأقل").required("كلمة المرور مطلوبة"),
    confirm_password: Yup.string()
      .oneOf([Yup.ref("password")], "كلمات المرور غير متطابقة")
      .required("تأكيد كلمة المرور مطلوب"),
  });

  const handleSubmit = async (
    values: { password: string; confirm_password: string },
    { setSubmitting }: { setSubmitting: (b: boolean) => void }
  ) => {
    try {
      await httpClient.post("auth/reset-password", {
        token,
        email,
        password: values.password,
        password_confirmation: values.confirm_password,
      });
      setDone(true);
      toastSuccess("تم تغيير كلمة المرور بنجاح");
      setTimeout(() => router.push(`/${locale}/login`), 2500);
    } catch {
      toastError("الرابط منتهي الصلاحية أو غير صحيح");
    } finally {
      setSubmitting(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 font-medium">رابط غير صحيح أو منتهي الصلاحية</p>
        <a
          href={`/${locale}/forgot-password`}
          className="mt-3 inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          طلب رابط جديد
        </a>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {!done ? (
        <motion.div
          key="form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 mb-5 mx-auto">
            <Lock className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-xl font-bold text-center text-gray-900 dark:text-slate-100 mb-1">
            إعادة تعيين كلمة المرور
          </h1>
          <p className="text-sm text-center text-gray-500 dark:text-slate-400 mb-6">
            أدخل كلمة المرور الجديدة لحسابك
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
                    label="كلمة المرور الجديدة"
                    placeholder="8 أحرف على الأقل"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute left-3 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="relative">
                  <CustomInput
                    name="confirm_password"
                    type={showConfirm ? "text" : "password"}
                    label="تأكيد كلمة المرور"
                    placeholder="أعد كتابة كلمة المرور"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute left-3 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
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
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  تعيين كلمة المرور
                </Button>
              </Form>
            )}
          </Formik>
        </motion.div>
      ) : (
        <motion.div
          key="done"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-6"
        >
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-5 mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">تم بنجاح!</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            جاري تحويلك إلى صفحة تسجيل الدخول...
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function ResetPasswordPage() {
  const locale = useLocale();

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
          <Suspense
            fallback={<div className="text-center py-8 text-gray-400">جاري التحميل...</div>}
          >
            <ResetPasswordForm />
          </Suspense>

          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
            <a
              href={`/${locale}/login`}
              className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              العودة إلى تسجيل الدخول
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
