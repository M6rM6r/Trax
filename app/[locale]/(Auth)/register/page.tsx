"use client";

import { useState, useMemo } from "react";
import { Form, Formik, FormikHelpers } from "formik";
import * as Yup from "yup";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { setCookie } from "cookies-next";
import {
  MapPin,
  Building2,
  User,
  Mail,
  Lock,
  Phone,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import CustomInput from "@/components/shared/form/CustomInput";
import { toastSuccess, toastError } from "@/hooks/use-toast";
import { hapticSuccess, hapticError } from "@/lib/utils/haptics";
import { useAuthStore, UserRole } from "@/stores/useAuthStore";
import { httpClient, ApiError } from "@/lib/services/httpClient";
import loginBG from "@/public/images/loginBg.png";

interface RegisterValues {
  company_name: string;
  industry: string;
  admin_name: string;
  admin_email: string;
  admin_password: string;
  confirm_password: string;
}

const INDUSTRIES = [
  "التجزئة",
  "الضيافة والفنادق",
  "المقاولات والبناء",
  "التصنيع",
  "الرعاية الصحية",
  "التعليم",
  "الخدمات اللوجستية",
  "تقنية المعلومات",
  "الخدمات المالية",
  "أخرى",
];

const PLANS = [
  {
    key: "trial",
    name: "تجريبي",
    price: "مجاني",
    duration: "14 يوم",
    employees: 10,
    color: "border-gray-300 dark:border-slate-600",
    badge: "",
    features: ["10 موظفين", "جميع المميزات", "دعم بالبريد الإلكتروني"],
  },
  {
    key: "starter",
    name: "مبتدئ",
    price: "199 ر.س",
    duration: "شهرياً",
    employees: 25,
    color: "border-blue-400",
    badge: "الأكثر شيوعاً",
    features: ["25 موظفاً", "تقارير متقدمة", "دعم أولوية"],
  },
  {
    key: "pro",
    name: "احترافي",
    price: "499 ر.س",
    duration: "شهرياً",
    employees: 100,
    color: "border-purple-400",
    badge: "",
    features: ["100 موظف", "API كامل", "دعم على مدار الساعة"],
  },
];

const stepSchema = [
  Yup.object({
    company_name: Yup.string().required("اسم الشركة مطلوب").min(2, "الاسم قصير جداً"),
    industry: Yup.string().required("يرجى اختيار القطاع"),
  }),
  Yup.object({
    admin_name: Yup.string().required("الاسم مطلوب"),
    admin_email: Yup.string().email("البريد غير صحيح").required("البريد الإلكتروني مطلوب"),
    admin_password: Yup.string().min(8, "8 أحرف على الأقل").required("كلمة المرور مطلوبة"),
    confirm_password: Yup.string()
      .oneOf([Yup.ref("admin_password")], "كلمات المرور غير متطابقة")
      .required("تأكيد كلمة المرور مطلوب"),
  }),
];

const STEP_LABELS = ["معلومات الشركة", "حساب المدير", "اختيار الخطة"];

export default function RegisterPage() {
  const router = useRouter();
  const locale = useLocale();
  const { setUser } = useAuthStore();
  const [step, setStep] = useState(0);
  const [selectedPlan] = useState("trial");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const getPasswordStrength = useMemo(
    () => (v: string) => {
      const score = [
        v.length >= 8,
        /[A-Z]/.test(v),
        /[0-9]/.test(v),
        /[^A-Za-z0-9]/.test(v),
      ].filter(Boolean).length;
      const colors = ["", "bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-green-500"] as const;
      const labels = ["", "ضعيف", "متوسط", "قوي", "ممتاز"] as const;
      return { score, color: colors[score] || "", label: labels[score] || "" };
    },
    []
  );

  const handleSubmit = async (
    values: RegisterValues,
    { setSubmitting }: FormikHelpers<RegisterValues>
  ) => {
    if (step < 2) {
      setStep((s) => s + 1);
      setSubmitting(false);
      return;
    }
    try {
      const resp = await httpClient.post<{
        success: boolean;
        message: string;
        data: {
          token: string;
          user: { id: number; name: string; email: string; role: string; company_id: number };
          company: {
            id: number;
            name: string;
            plan: string;
            trial_ends_at: string;
            max_employees: number;
          };
        };
      }>("companies/register", {
        company_name: values.company_name,
        industry: values.industry,
        admin_name: values.admin_name,
        admin_email: values.admin_email,
        admin_password: values.admin_password,
      });

      if (!resp.success) {
        hapticError();
        toastError("فشل في إنشاء الحساب. حاول مرة أخرى.");
        return;
      }

      const { token, user, company } = resp.data;
      const role: UserRole = "boss";

      setCookie("auth_token", token, { maxAge: 30 * 24 * 60 * 60 });
      setUser(
        {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: [],
          created_at: new Date().toISOString(),
          profile_image: "",
        },
        token,
        role,
        user.company_id,
        company.name
      );

      hapticSuccess();
      toastSuccess(resp.message || "تم إنشاء حسابك بنجاح! مرحباً بك في Trax");
      router.push(`/${locale}`);
    } catch (err: unknown) {
      hapticError();
      if (err instanceof ApiError) {
        if (err.statusCode === 422) {
          const errors = (err.context as { errors?: Record<string, string[]> })?.errors;
          const firstError = errors ? Object.values(errors).flat()[0] : null;
          toastError(firstError || "البريد الإلكتروني مستخدم بالفعل. جرّب بريداً آخر.");
        } else if (err.statusCode === 500) {
          toastError(
            "الخادم أو قاعدة البيانات غير متاحة حالياً. تأكد من تشغيل API و MySQL ثم أعد المحاولة."
          );
        } else if (err.statusCode === 0) {
          toastError("تعذّر الاتصال بالخادم. تأكّد من اتصالك بالإنترنت.");
        } else {
          toastError(err.message || "فشل في إنشاء الحساب. حاول مرة أخرى.");
        }
      } else {
        toastError("فشل في إنشاء الحساب. حاول مرة أخرى.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  return (
    <section className="w-screen min-h-screen flex items-center justify-center relative bg-primaryColor dark:bg-slate-950 py-8">
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
        className="relative z-10 m-5 w-full max-w-[580px] mt-16"
      >
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 rounded-2xl p-6 shadow-[0_32px_64px_rgba(0,0,0,0.3)]">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-[linear-gradient(270deg,#3C7EE7_0%,#10489B_100%)] dark:bg-[linear-gradient(270deg,#60A5FA_0%,#3B82F6_100%)]">
              إنشاء حساب شركة
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              ابدأ تجربتك المجانية 14 يوماً — لا حاجة لبطاقة ائتمان
            </p>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-2 mb-8">
            {STEP_LABELS.map((label, i) => (
              <div key={i} className="flex items-center gap-2 flex-1 last:flex-none">
                <div className="flex items-center gap-1.5 shrink-0">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      i < step
                        ? "bg-green-500 text-white"
                        : i === step
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                          : "bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400"
                    }`}
                  >
                    {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span
                    className={`text-xs font-medium hidden sm:block ${
                      i === step
                        ? "text-blue-600 dark:text-blue-400"
                        : i < step
                          ? "text-green-600 dark:text-green-400"
                          : "text-gray-400 dark:text-slate-500"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div
                    className={`flex-1 h-px transition-all ${i < step ? "bg-green-400" : "bg-gray-200 dark:bg-slate-700"}`}
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
            validationSchema={step < 2 ? stepSchema[step] : undefined}
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
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
                        <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          أدخل معلومات شركتك لبدء التسجيل
                        </p>
                      </div>
                      <CustomInput
                        name="company_name"
                        type="text"
                        label="اسم الشركة"
                        placeholder="مثال: شركة الأفق للتجزئة"
                      />
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
                          القطاع
                        </label>
                        <select
                          name="industry"
                          value={props.values.industry}
                          onChange={props.handleChange}
                          onBlur={props.handleBlur}
                          className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        >
                          <option value="">اختر القطاع...</option>
                          {INDUSTRIES.map((ind) => (
                            <option key={ind} value={ind}>
                              {ind}
                            </option>
                          ))}
                        </select>
                        {props.touched.industry && props.errors.industry && (
                          <p className="text-xs text-red-500">{props.errors.industry}</p>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 1 — Admin Account */}
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30">
                        <User className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
                        <p className="text-sm text-purple-700 dark:text-purple-300">
                          هذا الحساب سيكون مدير الشركة
                        </p>
                      </div>
                      <CustomInput
                        name="admin_name"
                        type="text"
                        label="الاسم الكامل"
                        placeholder="محمد عبدالله"
                      />
                      <CustomInput
                        name="admin_email"
                        type="email"
                        label="البريد الإلكتروني"
                        placeholder="admin@company.com"
                      />
                      <div className="relative">
                        <CustomInput
                          name="admin_password"
                          type={showPassword ? "text" : "password"}
                          label="كلمة المرور"
                          placeholder="8 أحرف على الأقل"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        {props.values.admin_password.length > 0 &&
                          (() => {
                            const ps = getPasswordStrength(props.values.admin_password);
                            return (
                              <div className="mt-2 space-y-1">
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4].map((seg) => (
                                    <div
                                      key={seg}
                                      className={`h-1.5 flex-1 rounded-full transition-colors ${ps.score >= seg ? ps.color : "bg-gray-200 dark:bg-slate-700"}`}
                                    />
                                  ))}
                                </div>
                                {ps.label && (
                                  <p
                                    className={`text-xs font-medium ${ps.score <= 1 ? "text-red-500" : ps.score === 2 ? "text-orange-400" : ps.score === 3 ? "text-yellow-500" : "text-green-500"}`}
                                  >
                                    {ps.label}
                                  </p>
                                )}
                              </div>
                            );
                          })()}
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
                          {showConfirm ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2 — Plan Selection */}
                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-2 mb-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30">
                        <Briefcase className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
                        <p className="text-sm text-green-700 dark:text-green-300">
                          ابدأ مجاناً — يمكنك الترقية في أي وقت
                        </p>
                      </div>
                      <div className="space-y-3">
                        {PLANS.map((plan) => (
                          <div
                            key={plan.key}
                            className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all ${
                              selectedPlan === plan.key
                                ? "border-blue-500 bg-blue-50/60 dark:bg-blue-900/20 shadow-md"
                                : `${plan.color} bg-white dark:bg-slate-800/60 hover:shadow-sm`
                            }`}
                          >
                            {plan.badge && (
                              <span className="absolute -top-2.5 left-4 text-xs font-bold bg-blue-500 text-white px-2.5 py-0.5 rounded-full">
                                {plan.badge}
                              </span>
                            )}
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-gray-900 dark:text-slate-100">
                                    {plan.name}
                                  </span>
                                  {selectedPlan === plan.key && (
                                    <Check className="w-4 h-4 text-blue-500" />
                                  )}
                                </div>
                                <div className="flex gap-3 mt-1.5">
                                  {plan.features.map((f) => (
                                    <span
                                      key={f}
                                      className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1"
                                    >
                                      <span className="w-1 h-1 rounded-full bg-gray-400 dark:bg-slate-500" />
                                      {f}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="font-bold text-lg text-gray-900 dark:text-slate-100">
                                  {plan.price}
                                </div>
                                <div className="text-xs text-gray-400 dark:text-slate-500">
                                  {plan.duration}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-center text-gray-400 dark:text-slate-500 mt-2">
                        سيتم تفعيل الخطة التجريبية تلقائياً — لا حاجة لبطاقة ائتمان
                      </p>

                      {/* Summary */}
                      <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 space-y-2">
                        <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                          ملخص الحساب
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-slate-400">الشركة</span>
                          <span className="font-medium text-gray-900 dark:text-slate-100">
                            {props.values.company_name || "—"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-slate-400">المدير</span>
                          <span className="font-medium text-gray-900 dark:text-slate-100">
                            {props.values.admin_email || "—"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-slate-400">الخطة</span>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            تجريبي مجاني — 14 يوم
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation */}
                <div className={`flex gap-3 mt-6 ${step > 0 ? "justify-between" : "justify-end"}`}>
                  {step > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      className="flex items-center gap-2 px-4"
                    >
                      <ChevronRight className="w-4 h-4" />
                      السابق
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
                        التالي <ChevronLeft className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        إنشاء الحساب <Check className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-center text-sm text-gray-500 dark:text-slate-400 mt-4">
                  لديك حساب بالفعل؟{" "}
                  <a
                    href={`/${locale}/login`}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    تسجيل الدخول
                  </a>
                </p>
              </Form>
            )}
          </Formik>
        </div>
      </motion.div>
    </section>
  );
}
