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
  username: string;
  password: string;
}): string {
  const company = input.companyName?.trim() || "Trax";
  return [
    `مرحبًا، تم إنشاء حسابك في ${company}`,
    `البريد الإلكتروني: ${input.email}`,
    `اسم المستخدم: ${input.username}`,
    `كلمة المرور المؤقتة: ${input.password}`,
    "يرجى تسجيل الدخول وتغيير كلمة المرور فورًا.",
  ].join("\n");
}

export function buildStaffCredentialsEmail(input: {
  companyName?: string | null;
  email: string;
  username: string;
  password: string;
}): { subject: string; body: string } {
  const company = input.companyName?.trim() || "Trax";
  const subject = `بيانات الدخول إلى ${company}`;
  const body = buildStaffCredentialsMessage(input);
  return { subject, body };
}
