"use client";

import React, { useState } from "react";
import CustomDialog, { Colors } from "../CustomDialog";
import { Button } from "@/components/ui/button";
import PhoneInput from "../PhoneInput";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { DialogClose } from "@/components/ui/dialog";
import { fetcherClient } from "@/lib/fetcherClient";
import { useResponseToast } from "@/lib/toastUtils";
import { TwoFactorStatusResponseType } from "@/lib/types/TwoFactorStatusResponseType";

/**
 * مكون SMSVerificationDialog - التحقق عبر الرسائل النصية
 * يوفر واجهة ثنائية المراحل:
 * 1. المرحلة الأولى: إدخال رقم الجوال
 * 2. المرحلة الثانية: التحقق من رمز OTP (6 أرقام)
 */
interface SMSVerificationDialogProps {
  trigger?: React.ReactNode;
  onConfirm?: () => void;
  onRevalidate?: () => Promise<void>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  data:
    | {
        active: boolean;
        key: string;
        visible: boolean;
      }
    | undefined;
}

const SMSVerificationDialog = ({
  trigger,
  onConfirm,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  data,
  onRevalidate,
}: SMSVerificationDialogProps) => {
  // حالة الـ Dialog - مراقبة داخلية إذا لم يتم توفير حالة خارجية
  const [internalOpen, setInternalOpen] = React.useState(false);

  // استخدام الحالة الخارجية إذا تم توفيرها، وإلا استخدام الحالة الداخلية
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = (open: boolean) => {
    if (externalOnOpenChange) {
      externalOnOpenChange(open);
    } else {
      setInternalOpen(open);
    }
  };

  // حالة المرحلة الحالية: "phone" أو "otp"
  const [currentStep, setCurrentStep] = React.useState<"phone" | "otp">(
    "phone"
  );
  // بيانات الهاتف المدخلة من PhoneInput
  const [phoneData, setPhoneData] = React.useState({
    country_code: "",
    mobile: "",
  });
  // بيانات التحقق الثنائي من الاستجابة
  const [twoFactorData, setTwoFactorData] = React.useState<{
    secret: string;
    method: string;
    canResendAt: string;
  } | null>(null);

  // قيمة رمز التحقق (6 أرقام)
  const [otpValue, setOtpValue] = React.useState("");
  // الوقت المتبقي للعد التنازلي (بالثواني)
  const [timeLeft, setTimeLeft] = React.useState(30);
  // هل يمكن إعادة إرسال الرمز بعد انتهاء العداد
  const [canResend, setCanResend] = React.useState(false);
  // حالة التحميل
  const [isLoading, setIsLoading] = React.useState(false);
  // حالة Dialog التحذير
  const [warningDialogOpen, setWarningDialogOpen] = React.useState(false);

  const { showResponseToast } = useResponseToast();

  /** عداد العد التنازلي - يعمل فقط في مرحلة OTP */
  React.useEffect(() => {
    if (currentStep !== "otp") return;

    if (timeLeft === 0) {
      setCanResend(true);
      return;
    }

    if (!canResend) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [timeLeft, canResend, currentStep]);

  /** تنسيق الوقت من ثواني إلى صيغة MM:SS */
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  /**
   * معالج إرسال الرمز - ينتقل من مرحلة الهاتف إلى مرحلة OTP
   */
  const handleSendCode = async () => {
    setIsLoading(true);
    try {
      // التحقق من وجود بيانات الهاتف
      if (!phoneData.country_code || !phoneData.mobile) {
        showResponseToast({ success: false, message: "يرجى إدخال رقم الهاتف" });
        setIsLoading(false);
        return;
      }

      const response = await fetcherClient("/2fa/enable/sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          country_code: phoneData.country_code,
          mobile: phoneData.mobile,
        }),
      });

      showResponseToast(response as any);

      // حفظ بيانات التحقق الثنائي من الاستجابة
      if ((response as any).success && (response as any).data) {
        setTwoFactorData({
          secret: (response as any).data["2fa_secret"],
          method: (response as any).data.method,
          canResendAt: (response as any).data.can_resend_otp_at,
        });
      }

      // الانتقال إلى مرحلة OTP
      setCurrentStep("otp");
      setTimeLeft(30);
      setCanResend(false);
    } catch (error: any) {
      showResponseToast(
        error.info || { success: false, message: "حدث خطأ أثناء إرسال الرمز" }
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * معالج إعادة الإرسال - يعيد تشغيل العداد وينظف حقل OTP
   */
  const handleResend = async () => {
    if (!canResend || !phoneData.country_code || !phoneData.mobile) return;

    setIsLoading(true);
    try {
      const response = await fetcherClient("/2fa/enable/sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          country_code: phoneData.country_code,
          mobile: phoneData.mobile,
        }),
      });

      showResponseToast(response as any);

      // حفظ بيانات التحقق الثنائي الجديدة من الاستجابة
      if ((response as any).success && (response as any).data) {
        setTwoFactorData({
          secret: (response as any).data["2fa_secret"],
          method: (response as any).data.method,
          canResendAt: (response as any).data.can_resend_otp_at,
        });
      }

      // إعادة تشغيل العداد وتنظيف حقل OTP
      setTimeLeft(30);
      setCanResend(false);
      setOtpValue("");
    } catch (error: any) {
      showResponseToast(
        error.info || {
          success: false,
          message: "حدث خطأ أثناء إعادة إرسال الرمز",
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * معالج تأكيد الرمز
   */
  const handleConfirmOTP = async () => {
    setIsLoading(true);
    try {
      // التحقق من وجود بيانات التحقق الثنائي
      if (!twoFactorData) {
        showResponseToast({
          success: false,
          message: "بيانات التحقق غير متوفرة",
        });
        setIsLoading(false);
        return;
      }

      const response = await fetcherClient("/2fa/continue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          "2fa_secret": twoFactorData.secret,
          otp: otpValue,
          "2fa_method": twoFactorData.method,
        }),
      });

      showResponseToast(response as any);

      if ((response as any).success) {
        // إغلاق الـ Dialog
        setIsOpen(false);

        // تنظيف الحالات
        setTimeout(() => {
          setCurrentStep("phone");
          setPhoneData({ country_code: "", mobile: "" });
          setTwoFactorData(null);
          setOtpValue("");
          setTimeLeft(30);
          setCanResend(false);
        }, 300); // تأخير صغير لإتمام animation الإغلاق

        // استدعاء callback من الـ parent
        if (onConfirm) {
          onConfirm();
        }

        // تحديث الصفحة
        if (onRevalidate) {
          await onRevalidate();
        }
      }
    } catch (error: any) {
      showResponseToast(
        error.info || {
          success: false,
          message: "حدث خطأ أثناء التحقق من الرمز",
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  /** العودة إلى مرحلة إدخال الهاتف مع تنظيف حقل OTP وبيانات التحقق الثنائي */
  const handleBack = () => {
    setCurrentStep("phone");
    setOtpValue("");
    setTwoFactorData(null);
  };

  /**
   * تنسيق عرض رقم الهاتف - إظهار آخر 3 أرقام فقط للخصوصية
   * مثال: "•••678"
   */
  const formatPhoneDisplay = (phone: string) => {
    if (!phone) return "رقمك المسجل";
    const lastDigits = phone.slice(-3);
    return `•••${lastDigits}`;
  };

  /** معالج فتح Dialog التحذير عند الضغط على إلغاء التفعيل */
  const handleOpenWarningDialog = () => {
    setWarningDialogOpen(true);
  };

  /** معالج تأكيد إلغاء التفعيل */
  const handleConfirmDisable = async () => {
    setIsLoading(true);
    try {
      const response = await fetcherClient("/2fa/disable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          "2fa_method": "sms",
        }),
      });

      showResponseToast(response as any);

      if ((response as any).success) {
        setWarningDialogOpen(false);
        // استدعاء callback من الـ parent
        if (onConfirm) {
          onConfirm();
        }
        // تحديث الصفحة
        if (onRevalidate) {
          await onRevalidate();
        }
      }
    } catch (error: any) {
      showResponseToast(
        error.info || { success: false, message: "حدث خطأ أثناء إلغاء التفعيل" }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <CustomDialog
        className="max-w-[628px]"
        title={
          currentStep === "phone"
            ? "التفعيل عبر الرسائل النصية"
            : "أدخل رمز التحقق"
        }
        trigger={
          trigger || (
            <>
              {!data?.active ? (
                <div
                  className=" text-[#11489B] font-[600] cursor-pointer hover:opacity-80 transition"
                  onClick={() => setIsOpen(true)}
                  style={{
                    opacity: isLoading ? 0.6 : 1,
                    pointerEvents: isLoading ? "none" : "auto",
                  }}
                >
                  {isLoading ? "جاري التحميل..." : "فعل الآن"}
                </div>
              ) : (
                <div
                  className=" text-[#FF0000] font-[600] cursor-pointer hover:opacity-80 transition"
                  onClick={handleOpenWarningDialog}
                  style={{
                    opacity: isLoading ? 0.6 : 1,
                    pointerEvents: isLoading ? "none" : "auto",
                  }}
                >
                  {isLoading ? "جاري التحميل..." : "إلغاء التفعيل"}
                </div>
              )}
            </>
          )
        }
        color={Colors.primary}
        open={isOpen}
        onOpenChange={setIsOpen}
        content={
          currentStep === "phone" ? (
            // مرحلة 1: إدخال رقم الهاتف
            <>
              <h3 className="text-24 text-textMain font-[700] mb-3">
                إدخال رقم الجوال
              </h3>
              <p className="text-16 text-textSubText mb-5">
                سنرسل رمز تحقق مكوّن من 6 أرقام إلى رقمك لتفعيل التحقق الثنائي
                (2FA).
              </p>
              <div className="space-y-6 flex flex-col items-center w-full">
                {/* حقل إدخال رقم الجوال مع اختيار الدولة */}
                <PhoneInput onPhoneChange={setPhoneData} />

                {/* أزرار المرحلة الأولى */}
                <div className="w-full flex gap-2 flex-col">
                  <Button
                    className="bg-primaryColor hover:bg-primaryColor"
                    size="lg"
                    onClick={handleSendCode}
                    disabled={isLoading}
                  >
                    {isLoading ? "جاري الإرسال..." : "إرسال الرمز"}
                  </Button>
                  <DialogClose asChild>
                    <Button size="lg" variant="ghost">
                      إلغاء
                    </Button>
                  </DialogClose>
                </div>
              </div>
            </>
          ) : (
            // مرحلة 2: إدخال رمز التحقق (OTP)
            <>
              <h3 className="text-24 text-textMain font-[700] mb-3">
                أدخل رمز التحقق
              </h3>
              <p className="text-16 text-textSubText mb-5">
                تم إرسال رمز مكوّن من 6 أرقام إلى رقمك المنتهي بـ{" "}
                <span className="font-semibold">
                  {formatPhoneDisplay(phoneData.mobile)}
                </span>
                . أدخل الرمز أدناه لإتمام التحقق.{" "}
                <span
                  onClick={handleBack}
                  className="text-primaryColor underline cursor-pointer hover:text-primaryColor/80"
                >
                  تعديل الرقم
                </span>
              </p>
              <div className="space-y-6 flex flex-col items-center w-full">
                {/* حقول إدخال OTP - 6 حقول منفصلة */}
                <div className="w-full space-y-4 flex flex-col justify-center items-center">
                  <InputOTP
                    maxLength={6}
                    value={otpValue}
                    onChange={setOtpValue}
                    dir="ltr"
                    className="flex flex-row gap-3 justify-center"
                  >
                    <InputOTPGroup className="flex flex-row gap-3 justify-center text-left">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <InputOTPSlot
                          key={i}
                          index={i}
                          className="w-14 h-14 text-2xl flex items-center justify-center border-2 border-gray-300 rounded-md focus:border-blue-600 focus:ring-0 transition-colors duration-150 text-center"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {/* العداد والوقت المتبقي */}
                <div className="text-center space-y-3 w-full">
                  {!canResend && (
                    <div className="text-sm text-primaryColor font-medium font-mono">
                      {formatTime(timeLeft)} s
                    </div>
                  )}
                </div>

                {/* زر إعادة الإرسال - يظهر بعد انتهاء العداد */}
                <button
                  onClick={handleResend}
                  className={`${
                    canResend && !isLoading
                      ? "text-primaryColor cursor-pointer"
                      : "text-gray-400 cursor-not-allowed"
                  } font-medium text-sm transition-colors duration-200 mx-auto block`}
                  disabled={!canResend || isLoading}
                >
                  {isLoading ? "جاري الإرسال..." : "إعادة إرسال"}
                </button>

                {/* أزرار المرحلة الثانية */}
                <div className="w-full flex gap-2 flex-col">
                  <Button
                    className={`${
                      otpValue.length === 6 && !isLoading
                        ? "bg-primaryColor hover:bg-primaryColor"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                    disabled={otpValue.length !== 6 || isLoading}
                    size="lg"
                    onClick={handleConfirmOTP}
                  >
                    {isLoading ? "جاري التحقق..." : "تأكيد"}
                  </Button>
                  <DialogClose asChild>
                    <Button size="lg" variant="ghost">
                      إلغاء
                    </Button>
                  </DialogClose>
                </div>
              </div>
            </>
          )
        }
      />
      {/* Dialog التحذير لإلغاء التفعيل */}
      <CustomDialog
        className="max-w-[628px]"
        title="تنبيه هام"
        trigger={<></>}
        color={Colors.error}
        open={warningDialogOpen}
        onOpenChange={setWarningDialogOpen}
        content={
          <div className="flex flex-col items-center justify-center gap-6 py-4">
            {/* أيقونة التحذير */}
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* النص الرئيسي */}
            <div className="text-center">
              <h3 className="text-20 text-textMain font-[700] mb-3">
                هل تريد إلغاء التحقق عبر الرسائل النصية؟
              </h3>
              <p className="text-16 text-textSubText">
                بإلغاء هذه الطريقة، لن تستقبل رموز التحقق عبر الرسائل النصية عند
                تسجيل الدخول.
              </p>
            </div>

            {/* الأزرار */}
            <div className="w-full flex flex-col gap-3 mt-2">
              <Button
                className="w-full border-2 border-red-600 bg-white text-red-600 hover:bg-red-50"
                size="lg"
                onClick={handleConfirmDisable}
                disabled={isLoading}
              >
                {isLoading ? "جاري المعالجة..." : "تأكيد الإلغاء"}
              </Button>
              <Button
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                size="lg"
                onClick={() => setWarningDialogOpen(false)}
                disabled={isLoading}
              >
                عودة
              </Button>
            </div>
          </div>
        }
      />
    </>
  );
};

export default SMSVerificationDialog;
