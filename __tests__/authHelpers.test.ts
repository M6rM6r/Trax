import { describe, expect, it } from "@jest/globals";
import { normalizeUserRole, resolveUserRole } from "@/lib/utils/auth";

describe("auth utilities", () => {
  it("normalizes admin-like roles to boss", () => {
    expect(normalizeUserRole("admin")).toBe("boss");
    expect(normalizeUserRole("company_admin")).toBe("boss");
    expect(normalizeUserRole("super_admin")).toBe("boss");
    expect(normalizeUserRole("mastermind")).toBe("boss");
    expect(normalizeUserRole("manager")).toBe("manager");
    expect(normalizeUserRole("supervisor")).toBe("supervisor");
  });

  it("returns employee for unrecognized roles", () => {
    expect(normalizeUserRole("hacker")).toBe("employee");
    expect(normalizeUserRole("random")).toBe("employee");
  });

  it("returns boss for company accounts with missing employee_id", () => {
    const profile = { company_id: 123, email: "someone@trax.com" };
    expect(resolveUserRole(profile, {})).toBe("boss");
  });

  it("returns employee for profiles without company_id or admin_role", () => {
    const profile = { role: "employee" };
    expect(resolveUserRole(profile, {})).toBe("employee");
  });

  it("prefers admin_role over profile.role", () => {
    const profile = { role: "employee", admin_role: "manager" };
    expect(resolveUserRole(profile, {})).toBe("manager");
  });

  it("uses allow-listed token claims when profile does not indicate admin role", () => {
    const profile = { role: "employee" };
    expect(resolveUserRole(profile, { role: "boss" })).toBe("boss");
    expect(resolveUserRole(profile, { role: "mastermind" })).toBe("boss");
  });

  it("rejects token claims that are not explicitly allow-listed", () => {
    const profile = { role: "employee" };
    expect(resolveUserRole(profile, { role: "hacker" })).toBe("employee");
    expect(resolveUserRole(profile, { role: "admin" })).toBe("boss");
    expect(resolveUserRole(profile, { role: "owner" })).toBe("boss");
  });

  it("uses a narrow demo-role fallback for known local demo emails", () => {
    expect(resolveUserRole({}, { role: "employee" }, "boss@trax.com")).toBe("boss");
    expect(resolveUserRole({}, {}, "manager@trax.com")).toBe("manager");
    expect(resolveUserRole({}, {}, "employee@trax.com")).toBe("employee");
  });

  it("does not infer roles from unrelated email addresses", () => {
    expect(resolveUserRole({}, { role: "employee" }, "boss@evil.com")).toBe("employee");
    expect(resolveUserRole({}, {}, "admin@attacker.test")).toBe("employee");
    expect(resolveUserRole({ role: "employee" }, {}, "manager@foo.com")).toBe("employee");
  });
});
