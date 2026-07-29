import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

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

  // 3. Run i18n middleware
  const response = intlMiddleware(request);

  // 3. Simple Auth Check (Local testing only)
  // If you want to force sign-in locally, uncomment the lines below:
  /*
  const token = request.cookies.get("auth_token")?.value;
  const isAuthPage = pathname.includes("/login") || pathname.includes("/register");

  if (!token && !isAuthPage) {
     return NextResponse.redirect(new URL("/ar/login", request.url));
  }
  */

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
