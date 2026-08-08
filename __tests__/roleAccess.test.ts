import { describe, expect, it } from "@jest/globals";
import { canRoleAccessPath, homePathForRole, isPublicPath } from "@/lib/utils/roleAccess";

describe("roleAccess — three roles only", () => {
  it("homes are fixed per role", () => {
    expect(homePathForRole("mastermind")).toBe("/mastermind/companies");
    expect(homePathForRole("company")).toBe("/");
    expect(homePathForRole("employee")).toBe("/check-in");
  });

  it("public paths are open", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/ar/login")).toBe(true);
    expect(isPublicPath("/register")).toBe(true);
    expect(isPublicPath("/mastermind/login")).toBe(true);
  });

  it("employee cannot open company or mastermind pages", () => {
    expect(canRoleAccessPath("employee", "/check-in")).toBe(true);
    expect(canRoleAccessPath("employee", "/employees")).toBe(false);
    expect(canRoleAccessPath("employee", "/")).toBe(false);
    expect(canRoleAccessPath("employee", "/mastermind/companies")).toBe(false);
    expect(canRoleAccessPath("employee", "/attendance")).toBe(false);
  });

  it("company cannot open check-in or mastermind", () => {
    expect(canRoleAccessPath("company", "/")).toBe(true);
    expect(canRoleAccessPath("company", "/employees")).toBe(true);
    expect(canRoleAccessPath("company", "/check-in")).toBe(false);
    expect(canRoleAccessPath("company", "/mastermind/companies")).toBe(false);
    // Default-deny: unlisted company surfaces are closed until allowlisted.
    expect(canRoleAccessPath("company", "/secret-admin")).toBe(false);
    expect(canRoleAccessPath("company", "/reports-v2")).toBe(false);
  });

  it("mastermind only mastermind area", () => {
    expect(canRoleAccessPath("mastermind", "/mastermind/companies")).toBe(true);
    expect(canRoleAccessPath("mastermind", "/")).toBe(false);
    expect(canRoleAccessPath("mastermind", "/check-in")).toBe(false);
    expect(canRoleAccessPath("mastermind", "/employees")).toBe(false);
  });
});
