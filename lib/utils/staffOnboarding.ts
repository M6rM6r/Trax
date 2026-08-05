export function generateStaffUsername(input: {
  name?: string;
  email?: string;
  employeeNumber?: string;
}): string {
  if (input.employeeNumber?.trim()) return input.employeeNumber.trim();

  const emailLocal = input.email?.split("@")[0]?.trim();
  if (emailLocal) return emailLocal.toLowerCase();

  const normalizedName = (input.name || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, "")
    .trim()
    .replace(/\s+/g, "_");

  if (normalizedName) return normalizedName;

  return `staff_${Date.now().toString().slice(-6)}`;
}

export function buildStaffCredentialsMessage(input: {
  companyName?: string | null;
  email: string;
  username?: string;
  password: string;
  loginUrl?: string | null;
}): string {
  const company = input.companyName?.trim() || "Trax";
  const locale = input.loginUrl?.includes("/en/") ? "en" : "ar";
  const baseUrl = "https://naf--trax-ae.asia-southeast1.hosted.app";

  if (locale === "ar") {
    return [
      `مرحبًا، تم إنشاء حسابك في ${company}`,
      `اسم المستخدم: ${input.username ?? input.email}`,
      `البريد الإلكتروني: ${input.email}`,
      `كلمة المرور المؤقتة: ${input.password}`,
      `رابط تسجيل الدخول: ${baseUrl}/ar/`,
    ].join("\n");
  }

  return [
    `Hello, your ${company} account has been created`,
    `Username: ${input.username ?? input.email}`,
    `Email: ${input.email}`,
    `Temporary password: ${input.password}`,
    `Login link: ${baseUrl}/en/`,
  ].join("\n");
}

export function buildStaffCredentialsEmail(input: {
  companyName?: string | null;
  email: string;
  username?: string;
  password: string;
  loginUrl?: string | null;
}): { subject: string; body: string } {
  const company = input.companyName?.trim() || "Trax";
  const subject = `بيانات الدخول إلى ${company}`;
  const body = buildStaffCredentialsMessage(input);
  return { subject, body };
}
