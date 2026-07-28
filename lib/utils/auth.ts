import type { UserRole } from "@/stores/useAuthStore";

const adminAliases = new Set<string>([
  "boss",
  "manager",
  "supervisor",
  "admin",
  "company_admin",
  "owner",
  "super_admin",
  "mastermind",
  "company",
]);

const demoRoleEmailMap: Record<string, UserRole> = {
  boss: "company",
  manager: "company",
  supervisor: "company",
  employee: "employee",
};

export function normalizeUserRole(raw: string | undefined | null): UserRole {
  if (!raw) return "employee";
  const normalized = String(raw).trim().toLowerCase();
  if (adminAliases.has(normalized)) return "company";
  return "employee";
}

/**
 * Determines the user type from the most authoritative source available.
 * Company accounts are any profile linked to a company without an employee_id.
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

  if (adminRole) {
    return normalizeUserRole(adminRole);
  }
  if (profileRole) {
    return normalizeUserRole(profileRole);
  }
  if (tokenRole && adminAliases.has(tokenRole)) {
    return "company";
  }
  if (
    profile?.company_id !== null &&
    profile?.company_id !== undefined &&
    (profile?.employee_id === null || profile?.employee_id === undefined)
  ) {
    return "company";
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
