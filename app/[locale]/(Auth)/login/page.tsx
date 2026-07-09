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
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { useState, useMemo } from "react";
import { useAuthStore, UserRole } from "@/stores/useAuthStore";
import { hapticSuccess, hapticError } from "@/lib/utils/haptics";
import { motion } from "framer-motion";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/config/firebase";

interface LoginValues {
  identifier: string;
  password: string;
  rememberMe: boolean;
}

const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const { setUser } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const initialIdentifier = useMemo(
    () => searchParams.get("identifier")?.trim() || "",
    [searchParams]
  );

  const applyLoginResponse = async (
    values: LoginValues,
    resp: {
      success: boolean;
      data?: {
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
    }
  ) => {
    if (!resp.success || !resp.data) {
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

    // Fix: Using the localized router.push (no need to manually add /ar/)
    if (role === "employee") {
      router.push("/check-in");
    } else {
      router.push("/");
    }
  };

  const legacyLogin = async (values: LoginValues) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    const rawResp = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        identifier: values.identifier,
        password: values.password,
      }),
    });

    if (!rawResp.ok) {
      hapticError();
      toastError("فشل تسجيل الدخول. تأكد من البيانات.");
      return;
    }

    const resp = await rawResp.json();
    await applyLoginResponse(values, resp);
  };

  const firebaseLogin = async (values: LoginValues) => {
    if (!auth) {
      await legacyLogin(values);
      return;
    }

    const credential = await signInWithEmailAndPassword(auth, values.identifier, values.password);
    const idToken = await credential.user.getIdToken();

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    const rawResp = await fetch(`${apiUrl}/auth/firebase`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ id_token: idToken }),
    });

    if (!rawResp.ok) {
      await legacyLogin(values);
      return;
    }

    const resp = await rawResp.json();
    await applyLoginResponse(values, resp);
  };

  const handleSubmit = async (
    values: LoginValues,
    { setSubmitting }: FormikHelpers<LoginValues>
  ) => {
    try {
      await legacyLogin(values);
    } catch {
      await firebaseLogin(values);
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

      <div className="absolute top-10 flex items-center gap-2 z-20">
        <MapPin className="w-8 h-8 text-white" />
        <span className="text-3xl font-black text-white tracking-tighter">Trax</span>
      </div>

      <Formik
        initialValues={{ identifier: initialIdentifier, password: "", rememberMe: false }}
        enableReinitialize
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
                <p className="text-sm text-gray-500 mt-1">مرحباً بك مجدداً في نظام Trax</p>
              </div>

              <CustomInput
                type="text"
                name="identifier"
                placeholder="البريد الإلكتروني"
                label="اسم المستخدم"
              />

              <div className="relative">
                <CustomInput
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="*********"
                  label="كلمة المرور"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-10 text-gray-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={props.isSubmitting}
                className="h-12 text-lg font-bold"
              >
                {props.isSubmitting ? "جاري التحميل..." : "دخول"}
              </Button>

              <p className="text-center text-xs text-gray-400">
                تسجيل الدخول يعني موافقتك على شروط الخدمة
              </p>
            </Form>
          </motion.div>
        )}
      </Formik>
    </section>
  );
};

export default Page;
