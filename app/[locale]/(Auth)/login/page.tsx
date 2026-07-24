"use client";
import CustomInput from "@/components/shared/form/CustomInput";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import loginBG from "@/public/images/loginBg.png";
import { Form, Formik, FormikHelpers } from "formik";
import { CheckCircle2 } from "lucide-react";
import * as Yup from "yup";
import { toastSuccess, toastError } from "@/hooks/use-toast";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useMemo, useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { hapticSuccess, hapticError } from "@/lib/utils/haptics";
import { motion, AnimatePresence } from "framer-motion";
import {
  getIdTokenResult,
  signInWithEmailAndPassword,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";
import { auth } from "@/lib/config/firebase";
import { getFirebaseUserProfile } from "@/lib/services/firebaseData";
import { useFirebaseAuth } from "@/lib/config/env";
import { normalizeUserRole, resolveUserRole } from "@/lib/utils/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface LoginValues {
  identifier: string;
  password: string;
  rememberMe: boolean;
}

const loginSchema = Yup.object({
  identifier: Yup.string().email("البريد الإلكتروني غير صحيح").required("البريد الإلكتروني مطلوب"),
  password: Yup.string()
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
    .required("كلمة المرور مطلوبة"),
});

const Page = () => {
  const searchParams = useSearchParams();
  const initialIdentifier = useMemo(
    () => searchParams.get("identifier")?.trim() || "",
    [searchParams]
  );
  const { setUser, setRememberMe } = useAuthStore();
  const [showSuccess, setShowSuccess] = useState(false);

  const applyLoginResponse = async (
    values: LoginValues,
    idToken: string,
    resp: {
      success: boolean;
      data?: {
        user: {
          id: number;
          name: string;
          email: string;
          role: string;
          company_id: number;
          employee_id?: string | number | null;
          assigned_geofence_id?: string | number | null;
        };
        company?: { id: number; name: string };
      };
    }
  ) => {
    if (!resp.success || !resp.data) {
      hapticError();
      toastError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      return;
    }

    const { user, company } = resp.data;
    let role = normalizeUserRole(user.role);
    const hasCompany = user.company_id !== null && user.company_id !== undefined;
    const hasEmployeeId = user.employee_id !== null && user.employee_id !== undefined;
    if (hasCompany && !hasEmployeeId) {
      role = "boss";
    }

    setUser(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role,
        employee_id: user.employee_id ?? null,
        assigned_geofence_id: user.assigned_geofence_id ?? null,
        permissions: [],
        created_at: new Date().toISOString(),
        profile_image: "",
      },
      idToken,
      role,
      user.company_id,
      company?.name
    );

    hapticSuccess();
    toastSuccess("تم تسجيل الدخول بنجاح");
    setShowSuccess(true);

    setTimeout(() => {
      const currentLocale =
        typeof window !== "undefined" && window.location.pathname.split("/")[1] === "en"
          ? "en"
          : "ar";
      const targetPath = role === "employee" ? `/${currentLocale}/check-in` : `/${currentLocale}`;
      if (typeof window !== "undefined") {
        window.location.assign(targetPath);
      }
    }, 800);
  };

  const handleSubmit = async (
    values: LoginValues,
    { setSubmitting }: FormikHelpers<LoginValues>
  ) => {
    if (!auth) {
      hapticError();
      toastError("Firebase غير مكون. تواصل مع الإدارة.");
      setSubmitting(false);
      return;
    }

    try {
      await setPersistence(auth, browserLocalPersistence);
      const credential = await signInWithEmailAndPassword(auth, values.identifier, values.password);
      const idToken = await credential.user.getIdToken();
      setRememberMe(values.rememberMe);

      // Firebase-first: Firestore profile is the primary source of truth.
      if (useFirebaseAuth) {
        let profile: Record<string, unknown> | null = null;
        try {
          profile = await getFirebaseUserProfile(
            credential.user.uid,
            credential.user.email ?? values.identifier
          );
        } catch {
          // Firestore profile lookup failed; continue with defaults below.
        }
        const tokenResult = await getIdTokenResult(credential.user);
        const profileData = (profile ?? {}) as Record<string, unknown> & {
          company?: { id?: unknown; name?: unknown };
        };
        const companyProfile = profileData.company;
        const numericId = Array.from(credential.user.uid).reduce(
          (total, character) => (total * 31 + character.charCodeAt(0)) % 2147483647,
          0
        );
        const role = resolveUserRole(
          profileData,
          tokenResult.claims,
          credential.user.email ?? values.identifier
        );
        const isEmployee = role === "employee";

        let companyId = Number(profileData.company_id ?? companyProfile?.id ?? 1);
        let companyName = String(profileData.company_name ?? companyProfile?.name ?? "Trax");

        // Optional: enrich with Laravel API if Firestore profile is incomplete.
        if (!profileData.company_id && !companyProfile?.id) {
          try {
            const rawResp = await fetch(`${API_URL}/auth/firebase`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Accept: "application/json" },
              body: JSON.stringify({ id_token: idToken }),
            });
            if (rawResp.ok) {
              const resp = await rawResp.json();
              if (resp?.success && resp?.data) {
                companyId = Number(resp.data.user?.company_id ?? companyId);
                companyName = String(resp.data.company?.name ?? companyName);
              }
            }
          } catch {
            // Laravel API unreachable — continue with Firestore data.
          }
        }

        const hasEmployeeId =
          profileData.employee_id !== null && profileData.employee_id !== undefined;

        await applyLoginResponse(values, idToken, {
          success: true,
          data: {
            user: {
              id: Number(profileData.id ?? numericId),
              name: String(
                profileData.name ?? credential.user.displayName ?? values.identifier.split("@")[0]
              ),
              email: String(profileData.email ?? credential.user.email ?? values.identifier),
              role,
              company_id: companyId,
              employee_id: hasEmployeeId
                ? (profileData.employee_id as string | number)
                : isEmployee
                  ? numericId
                  : null,
              assigned_geofence_id:
                profileData.assigned_geofence_id === null ||
                profileData.assigned_geofence_id === undefined
                  ? null
                  : (profileData.assigned_geofence_id as string | number),
            },
            company: {
              id: companyId,
              name: companyName,
            },
          },
        });
        return;
      }

      // Non-Firebase mode: use Laravel API directly.
      const rawResp = await fetch(`${API_URL}/auth/firebase`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ id_token: idToken }),
      });

      if (!rawResp.ok) {
        const errBody = await rawResp.json().catch(() => ({}));
        hapticError();
        toastError(errBody?.message || "فشل تسجيل الدخول. تأكد من البيانات.");
        return;
      }

      const resp = await rawResp.json();
      await applyLoginResponse(values, idToken, resp);
    } catch (err) {
      hapticError();
      const firebaseErr = err as { code?: string; message?: string };
      let msg = "البريد الإلكتروني أو كلمة المرور غير صحيحة";
      if (firebaseErr?.code === "auth/unauthorized-domain") {
        msg = "هذا النطاق غير مصرح به. تواصل مع الإدارة.";
      } else if (firebaseErr?.code === "auth/user-not-found") {
        msg = "المستخدم غير موجود. تأكد من البريد الإلكتروني.";
      } else if (firebaseErr?.code === "auth/wrong-password") {
        msg = "كلمة المرور غير صحيحة.";
      } else if (firebaseErr?.code === "auth/invalid-credential") {
        msg = "بيانات الدخول غير صحيحة.";
      } else if (firebaseErr?.code === "auth/too-many-requests") {
        msg = "محاولات كثيرة. حاول لاحقاً.";
      } else if (firebaseErr?.message) {
        msg = firebaseErr.message;
      }
      toastError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="w-screen h-screen flex items-center justify-center relative bg-primaryColor dark:bg-slate-950 overflow-hidden">
      <div
        className="absolute inset-0 z-0 bg-center bg-cover opacity-40 dark:opacity-20"
        style={{ backgroundImage: `url(${loginBG.src})` }}
      />

      <div className="absolute left-1/2 -translate-x-1/2 top-10 z-20">
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
      </div>

      <Formik
        initialValues={{ identifier: initialIdentifier, password: "", rememberMe: false }}
        enableReinitialize
        validationSchema={loginSchema}
        onSubmit={handleSubmit}
      >
        {(props) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 w-full max-w-[420px] px-6"
          >
            <Form className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl">
              <div className="text-center mb-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">تسجيل الدخول</h1>
              </div>

              <CustomInput
                type="email"
                name="identifier"
                placeholder="email@trax.com"
                label="البريد الإلكتروني"
              />

              <CustomInput
                type="password"
                name="password"
                placeholder="*********"
                label="كلمة المرور"
              />

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer text-gray-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-primaryColor focus:ring-primaryColor"
                    checked={props.values.rememberMe}
                    onChange={() => props.setFieldValue("rememberMe", !props.values.rememberMe)}
                  />
                  تذكرني
                </label>
                <Link
                  href="/forgot-password"
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                >
                  نسيت كلمة المرور؟
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={props.isSubmitting}
                className="h-12 text-lg font-bold flex items-center justify-center gap-2 transition-transform"
              >
                {props.isSubmitting && (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {props.isSubmitting ? "جاري التحميل..." : "دخول"}
              </Button>
            </Form>
          </motion.div>
        )}
      </Formik>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <CheckCircle2 className="w-20 h-20 text-green-500" />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-4 text-xl font-bold text-gray-900 dark:text-white"
            >
              تم تسجيل الدخول
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Page;
