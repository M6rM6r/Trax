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
import { LoginResponse } from "@/lib/types/responseTypes";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { fetcherClient } from "@/lib/fetcherClient";
import { FetcherError } from "@/lib/fetcherTypes";
import { useState } from "react";
import TwoFactorMethodSelection from "@/components/shared/TwoFactorMethodSelection";
import TwoFactorOTPVerification from "@/components/shared/TwoFactorOTPVerification";
import { useAuthStore } from "@/stores/useAuthStore";

interface LoginValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

type TwoFactorStep = "login" | "method_selection" | "otp_verification";

const Page = () => {
  const { toast } = useToast();
  const router = useRouter();
  const locale = useLocale();
  const { setUser } = useAuthStore();

  // 2FA state
  const [twoFactorStep, setTwoFactorStep] = useState<TwoFactorStep>("login");
  const [selectedMethod, setSelectedMethod] = useState<
    "sms" | "authenticator" | null
  >(null);
  const [twoFactorData, setTwoFactorData] = useState<{
    userId: number;
    secret: string;
    method: string;
  } | null>(null);

  const handleSubmit = async (
    values: LoginValues,
    { setSubmitting }: FormikHelpers<LoginValues>
  ) => {
    const formdata = new FormData();
    formdata.append("email", values.email);
    formdata.append("password", values.password);
    try {
      const response = await fetcherClient<LoginResponse>("/login", {
        method: "POST",
        body: formdata,
      });

      // Check if 2FA is required
      if (response.data.pass_2fa === false) {
        // 2FA is required
        const userId = response.data.user_id || response.data.user.id;
        const secret = response.data["2fa_secret"] || "";
        const method = response.data.method || "";

        if (!userId || !secret) {
          toast({
            description: "خطأ في بيانات التحقق الثنائي",
            variant: "destructive",
          });
          setSubmitting(false);
          return;
        }

        setTwoFactorData({
          userId,
          secret,
          method: method.toLowerCase(),
        });

        // Check if user has multiple 2FA methods
        if (response.data.has_multi_2fa === true) {
          // Show method selection
          setTwoFactorStep("method_selection");
        } else {
          // Go directly to OTP verification with the method from response
          setSelectedMethod(method.toLowerCase() as "sms" | "authenticator");
          setTwoFactorStep("otp_verification");
        }
      } else {
        // No 2FA required, proceed normally
        setCookie("auth_token", response.data.token, {
          maxAge: 30 * 24 * 60 * 60,
        });

        // Save user data in the global auth store
        setUser(response.data.user, response.data.token);

        toast({
          description: response.message,
          variant: "default",
        });
        router.push(`/${locale}`);
      }
    } catch (error: unknown) {
      const errorMessage = (error as FetcherError)?.info?.message || "Error";
      toast({
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMethodSelectionContinue = async () => {
    if (!selectedMethod || !twoFactorData) return;

    try {
      const formdata = new FormData();
      formdata.append("user_id", twoFactorData.userId.toString());
      formdata.append("2fa_secret", twoFactorData.secret);
      formdata.append("2fa_method", selectedMethod);

      await fetcherClient("/2fa/otp/send", {
        method: "POST",
        body: formdata,
      });

      toast({
        description: "تم إرسال رمز التحقق بنجاح",
        variant: "default",
      });

      // Update method and go to OTP verification
      setTwoFactorData({
        ...twoFactorData,
        method: selectedMethod,
      });
      setTwoFactorStep("otp_verification");
    } catch (error: unknown) {
      const errorMessage =
        (error as FetcherError)?.info?.message || "خطأ في إرسال رمز التحقق";
      toast({
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleOTPResend = async () => {
    if (!selectedMethod || !twoFactorData) return;

    const formdata = new FormData();
    formdata.append("user_id", twoFactorData.userId.toString());
    formdata.append("2fa_secret", twoFactorData.secret);
    formdata.append("2fa_method", selectedMethod);

    await fetcherClient("/2fa/otp/send", {
      method: "POST",
      body: formdata,
    });
  };

  const handleOTPVerify = (token: string) => {
    // Store the token in cookies
    setCookie("auth_token", token, {
      maxAge: 30 * 24 * 60 * 60,
    });

    toast({
      description: "تم تسجيل الدخول بنجاح",
      variant: "default",
    });

    router.push(`/${locale}`);
  };

  const handleCancel = () => {
    setTwoFactorStep("login");
    setSelectedMethod(null);
    setTwoFactorData(null);
  };
  const loginSchema = Yup.object({
    email: Yup.string()
      .email("البريد الإلكتروني غير صحيح")
      .required("البريد الإلكتروني مطلوب"),
    password: Yup.string()
      .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
      .required("كلمة المرور مطلوبة"),
  });
  return (
    <section className="w-screen h-screen flex items-center justify-center relative bg-primaryColor">
      <Image
        src={loginBG}
        alt="loginBG"
        fill
        className="object-center object-cover z-0"
      />
      <LogoWhite className="absolute left-1/2 -translate-x-1/2 -top-5" />

      {twoFactorStep === "login" ? (
        <Formik<LoginValues>
          validationSchema={loginSchema}
          initialValues={{ email: "", password: "", rememberMe: false }}
          onSubmit={handleSubmit}
        >
          {(props) => (
            <Form className="bg-white rounded-16 p-5 flex flex-col gap-5 m-5 w-full max-w-[557px] relative z-10">
              <h1 className="text-24 font-[700] bg-clip-text text-transparent bg-[linear-gradient(270deg,#3C7EE7_0%,#10489B_100%)]">
                تسجيل الدخول
              </h1>
              <p className="text-18 text-textSubText mb-5 -mt-4">
                من فضلك قم بإستكمال بياناتك لتسجيل الدخول!
              </p>
              <CustomInput
                type="email"
                name="email"
                placeholder="example@gmail.com"
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
                  onCheckedChange={(value) =>
                    props.setFieldValue("rememberMe", value)
                  }
                  disabled={props.isSubmitting}
                />
                <label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  تذكرنى
                </label>
              </div>
              <Button
                type="submit"
                variant={"primary"}
                disabled={props.isSubmitting}
              >
                تسجيل الدخول
              </Button>
            </Form>
          )}
        </Formik>
      ) : twoFactorStep === "method_selection" ? (
        <div className="bg-white rounded-16 p-5 flex flex-col gap-5 m-5 w-full max-w-[557px] relative z-10">
          <TwoFactorMethodSelection
            selectedMethod={selectedMethod}
            onMethodChange={setSelectedMethod}
            onContinue={handleMethodSelectionContinue}
            onCancel={handleCancel}
          />
        </div>
      ) : twoFactorStep === "otp_verification" &&
        twoFactorData &&
        selectedMethod ? (
        <div className="bg-white rounded-16 p-5 flex flex-col gap-5 m-5 w-full max-w-[557px] relative z-10">
          <TwoFactorOTPVerification
            method={selectedMethod}
            userId={twoFactorData.userId}
            twoFactorSecret={twoFactorData.secret}
            onVerify={handleOTPVerify}
            onCancel={handleCancel}
            onResend={handleOTPResend}
            showResend={selectedMethod === "sms"}
          />
        </div>
      ) : null}
    </section>
  );
};

export default Page;
