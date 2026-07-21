"use client";

import { useEffect, useRef } from "react";
import { getIdTokenResult, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/config/firebase";
import { getFirebaseUserProfile } from "@/lib/services/firebaseData";
import { useAuthStore, type UserRole } from "@/stores/useAuthStore";
import { useFirebaseAuth } from "@/lib/config/env";
import { resolveUserRole } from "@/lib/utils/auth";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, clearUser, token, setUser, companyId, companyName } = useAuthStore();
  const hasRedirected = useRef(false);
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    if (!auth || !useFirebaseAuth) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        // Trust persisted local auth-storage over transient Firebase Auth state
        // to avoid immediate redirect loops in environments with flaky/strict
        // Firebase session handling. Protected data fetches still validate the
        // ID token server-side.
        let persistedUser = false;
        try {
          const raw =
            sessionStorage.getItem("auth-storage") ?? localStorage.getItem("auth-storage");
          persistedUser = !!raw && !!JSON.parse(raw).state?.user;
        } catch {
          persistedUser = false;
        }

        if (!persistedUser && userRef.current && !hasRedirected.current) {
          hasRedirected.current = true;
          clearUser();
          console.warn(
            "[auth] Firebase session expired and no local auth found, redirecting to login"
          );
          if (typeof window !== "undefined") {
            const pathParts = window.location.pathname.split("/");
            const detectedLocale = pathParts[1] === "en" ? "en" : "ar";
            window.location.href = `/${detectedLocale}/login?reason=session_expired`;
          }
        }
        return;
      }

      if (firebaseUser) {
        if (hasRedirected.current) {
          hasRedirected.current = false;
        }

        const shouldRestore = !userRef.current || !token || userRef.current.role === "employee";
        if (shouldRestore) {
          try {
            let profile: Record<string, unknown> | null = null;
            try {
              profile = await getFirebaseUserProfile(firebaseUser.uid, firebaseUser.email ?? "");
            } catch (e) {
              console.warn("[auth] Firestore profile lookup failed, using token claims:", e);
            }
            const tokenResult = await getIdTokenResult(firebaseUser);
            const profileData = (profile ?? {}) as Record<string, unknown> & {
              company?: { id?: unknown; name?: unknown };
            };
            const companyProfile = profileData.company;
            const role = resolveUserRole(profileData, tokenResult.claims, firebaseUser.email ?? "");

            if (!profile) {
              console.warn(
                "[auth] No profile resolved for Firebase user; continuing with inferred defaults",
                {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  resolvedRole: role,
                }
              );
            }

            const numericId = Array.from(firebaseUser.uid).reduce(
              (total, character) => (total * 31 + character.charCodeAt(0)) % 2147483647,
              0
            );
            const resolvedCompanyId = Number(profileData.company_id ?? companyProfile?.id ?? 1);
            const resolvedCompanyName = String(
              profileData.company_name ?? companyProfile?.name ?? "Trax"
            );
            const isEmployee = role === "employee";
            const resolvedEmployeeId =
              profileData.employee_id === null || profileData.employee_id === undefined
                ? isEmployee
                  ? numericId
                  : null
                : typeof profileData.employee_id === "string" ||
                    typeof profileData.employee_id === "number"
                  ? profileData.employee_id
                  : null;
            const resolvedAssignedGeofenceId =
              profileData.assigned_geofence_id === null ||
              profileData.assigned_geofence_id === undefined
                ? null
                : typeof profileData.assigned_geofence_id === "string" ||
                    typeof profileData.assigned_geofence_id === "number"
                  ? profileData.assigned_geofence_id
                  : null;
            const appUser = {
              id: Number(profileData.id ?? numericId),
              name: String(
                profileData.name ??
                  firebaseUser.displayName ??
                  firebaseUser.email?.split("@")[0] ??
                  "User"
              ),
              email: String(profileData.email ?? firebaseUser.email ?? ""),
              role,
              employee_id: resolvedEmployeeId,
              assigned_geofence_id: resolvedAssignedGeofenceId,
              permissions: [],
              created_at: new Date().toISOString(),
              profile_image: String(profileData.profile_image ?? ""),
            };
            const idToken = await firebaseUser.getIdToken();
            setUser(appUser, idToken, role, resolvedCompanyId, resolvedCompanyName);
          } catch (err) {
            console.warn("[auth] Failed to restore Firebase session:", err);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [clearUser, token, user, setUser]);

  useEffect(() => {
    if (!auth || !useFirebaseAuth) return;
    if (!token && auth.currentUser && user) {
      auth.currentUser
        .getIdToken(false)
        .then((newToken) => {
          if (user) {
            setUser(
              user,
              newToken,
              (user.role as UserRole) ?? "employee",
              companyId ?? 0,
              companyName ?? ""
            );
          }
        })
        .catch((err) => {
          console.warn("[auth] Token refresh failed:", err);
        });
    }
  }, [token, user, setUser, companyId, companyName]);

  return <>{children}</>;
}
