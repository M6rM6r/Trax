"use client";

import { useEffect, useRef, useCallback } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/config/firebase";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCompanySettingsStore } from "@/stores/useCompanySettingsStore";

const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "touchstart", "scroll", "click"];

function useSessionTimeout() {
  const role = useAuthStore((state) => state.role);
  const companyId = useAuthStore((state) => state.companyId);
  const clearUser = useAuthStore((state) => state.clearUser);
  const sessionTimeoutMinutes = useCompanySettingsStore((state) => state.sessionTimeoutMinutes);
  const timeoutMsRef = useRef<number>(60 * 60 * 1000);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const doSignOut = useCallback(async () => {
    try {
      if (auth) await signOut(auth);
    } catch (err) {
      console.error("[session-timeout] sign-out failed:", err);
    }
    clearUser();
    if (typeof window !== "undefined") {
      const pathParts = window.location.pathname.split("/");
      const detectedLocale = pathParts[1] === "en" ? "en" : "ar";
      window.location.href = `/${detectedLocale}/login?reason=session_timeout`;
    }
  }, [clearUser]);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      doSignOut();
    }, timeoutMsRef.current);
  }, [doSignOut]);

  useEffect(() => {
    if (role !== "employee" || !companyId) return;

    const minutes = Number(sessionTimeoutMinutes ?? 60);
    const timeoutMs = Math.max(5, minutes) * 60 * 1000;
    timeoutMsRef.current = timeoutMs;

    resetTimer();

    const onActivity = () => resetTimer();
    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, onActivity, { passive: true })
    );

    const onVisibility = () => {
      if (document.hidden) return;
      const idle = Date.now() - lastActivityRef.current;
      if (idle >= timeoutMsRef.current) {
        doSignOut();
      } else {
        resetTimer();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, onActivity));
      document.removeEventListener("visibilitychange", onVisibility);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [role, companyId, sessionTimeoutMinutes, resetTimer, doSignOut]);
}

export default useSessionTimeout;
