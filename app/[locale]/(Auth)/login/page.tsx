"use client";
import CustomInput from "@/components/shared/form/CustomInput";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import loginBG from "@/public/images/loginBg.png";
import { Form, Formik, FormikHelpers } from "formik";
import { MapPin, Eye, EyeOff, Building2 } from "lucide-react";
import { setCookie } from "cookies-next";
import * as Yup from "yup";
import { toastSuccess, toastError } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useState, useMemo } from "react";
import { useAuthStore, UserRole } from "@/stores/useAuthStore";
import { hapticSuccess, hapticError } from "@/lib/utils/haptics";
import { motion } from "framer-motion";
import { httpClient } from "@/lib/services/httpClient";

interface LoginValues {
  identifier: string;
  password: string;
  rememberMe: boolean;
}

const Page = () => {
  const router = useRouter();
  const locale = useLocale();
  const { setUser } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const getPasswordStrength = useMemo(
    () => (v: string) => {
      const score = [
        v.length >= 8,
        /[A-Z]/.test(v),
        /[0-9]/.test(v),
        /[^A-Za-z0-9]/.test(v),
      ].filter(Boolean).length;
      const labels = ["", "ضعيف", "متوسط", "قوي", "ممتاز"] as const;
      const colors = ["", "bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-green-500"] as const;
      return { score, label: labels[score] || "", color: colors[score] || "" };
    },
    []
  );

  const handleSubmit = async (
    values: LoginValues,
    { setSubmitting }: FormikHelpers<LoginValues>
  ) => {
    try {
      const resp = await httpClient.post<{
        success: boolean;
        data: {
          token: string;
          user: {
            id: number;
            name: string;
            email: string;
            role: string;
            company_id: number;
            employee_id?: number | null;
            assigned_geofence_id?: number | null;
          };
          company?: { id: number; name: string };
        };
      }>("auth/login", {
        email: values.identifier,
        username: values.identifier,
        identifier: values.identifier,
        password: values.password,
      });

      if (!resp.success) {
        hapticError();
        toastError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
        return;
      }

      const { token, user, company } = resp.data;
      const role = (user.role === "boss" ? "boss" : "employee") as UserRole;

      setCookie("auth_token", token, {
        maxAge: values.rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
        path: "/",
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      });

      setUser(
        {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          employee_id: user.employee_id ?? null,
          assigned_geofence_id: user.assigned_geofence_id ?? null,
          permissions: [],
          created_at: new Date().toISOString(),
          profile_image: "",
        },
        token,
        role,
        user.company_id,
        company?.name
      );

      hapticSuccess();
      toastSuccess("تم تسجيل الدخول بنجاح");

      if (role === "employee") {
        router.push(`/${locale}/check-in`);
      } else {
        router.push(`/${locale}`);
      }
    } catch {
      hapticError();
      toastError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
    } finally {
      setSubmitting(false);
    }
  };

  const loginSchema = Yup.object({
    identifier: Yup.string().required("البريد الإلكتروني أو اسم المستخدم مطلوب"),
    password: Yup.string()
      .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
      .required("كلمة المرور مطلوبة"),
  });

  return (
    <section className="w-screen h-screen flex items-center justify-center relative bg-primaryColor dark:bg-slate-950">
      <div
        className="absolute inset-0 z-0 bg-center bg-cover dark:opacity-30"
        style={{ backgroundImage: `url(${loginBG.src})` }}
      />
      <div className="absolute left-1/2 -translate-x-1/2 top-6 z-20 flex items-center gap-2">
        <MapPin className="w-8 h-8 text-white" />
        <span className="text-2xl font-bold text-white">Trax</span>
      </div>

      <Formik
        validationSchema={loginSchema}
        initialValues={{ identifier: "", password: "", rememberMe: false }}
        onSubmit={handleSubmit}
      >
        {(props) => (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 m-5 w-full max-w-[557px]"
          >
            <Form className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 rounded-2xl p-5 flex flex-col gap-5 shadow-[0_32px_64px_rgba(0,0,0,0.3)] relative overflow-hidden before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent">
              <h1 className="text-24 font-[700] bg-clip-text text-transparent bg-[linear-gradient(270deg,#3C7EE7_0%,#10489B_100%)] dark:bg-[linear-gradient(270deg,#60A5FA_0%,#3B82F6_100%)]">
                تسجيل الدخول — Trax
              </h1>
              <p className="text-18 text-textSubText dark:text-slate-400 mb-5 -mt-4">
                من فضلك قم بإستكمال بياناتك لتسجيل الدخول!
              </p>

              <CustomInput
                type="text"
                name="identifier"
                placeholder="example@trax.com أو username"
                label="البريد الإلكتروني أو اسم المستخدم"
                autoComplete="username"
                className="text-left [direction:ltr] [unicode-bidi:plaintext]"
              />
              <div className="relative">
                <CustomInput
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="*********"
                  label="كلمة المرور"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                {props.values.password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {(() => {
                        const ps = getPasswordStrength(props.values.password);
                        return [1, 2, 3, 4].map((seg) => (
                          <motion.div
                            key={seg}
                            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                              ps.score >= seg ? ps.color : "bg-gray-200 dark:bg-slate-700"
                            }`}
                          />
                        ));
                      })()}
                    </div>
                    {(() => {
                      const ps = getPasswordStrength(props.values.password);
                      return ps.label ? (
                        <p
                          className={`text-xs font-medium ${
                            ps.score <= 1
                              ? "text-red-500"
                              : ps.score === 2
                                ? "text-orange-400"
                                : ps.score === 3
                                  ? "text-yellow-500"
                                  : "text-green-500"
                          }`}
                        >
                          {ps.label}
                        </p>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="terms"
                  onCheckedChange={(value) => props.setFieldValue("rememberMe", value)}
                  disabled={props.isSubmitting}
                />
                <label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-slate-300"
                >
                  تذكرنى
                </label>
              </div>
              <Button
                type="submit"
                variant={"primary"}
                disabled={props.isSubmitting}
                className="flex items-center justify-center gap-2"
              >
                {props.isSubmitting && (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                تسجيل الدخول
              </Button>
              <p className="text-center text-sm text-gray-500 dark:text-slate-400">
                <a
                  href={`/${locale}/forgot-password`}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  نسيت كلمة المرور؟
                </a>
              </p>
              <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-slate-500">
                <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
                <span>أو</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
              </div>
              <a
                href={`/${locale}/register`}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors font-medium"
              >
                <Building2 className="w-4 h-4" />
                إنشاء حساب شركة جديد
              </a>
            </Form>
          </motion.div>
        )}
      </Formik>
    </section>
  );
};

export default Page;
