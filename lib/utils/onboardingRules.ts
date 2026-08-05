export function shouldAllowCompanySelfRegistration(): boolean {
  return true;
}

export function getCompanyOnboardingCopy() {
  return {
    title: "Create your company",
    description:
      "Companies sign up themselves. You add employees and geofences; staff check in and out. MasterMind only observes the network.",
    cta: "Start free — company name, phone, email, password.",
  };
}
