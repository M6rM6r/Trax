"use client";
import CustomInput from "@/components/shared/form/CustomInput";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import loginBG from "@/public/images/loginBg.png";
import { LogoWhite } from "@/public/SVG";
import { Form, Formik, FormikHelpers } from "formik";
import Image from "next/image";
import { setCookie } from "cookies-next";
import * as Yup from "yup";
import { useToast } from "@/hooks/use-toast";
import { AdminUser } from "@/lib/types/responseTypes";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useState } from "react";
import { useAuthStore, UserRole } from "@/stores/useAuthStore";
import { Briefcase, User } from "lucide-react";

interface LoginValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

const mockUsers: Record<string, { user: AdminUser; token: string; role: UserRole }> = {
  "boss@trax.com": {
    user: {
      id: 1,
      name: "المدير العام",
      email: "boss@trax.com",
      role: "manager",
      permissions: [],
      created_at: new Date().toISOString(),
      profile_image: "",
    },
    token: "mock-boss-token",
    role: "boss",
  },
  "employee@trax.com": {
    user: {
      id: 2,
      name: "أحمد محمد",
      email: "employee@trax.com",
      role: "employee",
      permissions: [],
      created_at: new Date().toISOString(),
      profile_image: "",
    },
    token: "mock-employee-token",
    role: "employee",
  },
};

const Page = () => {
  const { toast } = useToast();
  const router = useRouter();
  const locale = useLocale();
  const { setUser } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<UserRole>("boss");

  const handleSubmit = async (
    values: LoginValues,
    { setSubmitting }: FormikHelpers<LoginValues>
  ) => {
    try {
      const mockUser = mockUsers[values.email];

      if (!mockUser || values.password !== "12345678") {
        toast({
          description: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      setCookie("auth_token", mockUser.token, {
        maxAge: 30 * 24 * 60 * 60,
      });

      setUser(mockUser.user, mockUser.token, mockUser.role);

      toast({
        description: "تم تسجيل الدخول بنجاح",
        variant: "default",
      });

      if (mockUser.role === "employee") {
        router.push(`/${locale}/check-in`);
      } else {
        router.push(`/${locale}`);
      }
    } catch {
      toast({
        description: "حدث خطأ أثناء تسجيل الدخول",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const loginSchema = Yup.object({
    email: Yup.string().email("البريد الإلكتروني غير صحيح").required("البريد الإلكتروني مطلوب"),
    password: Yup.string()
      .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
      .required("كلمة المرور مطلوبة"),
  });

  return (
    <section className="w-screen h-screen flex items-center justify-center relative bg-primaryColor">
      <Image src={loginBG} alt="loginBG" fill className="object-center object-cover z-0" />
      <LogoWhite className="absolute left-1/2 -translate-x-1/2 -top-5" />

      <Formik<LoginValues>
        validationSchema={loginSchema}
        initialValues={{ email: "boss@trax.com", password: "12345678", rememberMe: false }}
        onSubmit={handleSubmit}
      >
        {(props) => (
          <Form className="bg-white dark:bg-slate-800 rounded-16 p-5 flex flex-col gap-5 m-5 w-full max-w-[557px] relative z-10">
            <h1 className="text-24 font-[700] bg-clip-text text-transparent bg-[linear-gradient(270deg,#3C7EE7_0%,#10489B_100%)]">
              تسجيل الدخول — Trax
            </h1>
            <p className="text-18 text-textSubText mb-5 -mt-4">
              من فضلك قم بإستكمال بياناتك لتسجيل الدخول!
            </p>

            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("boss");
                  props.setFieldValue("email", "boss@trax.com");
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                  selectedRole === "boss"
                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                    : "border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-500"
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span className="text-sm font-medium">مدير</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("employee");
                  props.setFieldValue("email", "employee@trax.com");
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                  selectedRole === "employee"
                    ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                    : "border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-500"
                }`}
              >
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">موظف</span>
              </button>
            </div>

            <CustomInput
              type="email"
              name="email"
              placeholder="example@trax.com"
              label="بريد إلكتروني"
            />
            <CustomInput
              type="password"
              name="password"
              placeholder="*********"
              label="كلمة المرور"
            />
            <div className="flex items-center gap-2">
              <Checkbox
                id="terms"
                onCheckedChange={(value) => props.setFieldValue("rememberMe", value)}
                disabled={props.isSubmitting}
              />
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                تذكرنى
              </label>
            </div>
            <Button type="submit" variant={"primary"} disabled={props.isSubmitting}>
              تسجيل الدخول
            </Button>
            <p className="text-xs text-gray-400 dark:text-slate-500 text-center">
              تجريبي: boss@trax.com / employee@trax.com — كلمة المرور: 12345678
            </p>
          </Form>
        )}
      </Formik>
    </section>
  );
};

export default Page;
