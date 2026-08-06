import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { TRAX_SESSION_COOKIE } from "./lib/auth/sessionCookie";

const intlMiddleware = createMiddleware(routing);

/** Paths that never require a session cookie (locale stripped later). */
const PUBLIC_SUFFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/mastermind/login",
];

function isPublicPath(pathname: string): boolean {
  const stripped = pathname.replace(/^\/(ar|en)(?=\/|$)/, "") || "/";
  const path = stripped.split("?")[0] || "/";
  if (path === "/" || path === "") {
    // Root is app shell — requires session
    return false;
  }
  return PUBLIC_SUFFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Completely ignore static files and system paths
  if (
    pathname.includes(".") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // 2. Default to Arabic for new users (no cookie yet)
  if (!request.cookies.get("NEXT_LOCALE")?.value) {
    request.cookies.set("NEXT_LOCALE", "ar");
  }

  // 3. Session gate (Firebase-first UI still re-validates via AuthProvider + RoleGate)
  const hasSession = Boolean(request.cookies.get(TRAX_SESSION_COOKIE)?.value);
  if (!hasSession && !isPublicPath(pathname)) {
    const parts = pathname.split("/").filter(Boolean);
    const locale = parts[0] === "en" || parts[0] === "ar" ? parts[0] : "ar";
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("reason", "unauthenticated");
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. i18n
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
