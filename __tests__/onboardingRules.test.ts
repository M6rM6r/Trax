import { describe, expect, it } from "@jest/globals";
import {
  shouldAllowCompanySelfRegistration,
  getCompanyOnboardingCopy,
} from "@/lib/utils/onboardingRules";

describe("company onboarding rules", () => {
  it("blocks direct company self-registration", () => {
    expect(shouldAllowCompanySelfRegistration()).toBe(false);
  });

  it("explains that MasterMind owns company onboarding", () => {
    const copy = getCompanyOnboardingCopy();
    expect(copy.title).toContain("MasterMind");
    expect(copy.description).toContain("الشركات");
    expect(copy.cta).toContain("MasterMind");
  });
});
