"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { fetcherClient } from "@/lib/fetcherClient";
import { FetcherError } from "@/lib/fetcherTypes";
import { useToast } from "@/hooks/use-toast";

interface TwoFactorOTPVerificationProps {
  method: "sms" | "authenticator";
  userId: number;
  twoFactorSecret: string;
  onVerify: (token: string) => void;
  onCancel: () => void;
  onResend?: () => Promise<void>;
  showResend?: boolean;
}

const TwoFactorOTPVerification: React.FC<TwoFactorOTPVerificationProps> = ({
  method,
  userId,
  twoFactorSecret,
  onVerify,
  onCancel,
  onResend,
  showResend = true,
}) => {
  const [otpValue, setOtpValue] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Timer countdown
  useEffect(() => {
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
  }, [timeLeft, canResend]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVerify = async () => {
    if (otpValue.length !== 6) {
      toast({
        description: "الرجاء إدخال رمز التحقق المكون من 6 أرقام",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const formdata = new FormData();
      formdata.append("user_id", userId.toString());
      formdata.append("2fa_secret", twoFactorSecret);
      formdata.append("2fa_method", method);
      formdata.append("otp", otpValue);

      const response = await fetcherClient<{
        success: boolean;
        message: string;
        data: { token: string };
      }>("/2fa/login/verify", {
        method: "POST",
        body: formdata,
      });

      toast({
        description: response.message,
        variant: "default",
      });

      onVerify(response.data.token);
    } catch (error: unknown) {
      const errorMessage = (error as FetcherError)?.info?.message || "خطأ في التحقق";
      toast({
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || isLoading) return;

    setIsLoading(true);
    try {
      if (onResend) {
        await onResend();
        setOtpValue("");
        setTimeLeft(30);
        setCanResend(false);
        toast({
          description: "تم إرسال رمز التحقق بنجاح",
          variant: "default",
        });
      }
    } catch (error: unknown) {
      const errorMessage = (error as FetcherError)?.info?.message || "خطأ في إعادة الإرسال";
      toast({
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const methodLabel =
    method === "sms"
      ? "التحقق عبر الرسائل النصية (SMS)"
      : "التحقق عبر (Authenticator App)";

  const methodInstructions =
    method === "sms"
      ? "أرسلنا لك رمز تحقق عبر رسالة نصية. أدخل الرمز لإكمال التحقق. في حال واجهت مشكلة، تواصل مع مديرك أو خدمة العملاء."
      : "أدخل رمز التحقق من تطبيق المصادقة لإكمال التحقق. في حال واجهت مشكلة، تواصل مع مديرك أو خدمة العملاء.";

  return (
    <div className="flex flex-col gap-5 w-full">
      <h1 className="text-24 font-[700] bg-clip-text text-transparent bg-primaryColor">
        {methodLabel}
      </h1>
      <p className="text-18 text-textSubText mb-5 -mt-4">
        {methodInstructions}
      </p>

      <div className="space-y-6 flex flex-col items-center w-full">
        {/* OTP Input Fields */}
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

        {/* Timer and Resend */}
        {showResend && (
          <div className="text-center space-y-3 w-full">
            {!canResend && (
              <div className="text-sm text-primaryColor font-medium font-mono">
                {formatTime(timeLeft)} s
              </div>
            )}
            <button
              onClick={handleResend}
              className={`${
                canResend && !isLoading
                  ? "text-primaryColor cursor-pointer"
                  : "text-gray-400 cursor-not-allowed"
              } font-medium text-sm transition-colors duration-200 mx-auto block flex items-center gap-2`}
              disabled={!canResend || isLoading}
            >
              {isLoading ? "جاري الإرسال..." : "إعادة إرسال"}
              {canResend && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 4V10H7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M23 20V14H17"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3 mt-2">
          <Button
            type="button"
            variant="primary"
            onClick={handleVerify}
            disabled={otpValue.length !== 6 || isLoading}
            className="w-full"
          >
            {isLoading ? "جاري التحقق..." : "تسجيل الدخول"}
          </Button>
          <button
            type="button"
            onClick={onCancel}
            className="text-16 text-textMain hover:text-primaryColor transition-colors text-center"
            disabled={isLoading}
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorOTPVerification;

