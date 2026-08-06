/**
 * Lightweight browser session marker for Next middleware.
 * Real authorization is Firebase Auth + Firestore rules + RoleGate.
 * Cookie only prevents casual unauthenticated shell access.
 */

export const TRAX_SESSION_COOKIE = "trax_session";

const MAX_AGE_REMEMBER_SEC = 60 * 60 * 24 * 30; // 30d
const MAX_AGE_SESSION_SEC = 60 * 60 * 12; // 12h

export function setTraxSessionCookie(rememberMe = true): void {
  if (typeof document === "undefined") return;
  const maxAge = rememberMe ? MAX_AGE_REMEMBER_SEC : MAX_AGE_SESSION_SEC;
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${TRAX_SESSION_COOKIE}=1; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

export function clearTraxSessionCookie(): void {
  if (typeof document === "undefined") return;
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${TRAX_SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}
