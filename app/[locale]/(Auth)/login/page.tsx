"use client";
import CustomInput from "@/components/shared/form/CustomInput";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Form, Formik, FormikHelpers } from "formik";
import { CheckCircle2 } from "lucide-react";
import * as Yup from "yup";
import { toastSuccess, toastError } from "@/hooks/use-toast";
import { useSearchParams, useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useMemo, useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useTranslations } from "next-intl";
import { hapticSuccess, hapticError } from "@/lib/utils/haptics";
import {
  getIdTokenResult,
  signInWithEmailAndPassword,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/config/firebase";
import { getFirebaseUserProfile } from "@/lib/services/firebaseData";
import { resolveUserRole, normalizeUserRole } from "@/lib/utils/auth";

interface LoginValues {
  identifier: string;
  password: string;
  rememberMe: boolean;
}

const loginSchema = (t: ReturnType<typeof useTranslations>) =>
  Yup.object({
    identifier: Yup.string().email(t("emailInvalid")).required(t("emailRequired")),
    password: Yup.string().min(8, t("passwordMin")).required(t("passwordRequired")),
  });

const Page = () => {
  const t = useTranslations("Auth");
  const searchParams = useSearchParams();
  const initialIdentifier = useMemo(
    () => searchParams.get("identifier")?.trim() || "",
    [searchParams]
  );
  const { setUser, setRememberMe, clearUser } = useAuthStore();
  const router = useRouter();
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
          company_id: string;
          employee_id?: string | null;
          assigned_geofence_id?: string | null;
          company_name?: string;
        };
        company?: { id: string; name: string };
      };
    }
  ) => {
    if (!resp.success || !resp.data) {
      hapticError();
      toastError(t("invalidCredentials"));
      return;
    }

    const { user, company } = resp.data;
    const hasCompany = user.company_id !== null && user.company_id !== undefined;
    const hasEmployeeId = user.employee_id !== null && user.employee_id !== undefined;
    let role;
    if (hasEmployeeId) {
      role = "employee";
    } else if (hasCompany) {
      role = "company";
    } else {
      role = normalizeUserRole(user.role);
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
      company?.name ?? user.company_name
    );

    hapticSuccess();
    toastSuccess(t("loginSuccess"));
    setShowSuccess(true);

    setTimeout(() => {
      const currentLocale =
        typeof window !== "undefined" && window.location.pathname.split("/")[1] === "en"
          ? "en"
          : "ar";
      const targetPath = role === "employee" ? `/${currentLocale}/check-in` : `/${currentLocale}`;
      router.push(targetPath);
    }, 800);
  };

  const handleSubmit = async (
    values: LoginValues,
    { setSubmitting }: FormikHelpers<LoginValues>
  ) => {
    if (!auth) {
      hapticError();
      toastError(t("firebaseNotConfigured"));
      setSubmitting(false);
      return;
    }

    try {
      const persistence = values.rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);
      const credential = await signInWithEmailAndPassword(auth, values.identifier, values.password);
      const idToken = await credential.user.getIdToken();
      setRememberMe(values.rememberMe);

      // Firebase-first: Firestore profile is the primary source of truth.
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

      const companyId = profileData.company_id ?? companyProfile?.id ?? null;
      const companyName = String(profileData.company_name ?? companyProfile?.name ?? "");

      const resolvedCompanyId: string = String(companyId);

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
            company_id: resolvedCompanyId,
            employee_id: hasEmployeeId
              ? String(profileData.employee_id)
              : isEmployee
                ? String(numericId)
                : null,
            assigned_geofence_id:
              profileData.assigned_geofence_id === null ||
              profileData.assigned_geofence_id === undefined
                ? null
                : String(profileData.assigned_geofence_id),
          },
          company: {
            id: resolvedCompanyId,
            name: companyName,
          },
        },
      });
    } catch (err) {
      hapticError();
      const firebaseErr = err as { code?: string; message?: string };
      let msg = t("invalidCredentials");
      if (firebaseErr?.code === "auth/unauthorized-domain") {
        msg = t("unauthorizedDomain");
      } else if (firebaseErr?.code === "auth/user-not-found") {
        msg = t("userNotFound");
      } else if (firebaseErr?.code === "auth/wrong-password") {
        msg = t("wrongPassword");
      } else if (firebaseErr?.code === "auth/invalid-credential") {
        msg = t("invalidCredential");
      } else if (firebaseErr?.code === "auth/too-many-requests") {
        msg = t("tooManyRequests");
      } else if (firebaseErr?.message) {
        msg = firebaseErr.message;
      }
      toastError(msg);
      await signOut(auth).catch(() => undefined);
      clearUser();
    } finally {
      setSubmitting(false);
    }
  };

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

        <Formik
          initialValues={{ identifier: initialIdentifier, password: "", rememberMe: false }}
          enableReinitialize
          validationSchema={loginSchema(t)}
          onSubmit={handleSubmit}
        >
          {(props) => (
            <div className="w-full">
              <Form className="bg-card border border-border rounded-lg p-8 flex flex-col gap-5">
                <div className="text-center mb-2">
                  <h1 className="text-xl font-bold text-foreground">{t("loginTitle")}</h1>
                </div>

                <CustomInput
                  type="email"
                  name="identifier"
                  placeholder="email@trax.com"
                  label={t("email")}
                />

                <CustomInput
                  type="password"
                  name="password"
                  placeholder="*********"
                  label={t("password")}
                />

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer text-muted-foreground">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      className="w-4 h-4 rounded border-input text-primary focus:ring-ring"
                      checked={props.values.rememberMe}
                      onChange={() => props.setFieldValue("rememberMe", !props.values.rememberMe)}
                    />
                    {t("rememberMe")}
                  </label>
                  <Link href="/forgot-password" className="text-primary hover:underline text-sm">
                    {t("forgotPassword")}
                  </Link>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={props.isSubmitting}
                  className="h-11 font-semibold flex items-center justify-center gap-2"
                >
                  {props.isSubmitting && (
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  )}
                  {props.isSubmitting ? t("loading") : t("login")}
                </Button>
              </Form>
            </div>
          )}
        </Formik>

        {showSuccess && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
            <CheckCircle2 className="w-16 h-16 text-primary" />
            <p className="mt-4 text-lg font-bold text-foreground">{t("loginSuccess")}</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Page;
