export function shouldAllowCompanySelfRegistration(): boolean {
  return false;
}

export function getCompanyOnboardingCopy() {
  return {
    title: "إنشاء شركة عبر MasterMind",
    description:
      "يتم إنشاء الشركات وإدارة الحسابات الإدارية من خلال MasterMind، ثم تتولى الشركة لاحقاً إنشاء وإدارة حسابات الموظفين من داخل حسابها.",
    cta: "استخدم بوابة MasterMind لإنشاء الشركة والحساب الإداري الأول.",
  };
}
