"use client";

import { useEffect, useRef } from "react";
import { onAuthStateChanged, browserLocalPersistence, setPersistence } from "firebase/auth";
import { auth } from "@/lib/config/firebase";
import { useAuthStore, type UserRole } from "@/stores/useAuthStore";
import { env } from "@/lib/config/env";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, clearUser, token, setUser, companyId, companyName } = useAuthStore();
  const hasRedirected = useRef(false);
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    if (!auth || !env.NEXT_PUBLIC_USE_FIREBASE) return;

    // Always use local persistence so session survives tab refresh
    setPersistence(auth, browserLocalPersistence).catch(() => {});

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser && userRef.current && !hasRedirected.current) {
        // Firebase session ended but we still have a user in store — clear and redirect
        hasRedirected.current = true;
        clearUser();
        console.warn("[auth] Firebase session expired, redirecting to login");
        if (typeof window !== "undefined") {
          const pathParts = window.location.pathname.split("/");
          const detectedLocale = pathParts[1] === "en" ? "en" : "ar";
          window.location.href = `/${detectedLocale}/login?reason=session_expired`;
        }
      } else if (firebaseUser && hasRedirected.current) {
        hasRedirected.current = false;
      }
    });

    return () => unsubscribe();
  }, [clearUser]); // subscribe once — don't re-subscribe on user changes

  // If token is missing but Firebase has a user, refresh and store the token
  useEffect(() => {
    if (!auth || !env.NEXT_PUBLIC_USE_FIREBASE) return;
    if (!token && auth.currentUser && user) {
      auth.currentUser.getIdToken(false).then((newToken) => {
        if (user) {
          setUser(user, newToken, (user.role as UserRole) ?? "employee", companyId ?? 0, companyName ?? "");
        }
      }).catch((err) => {
        console.warn("[auth] Token refresh failed:", err);
      });
    }
  }, [token, user, setUser, companyId, companyName]);

  return <>{children}</>;
}
