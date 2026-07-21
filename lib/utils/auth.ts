import type { UserRole } from "@/stores/useAuthStore";

const adminRoles: UserRole[] = ["boss", "manager", "supervisor"];

/**
 * Trusted admin roles that may be asserted via secure custom claims set by the backend.
 * Never infer admin privileges from email addresses or unverified user input.
 */
const claimAdminAllowList = new Set<string>([
  "boss",
  "manager",
  "supervisor",
  "admin",
  "company_admin",
  "owner",
  "super_admin",
  "mastermind",
]);

const demoRoleEmailMap: Record<string, UserRole> = {
  boss: "boss",
  manager: "manager",
  supervisor: "supervisor",
  employee: "employee",
};

export function normalizeUserRole(raw: string | undefined | null): UserRole {
  if (!raw) return "employee";
  const normalized = String(raw).trim().toLowerCase();
  if (adminRoles.includes(normalized as UserRole)) return normalized as UserRole;
  if (claimAdminAllowList.has(normalized)) {
    return "boss";
  }
  return "employee";
}

/**
 * Determines the user role from the most authoritative source available.
 *
 * Hierarchy:
 * 1. `admin_role` from the Firestore user profile (most trusted, backend-controlled).
 * 2. `role` from the Firestore user profile.
 * 3. `role` from the Firebase ID token custom claims, but only if it is in the
 *    explicit claimAdminAllowList. Claims must never grant admin access unless
 *    explicitly allow-listed.
 * 4. Company-owner heuristic: a profile linked to a company but with no employee
 *    record is treated as the company owner (`boss`).
 * 5. Local/demo fallback: for known local demo accounts (boss/manager/supervisor/employee)
 *    we allow a very narrow email-based fallback when the app is running locally or when
 *    explicitly enabled. This keeps the local experience consistent without granting
 *    admin access to arbitrary emails.
 * 6. Default to `employee`.
 */
export function inferRoleFromEmail(email?: string | null): UserRole {
  const normalizedEmail = String(email ?? "")
    .trim()
    .toLowerCase();
  if (!normalizedEmail) return "employee";

  const [localPart, domain] = normalizedEmail.split("@");
  const allowedDemoDomains = new Set(["trax.com", "localhost", "127.0.0.1", "0.0.0.0"]);
  const inferredRole = localPart
    .match(/^(boss|manager|supervisor|employee)(?:[.+_-].*)?$/i)?.[1]
    ?.toLowerCase();

  if (inferredRole && demoRoleEmailMap[inferredRole] && allowedDemoDomains.has(domain ?? "")) {
    return demoRoleEmailMap[inferredRole];
  }

  return "employee";
}

export function resolveUserRole(
  profile: Record<string, unknown> | null,
  tokenClaims: Record<string, unknown> | undefined,
  email?: string | null
): UserRole {
  const profileRole = String(profile?.role ?? "")
    .trim()
    .toLowerCase();
  const adminRole = String(profile?.admin_role ?? "")
    .trim()
    .toLowerCase();
  const tokenRole = String(tokenClaims?.role ?? "")
    .trim()
    .toLowerCase();

  if (adminRole && normalizeUserRole(adminRole) !== "employee") {
    return normalizeUserRole(adminRole);
  }
  if (profileRole && normalizeUserRole(profileRole) !== "employee") {
    return normalizeUserRole(profileRole);
  }
  if (tokenRole && claimAdminAllowList.has(tokenRole)) {
    return normalizeUserRole(tokenRole);
  }
  if (
    profile?.company_id !== null &&
    profile?.company_id !== undefined &&
    (profile?.employee_id === null || profile?.employee_id === undefined)
  ) {
    return "boss";
  }

  const shouldInferFromEmail =
    process.env.NEXT_PUBLIC_ENABLE_DEMO_ROLE_INFERENCE === "true" ||
    process.env.NODE_ENV !== "production";
  const hasExplicitNonEmployeeTokenRole = tokenRole && tokenRole !== "employee";

  if (shouldInferFromEmail && !profileRole && !adminRole && !hasExplicitNonEmployeeTokenRole) {
    return inferRoleFromEmail(email);
  }

  return "employee";
}
