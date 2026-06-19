import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Step 1: Create the next-intl middleware
const intlMiddleware = createMiddleware(routing);

// Step 2: Define the middleware function
export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define public routes that don't require authentication
  const publicRoutes = ["/login", "/register"];

  // Extract the locale and the path after the locale
  const [, locale, ...rest] = pathname?.split("/");
  const pathAfterLocale = `/${rest.join("/")}` || "/";

  // Check if the current route (after locale) is public
  const isPublicRoute = publicRoutes.some((route) =>
    pathAfterLocale.startsWith(route)
  );

  // If the route is public, apply intlMiddleware and stop further checks
  if (isPublicRoute) {
    return intlMiddleware(request);
  }

  // Check for the token in cookies
  const token = request.cookies.get("auth_token")?.value;

  // If no token is found, redirect to the login page
  if (!token) {
    const localeToUse = locale || "ar"; // Fallback to default locale
    const loginUrl = new URL(`/${localeToUse}/login`, request.url);

    // Prevent redirect loop: if already on the login page, don't redirect again
    if (pathAfterLocale === "/login") {
      return intlMiddleware(request);
    }

    return NextResponse.redirect(loginUrl);
  }

  // If the token exists, continue with the request
  return intlMiddleware(request);
}

// Step 3: Specify the paths to apply the middleware
export const config = {
  matcher: ["/", "/(en|ar)/:path*"], // Apply middleware to internationalized pathnames
};
