/**
 * Lightweight browser session marker for Next middleware.
 * Real authorization is Firebase Auth + Firestore rules + RoleGate.
 * Cookie only prevents casual unauthenticated shell access.
 */

export const TRAX_SESSION_COOKIE = "trax_session";

const MAX_AGE_REMEMBER_SEC = 60 * 60 * 24 * 30; // 30d

/**
 * Middleware shell marker only — never authorization.
 * rememberMe=true → persistent Max-Age.
 * rememberMe=false → session cookie (cleared when browser session ends).
 */
export function setTraxSessionCookie(rememberMe = true): void {
  if (typeof document === "undefined") return;
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  if (rememberMe) {
    document.cookie = `${TRAX_SESSION_COOKIE}=1; Path=/; Max-Age=${MAX_AGE_REMEMBER_SEC}; SameSite=Lax${secure}`;
    return;
  }
  // Session cookie: no Max-Age → discarded when the browser session ends.
  document.cookie = `${TRAX_SESSION_COOKIE}=1; Path=/; SameSite=Lax${secure}`;
}

export function clearTraxSessionCookie(): void {
  if (typeof document === "undefined") return;
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${TRAX_SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}
