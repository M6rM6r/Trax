import type { UserRole } from "@/stores/useAuthStore";

/**
 * Trax has exactly three account types. Every route/nav/shortcut decision
 * goes through this module — do not scatter role checks.
 *
 *  mastermind → platform ops (/mastermind/*)
 *  company    → company admin (dashboard, staff, attendance, geofences, settings)
 *  employee   → field staff check-in only
 */

export type AppRole = UserRole; // "mastermind" | "company" | "employee"

/** Home path after login / when landing on a forbidden page. */
export function homePathForRole(role: AppRole | null | undefined): string {
  if (role === "mastermind") return "/mastermind/companies";
  if (role === "employee") return "/check-in";
  if (role === "company") return "/";
  return "/login";
}

/** Public / auth surfaces (no role required). Locale prefix is stripped before match. */
const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/mastermind/login",
  "/forgot-password",
  "/reset-password",
] as const;

function normalizePath(pathname: string): string {
  if (!pathname) return "/";
  // Strip locale segment if present: /ar/employees → /employees
  const stripped = pathname.replace(/^\/(ar|en)(?=\/|$)/, "") || "/";
  const noQuery = stripped.split("?")[0]?.split("#")[0] || "/";
  if (noQuery.length > 1 && noQuery.endsWith("/")) return noQuery.slice(0, -1);
  return noQuery || "/";
}

function startsWithPath(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

export function isPublicPath(pathname: string): boolean {
  const path = normalizePath(pathname);
  return PUBLIC_PREFIXES.some((p) => startsWithPath(path, p));
}

/**
 * Returns true if this role may open the path.
 * Unknown role → only public paths.
 */
export function canRoleAccessPath(role: AppRole | null | undefined, pathname: string): boolean {
  const path = normalizePath(pathname);
  if (isPublicPath(path)) return true;
  if (!role) return false;

  // MasterMind: only mastermind area (plus public)
  if (role === "mastermind") {
    return startsWithPath(path, "/mastermind");
  }

  // Employee: check-in (+ own session security settings if needed)
  if (role === "employee") {
    if (startsWithPath(path, "/check-in")) return true;
    if (startsWithPath(path, "/settings/securitySettings")) return true;
    if (startsWithPath(path, "/settings/notificationSettings")) return true;
    // Block company / mastermind / management
    return false;
  }

  // Company admin: allowlisted management surfaces only (default-deny).
  if (role === "company") {
    if (startsWithPath(path, "/check-in")) return false;
    if (startsWithPath(path, "/mastermind")) return false;
    if (path === "/") return true;
    if (startsWithPath(path, "/employees")) return true;
    if (startsWithPath(path, "/attendance")) return true;
    if (startsWithPath(path, "/geofences")) return true;
    if (startsWithPath(path, "/live-map")) return true;
    if (startsWithPath(path, "/settings")) return true;
    return false;
  }

  return false;
}

/** Nav items allowed per role (paths only). */
export function navPathsForRole(role: AppRole | null | undefined): string[] {
  if (role === "employee") return ["/check-in"];
  if (role === "mastermind") return ["/mastermind/companies"];
  if (role === "company") {
    return [
      "/",
      "/employees",
      "/attendance",
      "/geofences",
      "/settings",
      "/settings/company",
      "/live-map",
    ];
  }
  return [];
}

export function isCompanyRole(role: AppRole | null | undefined): boolean {
  return role === "company";
}

export function isEmployeeRole(role: AppRole | null | undefined): boolean {
  return role === "employee";
}

export function isMastermindRole(role: AppRole | null | undefined): boolean {
  return role === "mastermind";
}
