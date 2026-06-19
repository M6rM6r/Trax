import MainLayout from "@/components/shared/MainLayout";
import AuthenticatorDialog from "@/components/shared/AuthenticatorDialog";
import SMSVerificationDialog from "@/components/shared/SMSVerificationDialog";
import { Message } from "@/public/SVG";
import { fetcher } from "@/lib/fetcher";
import { TwoFactorStatusResponseType } from "@/lib/types/TwoFactorStatusResponseType";
import { revalidateSecuritySettings } from "./actions";

const Page = async () => {

  const data = await fetcher<TwoFactorStatusResponseType>("/2fa/status");

const smsMethod = data.data.methods.find((method: any) => method.key === "sms");
const authenticatorMethod = data.data.methods.find((method: any) => method.key === "authenticator");

// Convert active from number to boolean
const smsMethodFormatted = smsMethod ? { ...smsMethod, active: !!smsMethod.active } : undefined;
const authenticatorMethodFormatted = authenticatorMethod ? { ...authenticatorMethod, active: !!authenticatorMethod.active } : undefined;

  return (
    <MainLayout>
      <div className=" p-5 rounded-[12px]  bg-white border border-gray200 flex flex-col gap-5">
        <h2 className="text-20 text-textMain font-[700]">إعدادات الأمان</h2>
        <div className=" p-5 rounded-[12px]  bg-white border border-gray200 flex flex-col gap-5">
          <div>
            <div className="mb-5">
              <h3 className="text-20 text-textMain mb-2">
                فعّل التحقق الثنائي (2FA)
              </h3>
              <h4 className="text-16 text-textSubText">
                اختر طريقة التحقق التي تفضّلها لتأمين حسابك عند تسجيل الدخول.
                يمكنك التفعيل عبر الرسائل النصية أو تطبيق Google Authenticator.
              </h4>
            </div>

            <div className=" p-5 rounded-[12px]  bg-white border border-gray200 flex justify-between items-center gap-5 mb-5">
              <div className="flex items-center gap-5">
                <div className=" p-5 rounded-[12px]  bg-[#F2F4F7] border">
                  <Message />
                </div>
                <div className="gap-1 flex flex-col">
                  <p>SMS Verification</p>
                  <p>استقبل رمز تحقق عبر رسالة نصية إلى رقمك المسجّل.</p>
                  {smsMethod?.active ? 
                  <p className=" text-[#006557]">{ "مفعل" } </p>:
                  <p className=" text-[#F88F2D] ">{ "غير مفعل"} </p>}
                </div>
              </div>
              <SMSVerificationDialog data={smsMethodFormatted} onRevalidate={revalidateSecuritySettings}/>
            </div>
            <div className=" p-5 rounded-[12px]  bg-white border border-gray200 flex justify-between items-center gap-5 ">
              <div className="flex items-center gap-5">
                <div className=" p-5 rounded-[12px]  bg-[#F2F4F7] border">
                  <Message />
                </div>
                <div className="gap-1 flex flex-col">
                  <p>Authenticator App</p>
                  <p>استخدم تطبيق مصادقة لتوليد رمز تحقق.</p>
                  {authenticatorMethod?.active ? 
                  <p className=" text-[#006557]">{ "مفعل" } </p>:
                  <p className=" text-[#F88F2D] ">{ "غير مفعل"} </p>}
                </div>
              </div>{" "}
              <AuthenticatorDialog
                data={authenticatorMethodFormatted} 
                onRevalidate={revalidateSecuritySettings}
              />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Page;
