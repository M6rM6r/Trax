import { describe, expect, it } from "@jest/globals";
import {
  shouldAllowCompanySelfRegistration,
  getCompanyOnboardingCopy,
} from "@/lib/utils/onboardingRules";

describe("company onboarding rules", () => {
  it("allows company self-registration", () => {
    expect(shouldAllowCompanySelfRegistration()).toBe(true);
  });

  it("describes self-serve company onboarding", () => {
    const copy = getCompanyOnboardingCopy();
    expect(copy.title.toLowerCase()).toContain("company");
    expect(copy.description.toLowerCase()).toMatch(/employee|geofence|mastermind/);
    expect(copy.cta.toLowerCase()).toMatch(/phone|password|email|company/);
  });
});
