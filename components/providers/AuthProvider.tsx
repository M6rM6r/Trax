"use client";

import { useEffect, useRef } from "react";
import { getIdTokenResult, onAuthStateChanged } from "firebase/auth";
import { useQueryClient } from "@tanstack/react-query";
import { auth } from "@/lib/config/firebase";
import { getFirebaseUserProfile } from "@/lib/services/firebaseData";
import { useAuthStore, type UserRole } from "@/stores/useAuthStore";
import { useCompanySettingsStore } from "@/stores/useCompanySettingsStore";
import { resolveUserRole } from "@/lib/utils/auth";
import useSessionTimeout from "@/hooks/useSessionTimeout";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const companyId = useAuthStore((state) => state.companyId);
  const companyName = useAuthStore((state) => state.companyName);
  const setUser = useAuthStore((state) => state.setUser);
  const clearUser = useAuthStore((state) => state.clearUser);
  const queryClient = useQueryClient();
  const hasRedirected = useRef(false);
  const userRef = useRef(user);
  userRef.current = user;
  const tokenRef = useRef(token);
  tokenRef.current = token;
  const companyIdRef = useRef(companyId);
  companyIdRef.current = companyId;
  const companyNameRef = useRef(companyName);
  companyNameRef.current = companyName;

  useSessionTimeout();

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        if (userRef.current) {
          clearUser();
          // Prevent cross-tenant settings + React Query cache bleed after logout.
          useCompanySettingsStore.getState().resetSettings();
          queryClient.clear();
          console.warn("[auth] Firebase session expired");
        }

        if (typeof window !== "undefined" && !hasRedirected.current) {
          const publicPages = ["login", "register", "forgot-password", "reset-password"];
          const pathParts = window.location.pathname.split("/");
          const detectedLocale = pathParts[1] === "en" ? "en" : "ar";
          const currentPage = pathParts[2] ?? "";

          if (!publicPages.includes(currentPage)) {
            hasRedirected.current = true;
            window.location.href = `/${detectedLocale}/login?reason=unauthenticated`;
          }
        }
        return;
      }

      if (firebaseUser) {
        if (hasRedirected.current) {
          hasRedirected.current = false;
        }

        // Always rehydrate from Firestore/token claims so companyId, employee_id, and role stay authoritative.
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
          const companyIdValue = profileData.company_id ?? companyProfile?.id ?? null;
          const resolvedCompanyIdRaw =
            typeof companyIdValue === "string" || typeof companyIdValue === "number"
              ? String(companyIdValue)
              : undefined;
          const resolvedCompanyId: string | undefined =
            resolvedCompanyIdRaw &&
            resolvedCompanyIdRaw !== "null" &&
            resolvedCompanyIdRaw !== "undefined"
              ? resolvedCompanyIdRaw
              : undefined;
          const resolvedCompanyName = String(
            profileData.company_name ?? companyProfile?.name ?? ""
          );
          // Never invent employee_id. Missing linkage must surface as no-employee, not a ghost id.
          const resolvedEmployeeId =
            profileData.employee_id === null || profileData.employee_id === undefined
              ? null
              : String(profileData.employee_id);
          const resolvedAssignedGeofenceId =
            profileData.assigned_geofence_id === null ||
            profileData.assigned_geofence_id === undefined
              ? null
              : String(profileData.assigned_geofence_id);
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
    });

    return () => unsubscribe();
  }, [clearUser, setUser, queryClient]);

  useEffect(() => {
    if (!auth) return;
    if (!tokenRef.current && auth.currentUser && userRef.current) {
      auth.currentUser
        .getIdToken(false)
        .then((newToken) => {
          if (userRef.current) {
            setUser(
              userRef.current,
              newToken,
              (userRef.current.role as UserRole) ?? "employee",
              companyIdRef.current ?? undefined,
              companyNameRef.current ?? undefined
            );
          }
        })
        .catch((err) => {
          console.warn("[auth] Token refresh failed:", err);
        });
    }
  }, [setUser]);

  return <>{children}</>;
}
