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
import { useEffect, useMemo, useState } from "react";
import { useAuthStore, type UserRole } from "@/stores/useAuthStore";
import { useLocale, useTranslations } from "next-intl";
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
import { resolveUserRole } from "@/lib/utils/auth";
import { canRoleAccessPath, homePathForRole } from "@/lib/utils/roleAccess";

/** Only same-origin app paths — blocks open redirects via ?next=. */
function safeNextPath(raw: string | null, role: UserRole): string {
  if (!raw) return homePathForRole(role);
  let decoded = raw.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    return homePathForRole(role);
  }
  if (!decoded.startsWith("/") || decoded.startsWith("//") || decoded.includes("://")) {
    return homePathForRole(role);
  }
  // Strip locale prefix for role check, keep full path for navigation.
  const stripped = decoded.replace(/^\/(ar|en)(?=\/|$)/, "") || "/";
  if (!canRoleAccessPath(role, stripped)) {
    return homePathForRole(role);
  }
  // Navigate with current locale via router — return path without locale if present.
  return stripped === "" ? "/" : stripped;
}

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
  const locale = useLocale();
  const searchParams = useSearchParams();
  const initialIdentifier = useMemo(
    () => searchParams.get("identifier")?.trim() || "",
    [searchParams]
  );
  const reason = searchParams.get("reason");
  const nextParam = searchParams.get("next");
  const setUser = useAuthStore((s) => s.setUser);
  const setRememberMe = useAuthStore((s) => s.setRememberMe);
  const clearUser = useAuthStore((s) => s.clearUser);
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.role);
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const api = useAuthStore.persist;
    if (!api) {
      setHydrated(true);
      return;
    }
    const unsub = api.onFinishHydration(() => setHydrated(true));
    if (api.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  // Already signed in → bounce to role home (or safe ?next=).
  useEffect(() => {
    if (!hydrated || showSuccess) return;
    if (!token || !role) return;
    const dest = safeNextPath(nextParam, role);
    router.replace(`/${locale}${dest === "/" ? "" : dest}`);
  }, [hydrated, token, role, nextParam, router, locale, showSuccess]);

  const reasonMessage = useMemo(() => {
    if (reason === "session_expired") return t("sessionExpired");
    if (reason === "session_timeout") return t("sessionTimeout");
    if (reason === "unauthenticated") return t("pleaseSignIn");
    return null;
  }, [reason, t]);

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
    // Single source of truth with AuthProvider — never force employee solely because employee_id exists
    // (company admins may carry linkage metadata without being field staff).
    const role = resolveUserRole(
      {
        role: user.role,
        company_id: user.company_id,
        employee_id: user.employee_id,
      },
      undefined,
      user.email
    );

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
      user.company_id || undefined,
      company?.name ?? user.company_name
    );

    hapticSuccess();
    toastSuccess(t("loginSuccess"));
    setShowSuccess(true);

    setTimeout(() => {
      // Exactly 3 homes + optional safe ?next= return path.
      const dest = safeNextPath(nextParam, role);
      router.push(`/${locale}${dest === "/" ? "" : dest}`);
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
      // Persist rememberMe before setUser so session cookie Max-Age is correct.
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

      const companyId = profileData.company_id ?? companyProfile?.id ?? null;
      const companyName = String(profileData.company_name ?? companyProfile?.name ?? "");

      const resolvedCompanyIdRaw =
        typeof companyId === "string" || typeof companyId === "number" ? String(companyId) : "";
      const resolvedCompanyId =
        resolvedCompanyIdRaw &&
        resolvedCompanyIdRaw !== "null" &&
        resolvedCompanyIdRaw !== "undefined"
          ? resolvedCompanyIdRaw
          : "";

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
            // Never invent employee_id from a hash of the auth uid.
            employee_id: hasEmployeeId ? String(profileData.employee_id) : null,
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

  // Hold form while rehydrate / already-auth redirect settles.
  if (!hydrated || (token && role && !showSuccess)) {
    return (
      <section className="w-screen h-screen flex items-center justify-center bg-background">
        <div
          className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"
          aria-busy="true"
          aria-label={t("loading")}
        />
      </section>
    );
  }

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

                {reasonMessage ? (
                  <p
                    role="status"
                    className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-xs font-medium text-amber-800 dark:text-amber-200"
                  >
                    {reasonMessage}
                  </p>
                ) : null}

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

                <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    className="w-4 h-4 rounded border-input text-primary focus:ring-ring"
                    checked={props.values.rememberMe}
                    onChange={() => props.setFieldValue("rememberMe", !props.values.rememberMe)}
                  />
                  {t("rememberMe")}
                </label>

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

                <p className="text-center text-sm text-muted-foreground pt-1">
                  {t("noAccount")}{" "}
                  <Link
                    href="/register"
                    className="font-semibold text-primary underline-offset-2 hover:underline"
                  >
                    {t("createCompanyAccount")}
                  </Link>
                </p>
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
