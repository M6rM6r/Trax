import { describe, expect, it } from "@jest/globals";
import { normalizeUserRole, resolveUserRole } from "@/lib/utils/auth";

describe("auth utilities", () => {
  it("normalizes admin-like roles to company, preserves mastermind", () => {
    expect(normalizeUserRole("admin")).toBe("company");
    expect(normalizeUserRole("company_admin")).toBe("company");
    expect(normalizeUserRole("super_admin")).toBe("company");
    expect(normalizeUserRole("mastermind")).toBe("mastermind");
    expect(normalizeUserRole("manager")).toBe("company");
    expect(normalizeUserRole("supervisor")).toBe("company");
  });

  it("returns employee for unrecognized roles", () => {
    expect(normalizeUserRole("hacker")).toBe("employee");
    expect(normalizeUserRole("random")).toBe("employee");
  });

  it("returns company for company accounts with missing employee_id", () => {
    const profile = { company_id: 123, email: "someone@trax.com" };
    expect(resolveUserRole(profile, {})).toBe("company");
  });

  it("returns employee for profiles without company_id or admin_role", () => {
    const profile = { role: "employee" };
    expect(resolveUserRole(profile, {})).toBe("employee");
  });

  it("prefers admin_role over profile.role", () => {
    const profile = { role: "employee", admin_role: "manager" };
    expect(resolveUserRole(profile, {})).toBe("company");
  });

  it("uses allow-listed token claims when profile does not indicate admin role", () => {
    const profile = {};
    expect(resolveUserRole(profile, { role: "boss" })).toBe("company");
    expect(resolveUserRole(profile, { role: "mastermind" })).toBe("mastermind");
  });

  it("rejects token claims that are not explicitly allow-listed", () => {
    const profile = {};
    expect(resolveUserRole(profile, { role: "hacker" })).toBe("employee");
    expect(resolveUserRole(profile, { role: "employee" })).toBe("employee");
  });

  it("uses a narrow demo-role fallback for known local demo emails", () => {
    expect(resolveUserRole({}, { role: "employee" }, "boss@trax.com")).toBe("company");
    expect(resolveUserRole({}, {}, "manager@trax.com")).toBe("company");
    expect(resolveUserRole({}, {}, "employee@trax.com")).toBe("employee");
  });

  it("does not infer roles from unrelated email addresses", () => {
    expect(resolveUserRole({}, { role: "employee" }, "boss@evil.com")).toBe("employee");
    expect(resolveUserRole({}, {}, "admin@attacker.test")).toBe("employee");
    expect(resolveUserRole({ role: "employee" }, {}, "manager@foo.com")).toBe("employee");
  });
});
